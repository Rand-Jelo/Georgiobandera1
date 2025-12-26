'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { Product } from '@/types/database';

export default function AdminProductsPage() {
  const router = useRouter();
  const locale = useLocale();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'delete' | 'status' | 'category' | 'featured' | ''>('');
  const [bulkValue, setBulkValue] = useState<string>('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name_en: string; name_sv: string }>>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json() as { user?: { is_admin?: boolean } };
      if (!data.user || !data.user.is_admin) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      fetchProducts();
      fetchCategories();
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json() as { categories?: Array<{ id: string; name_en: string; name_sv: string; children?: any[] }> };
      if (data.categories) {
        // Flatten categories (include parent and children)
        const flattenCategories = (cats: typeof data.categories): Array<{ id: string; name_en: string; name_sv: string }> => {
          const result: Array<{ id: string; name_en: string; name_sv: string }> = [];
          for (const cat of cats) {
            result.push({ id: cat.id, name_en: cat.name_en, name_sv: cat.name_sv });
            if (cat.children && cat.children.length > 0) {
              result.push(...flattenCategories(cat.children));
            }
          }
          return result;
        };
        setCategories(flattenCategories(data.categories));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      // Fetch all products without search - we'll filter client-side
      const url = `/api/admin/products/list${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json() as { products?: Product[] };
      setAllProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  useEffect(() => {
    if (!isAdmin) return;

    let filtered = [...allProducts];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product => {
        const nameEn = product.name_en?.toLowerCase() || '';
        const nameSv = product.name_sv?.toLowerCase() || '';
        const sku = product.sku?.toLowerCase() || '';
        const slug = product.slug?.toLowerCase() || '';
        return nameEn.includes(query) || 
               nameSv.includes(query) || 
               sku.includes(query) || 
               slug.includes(query);
      });
    }

    setProducts(filtered);
  }, [allProducts, searchQuery, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, isAdmin]);

  const handleDelete = async (productId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!confirm('Are you sure you want to permanently delete this product? This action cannot be undone and will delete all related data (variants, images, reviews, etc.).')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert('Failed to delete product');
        return;
      }

      // Refresh products list
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(products.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkOperation = async () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product');
      return;
    }

    if (!bulkAction) {
      alert('Please select an action');
      return;
    }

    let confirmMessage = '';
    switch (bulkAction) {
      case 'delete':
        confirmMessage = `Are you sure you want to archive ${selectedProducts.size} product(s)?`;
        break;
      case 'status':
        if (!bulkValue) {
          alert('Please select a status');
          return;
        }
        confirmMessage = `Are you sure you want to set ${selectedProducts.size} product(s) to "${bulkValue}"?`;
        break;
      case 'category':
        confirmMessage = `Are you sure you want to update category for ${selectedProducts.size} product(s)?`;
        break;
      case 'featured':
        const featuredValue = bulkValue === 'true';
        confirmMessage = `Are you sure you want to ${featuredValue ? 'mark' : 'unmark'} ${selectedProducts.size} product(s) as featured?`;
        break;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setBulkProcessing(true);
    try {
      const body: any = {
        productIds: Array.from(selectedProducts),
        action: bulkAction,
      };

      if (bulkAction === 'status' || bulkAction === 'category') {
        body.value = bulkValue || null;
      } else if (bulkAction === 'featured') {
        body.value = bulkValue === 'true';
      }

      const response = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json() as { success?: boolean; error?: string; message?: string; updated?: number };

      if (!response.ok) {
        alert(data.error || 'Failed to perform bulk operation');
        return;
      }

      alert(data.message || `Successfully updated ${data.updated || selectedProducts.size} product(s)`);
      
      // Reset selections and form
      setSelectedProducts(new Set());
      setBulkAction('');
      setBulkValue('');
      
      // Refresh products list
      fetchProducts();
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      alert('Failed to perform bulk operation');
    } finally {
      setBulkProcessing(false);
    }
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-12 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-semibold text-white mb-2">Products</h1>
            <p className="text-neutral-400">Manage your product catalog</p>
          </div>
          <Link
            href="/admin/products/new"
            className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black hover:bg-neutral-100 transition-colors"
          >
            Add Product
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search products by name, SKU, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-400">Filter by status:</span>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'draft', 'active', 'archived'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    statusFilter === status
                      ? 'bg-white text-black'
                      : 'bg-black/50 text-neutral-300 hover:bg-black/70 border border-white/10'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedProducts.size > 0 && (
          <div className="mb-4 bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-white font-medium">
                {selectedProducts.size} product(s) selected
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <select
                  value={bulkAction}
                  onChange={(e) => {
                    setBulkAction(e.target.value as typeof bulkAction);
                    setBulkValue('');
                  }}
                  className="px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <option value="">Select action...</option>
                  <option value="delete">Archive Selected</option>
                  <option value="status">Change Status</option>
                  <option value="category">Change Category</option>
                  <option value="featured">Toggle Featured</option>
                </select>

                {bulkAction === 'status' && (
                  <select
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    className="px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    <option value="">Select status...</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                )}

                {bulkAction === 'category' && (
                  <select
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    className="px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    <option value="">No Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {locale === 'sv' ? cat.name_sv : cat.name_en}
                      </option>
                    ))}
                  </select>
                )}

                {bulkAction === 'featured' && (
                  <select
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    className="px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    <option value="">Select...</option>
                    <option value="true">Mark as Featured</option>
                    <option value="false">Remove from Featured</option>
                  </select>
                )}

                <button
                  onClick={handleBulkOperation}
                  disabled={bulkProcessing || !bulkAction || (bulkAction !== 'delete' && !bulkValue)}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-black hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {bulkProcessing ? 'Processing...' : 'Apply'}
                </button>

                <button
                  onClick={() => {
                    setSelectedProducts(new Set());
                    setBulkAction('');
                    setBulkValue('');
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-black/50 text-white hover:bg-black/70 border border-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-black/50 border border-white/10 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-black/70">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size > 0 && selectedProducts.size === products.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {products.map((product) => {
                const name = locale === 'sv' ? product.name_sv : product.name_en;
                return (
                  <tr key={product.id} className="hover:bg-black/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-400">{product.sku || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{product.price} SEK</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          product.status === 'active'
                            ? 'bg-green-500/20 text-green-300'
                            : product.status === 'draft'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-400">
                        {product.track_inventory ? product.stock_quantity : '∞'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-white hover:text-neutral-300 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(product.id, e)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

