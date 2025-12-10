'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { Category, Product } from '@/types/database';

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

export default function EditProductPage() {
  const router = useRouter();
  const locale = useLocale();
  const params = useParams();
  const productId = params.id as string;
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name_en: '',
    name_sv: '',
    slug: '',
    description_en: '',
    description_sv: '',
    category_id: '',
    price: '',
    compare_at_price: '',
    sku: '',
    status: 'draft' as 'draft' | 'active' | 'archived',
    featured: false,
    stock_quantity: '0',
    track_inventory: true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [productId]);

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
      await Promise.all([fetchCategories(), fetchProduct()]);
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json() as { categories?: CategoryWithChildren[] };
      const flattenCategories = (cats: CategoryWithChildren[]): Category[] => {
        const result: Category[] = [];
        cats.forEach((cat) => {
          result.push(cat);
          if (cat.children) {
            result.push(...flattenCategories(cat.children));
          }
        });
        return result;
      };
      setCategories(flattenCategories(data.categories || []));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);
      if (!response.ok) {
        setError('Product not found');
        return;
      }

      const data = await response.json() as { product?: Product };
      if (data.product) {
        setFormData({
          name_en: data.product.name_en,
          name_sv: data.product.name_sv,
          slug: data.product.slug,
          description_en: data.product.description_en || '',
          description_sv: data.product.description_sv || '',
          category_id: data.product.category_id || '',
          price: data.product.price.toString(),
          compare_at_price: data.product.compare_at_price?.toString() || '',
          sku: data.product.sku || '',
          status: data.product.status,
          featured: data.product.featured || false,
          stock_quantity: data.product.stock_quantity.toString(),
          track_inventory: data.product.track_inventory,
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
          stock_quantity: parseInt(formData.stock_quantity),
          category_id: formData.category_id || null,
        }),
      });

      const data = await response.json() as { error?: string; product?: any };

      if (!response.ok) {
        setError(data.error || 'Failed to update product');
        setSaving(false);
        return;
      }

      router.push('/admin/products');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setSaving(false);
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <Link
            href="/admin/products"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            ← Back to Products
          </Link>
          <h1 className="text-4xl font-semibold text-white mb-2">Edit Product</h1>
          <p className="text-neutral-400">Update product information</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-black/50 border border-white/10 rounded-lg p-6 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-4">
              <div className="text-sm text-red-300">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name_en" className="block text-sm font-medium text-neutral-300 mb-2">
                Product Name (English) *
              </label>
              <input
                type="text"
                id="name_en"
                name="name_en"
                required
                value={formData.name_en}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>

            <div>
              <label htmlFor="name_sv" className="block text-sm font-medium text-neutral-300 mb-2">
                Product Name (Swedish) *
              </label>
              <input
                type="text"
                id="name_sv"
                name="name_sv"
                required
                value={formData.name_sv}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-neutral-300 mb-2">
              Slug *
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              value={formData.slug}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="description_en" className="block text-sm font-medium text-neutral-300 mb-2">
                Description (English)
              </label>
              <textarea
                id="description_en"
                name="description_en"
                rows={4}
                value={formData.description_en}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>

            <div>
              <label htmlFor="description_sv" className="block text-sm font-medium text-neutral-300 mb-2">
                Description (Swedish)
              </label>
              <textarea
                id="description_sv"
                name="description_sv"
                rows={4}
                value={formData.description_sv}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-neutral-300 mb-2">
                Category
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              >
                <option value="">No category</option>
                {categories.map((cat) => {
                  const name = locale === 'sv' ? cat.name_sv : cat.name_en;
                  return (
                    <option key={cat.id} value={cat.id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-neutral-300 mb-2">
                SKU
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-neutral-300 mb-2">
                Price (SEK) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>

            <div>
              <label htmlFor="compare_at_price" className="block text-sm font-medium text-neutral-300 mb-2">
                Compare at Price (SEK)
              </label>
              <input
                type="number"
                id="compare_at_price"
                name="compare_at_price"
                step="0.01"
                min="0"
                value={formData.compare_at_price}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-300 mb-2">
                Status *
              </label>
              <select
                id="status"
                name="status"
                required
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="stock_quantity" className="block text-sm font-medium text-neutral-300 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                id="stock_quantity"
                name="stock_quantity"
                min="0"
                value={formData.stock_quantity}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="track_inventory"
                  checked={formData.track_inventory}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30"
                />
                <span className="text-sm text-neutral-300">Track inventory</span>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-5 h-5 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30"
              />
              <span className="text-sm text-neutral-300">Featured product</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
            <Link
              href="/admin/products"
              className="px-6 py-3 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-sm font-medium rounded-lg text-black bg-white hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

