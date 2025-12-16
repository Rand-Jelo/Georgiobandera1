'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';
import QuickViewModal from '@/components/product/QuickViewModal';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  name_en: string;
  name_sv: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  track_inventory: boolean;
  images?: Array<{ url: string; alt_text_en?: string | null }>;
  category?: {
    id: string;
    name_en: string;
    name_sv: string;
    slug: string;
  } | null;
}

interface Category {
  id: string;
  name_en: string;
  name_sv: string;
  slug: string;
  children?: Category[];
}

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
type ViewMode = 'grid' | 'list';

const ITEMS_PER_PAGE = 12;

export default function ShopPage() {
  const t = useTranslations('common');
  const tProduct = useTranslations('product');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Filters
  const [filters, setFilters] = useState<{
    categoryIds: string[];
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }>({
    categoryIds: [],
    minPrice: undefined,
    maxPrice: undefined,
    inStock: undefined,
  });

  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Load categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products when filters, sort, or page changes
  useEffect(() => {
    fetchProducts();
    fetchProductCount();
  }, [filters, sortBy, currentPage]);

  // Sync URL params with state
  useEffect(() => {
    const categoryIds = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const inStockParam = searchParams.get('inStock');
    const inStock = inStockParam === 'true' ? true : inStockParam === 'false' ? false : undefined;
    const sort = (searchParams.get('sort') as SortOption) || 'newest';
    const page = parseInt(searchParams.get('page') || '1');

    setFilters({ categoryIds, minPrice, maxPrice, inStock });
    setSortBy(sort);
    setCurrentPage(page);
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json() as { categories: Category[] };
      // Flatten categories for filter list
      const flattenCategories = (cats: Category[]): Category[] => {
        const result: Category[] = [];
        cats.forEach(cat => {
          result.push(cat);
          if (cat.children) {
            result.push(...flattenCategories(cat.children));
          }
        });
        return result;
      };
      setCategories(flattenCategories(data.categories || []));
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const updateURL = useCallback((newFilters: {
    categoryIds: string[];
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }, newSort: SortOption, newPage: number) => {
    const params = new URLSearchParams();
    if (newFilters.categoryIds.length > 0) {
      params.set('categories', newFilters.categoryIds.join(','));
    }
    if (newFilters.minPrice !== undefined) {
      params.set('minPrice', newFilters.minPrice.toString());
    }
    if (newFilters.maxPrice !== undefined) {
      params.set('maxPrice', newFilters.maxPrice.toString());
    }
    if (newFilters.inStock !== undefined) {
      params.set('inStock', newFilters.inStock.toString());
    }
    if (newSort !== 'newest') {
      params.set('sort', newSort);
    }
    if (newPage > 1) {
      params.set('page', newPage.toString());
    }
    router.push(`/shop?${params.toString()}`);
  }, [router]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', 'active');
      if (filters.categoryIds.length > 0) {
        params.set('categoryIds', filters.categoryIds.join(','));
      }
      if (filters.minPrice !== undefined) {
        params.set('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice !== undefined) {
        params.set('maxPrice', filters.maxPrice.toString());
      }
      if (filters.inStock !== undefined) {
        params.set('inStock', filters.inStock.toString());
      }
      params.set('sortBy', sortBy);
      params.set('limit', ITEMS_PER_PAGE.toString());
      params.set('offset', ((currentPage - 1) * ITEMS_PER_PAGE).toString());

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json() as { products?: Product[]; error?: string };
      
      if (data.error) {
        setError(data.error);
      } else {
        setProducts(data.products || []);
      }
    } catch (err) {
      setError('Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductCount = async () => {
    try {
      const params = new URLSearchParams();
      params.set('status', 'active');
      if (filters.categoryIds.length > 0) {
        params.set('categoryIds', filters.categoryIds.join(','));
      }
      if (filters.minPrice !== undefined) {
        params.set('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice !== undefined) {
        params.set('maxPrice', filters.maxPrice.toString());
      }
      if (filters.inStock !== undefined) {
        params.set('inStock', filters.inStock.toString());
      }

      const response = await fetch(`/api/products/count?${params.toString()}`);
      const data = await response.json() as { count?: number; error?: string };
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error('Error fetching product count:', err);
    }
  };

  const handleFiltersChange = (newFilters: {
    categoryIds: string[];
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }) => {
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, sortBy, 1);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setCurrentPage(1);
    updateURL(filters, newSort, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL(filters, sortBy, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 relative">
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
        </div>
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30 mx-auto"></div>
          <p className="mt-4 text-neutral-400">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 relative">
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
        </div>
        <div className="text-center relative z-10">
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-12 relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-semibold text-white">{t('shop')}</h1>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 border border-white/20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
                aria-label="Grid view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
                aria-label="List view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="newest">{tProduct('sortNewest') || 'Newest'}</option>
              <option value="oldest">{tProduct('sortOldest') || 'Oldest'}</option>
              <option value="price_asc">{tProduct('sortPriceLow') || 'Price: Low to High'}</option>
              <option value="price_desc">{tProduct('sortPriceHigh') || 'Price: High to Low'}</option>
              <option value="name_asc">{tProduct('sortNameAsc') || 'Name: A-Z'}</option>
              <option value="name_desc">{tProduct('sortNameDesc') || 'Name: Z-A'}</option>
            </select>

            {/* Filters Button (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 transition-colors"
            >
              {tProduct('filters') || 'Filters'}
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ProductFilters
              categories={categories}
              locale={locale}
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </aside>

          {/* Filters Modal (Mobile) */}
          {showFilters && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
              <div className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto">
                <ProductFilters
                  categories={categories}
                  locale={locale}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClose={() => setShowFilters(false)}
                />
              </div>
            </div>
          )}

          {/* Products Grid/List */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-400 text-lg">No products found.</p>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
                }>
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      locale={locale as string}
                      showQuickAdd={true}
                      viewMode={viewMode}
                      onQuickView={() => setQuickViewProduct(product)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              currentPage === page
                                ? 'bg-white text-neutral-900'
                                : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="text-white/60">...</span>;
                      }
                      return null;
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}

                {/* Results count */}
                <div className="mt-8 text-center text-neutral-400 text-sm">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} products
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
