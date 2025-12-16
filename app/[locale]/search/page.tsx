'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';
import QuickViewModal from '@/components/product/QuickViewModal';

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
  parent_id?: string | null;
  children?: Category[];
}

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
type ViewMode = 'grid' | 'list';

const ITEMS_PER_PAGE = 12;

export default function SearchPage() {
  const t = useTranslations('common');
  const tProduct = useTranslations('product');
  const tSearch = useTranslations('search');
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

  // Get search query from URL
  const searchQuery = searchParams.get('q') || '';

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

  // Fetch products when filters, sort, page, or search query changes
  useEffect(() => {
    if (searchQuery) {
      fetchProducts();
      fetchProductCount();
    }
  }, [filters, sortBy, currentPage, searchQuery]);

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
      setCategories(data.categories || []);
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
    params.set('q', searchQuery);
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
    router.push(`/search?${params.toString()}`);
  }, [router, searchQuery]);

  // Helper function to get all child category IDs recursively from nested structure
  const getAllChildCategoryIds = (categoryId: string, allCategories: Category[]): string[] => {
    const result: string[] = [categoryId];
    
    const findCategory = (cats: Category[], id: string): Category | null => {
      for (const cat of cats) {
        if (cat.id === id) {
          return cat;
        }
        if (cat.children) {
          const found = findCategory(cat.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const collectDescendants = (cat: Category): void => {
      if (cat.children) {
        cat.children.forEach(child => {
          result.push(child.id);
          collectDescendants(child);
        });
      }
    };
    
    const category = findCategory(allCategories, categoryId);
    if (category) {
      collectDescendants(category);
    }
    
    return result;
  };

  // Expand parent categories to include all child categories
  const expandCategoryIds = (categoryIds: string[]): string[] => {
    const expanded: string[] = [];
    categoryIds.forEach(categoryId => {
      expanded.push(...getAllChildCategoryIds(categoryId, categories));
    });
    return [...new Set(expanded)];
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', 'active');
      params.set('search', searchQuery);
      if (filters.categoryIds.length > 0) {
        const expandedCategoryIds = expandCategoryIds(filters.categoryIds);
        params.set('categoryIds', expandedCategoryIds.join(','));
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
      params.set('search', searchQuery);
      if (filters.categoryIds.length > 0) {
        const expandedCategoryIds = expandCategoryIds(filters.categoryIds);
        params.set('categoryIds', expandedCategoryIds.join(','));
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
      
      if (data.error) {
        console.error('Error fetching product count:', data.error);
      } else {
        setTotalCount(data.count || 0);
      }
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

  if (!searchQuery) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-semibold text-neutral-900 mb-4">
              {tSearch('noQuery') || 'Search Products'}
            </h1>
            <p className="text-neutral-600">
              {tSearch('enterSearchTerm') || 'Please enter a search term to find products.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-neutral-900 mb-2">
            {tSearch('searchResults') || 'Search Results'}
          </h1>
          <p className="text-neutral-600">
            {totalCount > 0
              ? tSearch('foundResults', { count: totalCount, query: searchQuery }) || 
                `Found ${totalCount} result${totalCount !== 1 ? 's' : ''} for "${searchQuery}"`
              : tSearch('noResults', { query: searchQuery }) || 
                `No results found for "${searchQuery}"`}
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block">
            <ProductFilters
              categories={categories}
              locale={locale as string}
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </aside>

          {/* Products Grid/List */}
          <div className="lg:col-span-3">
            {/* Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 border border-neutral-300 rounded-lg p-1 bg-white">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-600 hover:text-neutral-900'
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
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-600 hover:text-neutral-900'
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
                  className="px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                >
                  <option value="newest">{tProduct('sortNewest') || 'Newest'}</option>
                  <option value="oldest">{tProduct('sortOldest') || 'Oldest'}</option>
                  <option value="price_asc">{tProduct('sortPriceLow') || 'Price: Low to High'}</option>
                  <option value="price_desc">{tProduct('sortPriceHigh') || 'Price: High to Low'}</option>
                  <option value="name_asc">{tProduct('sortNameAsc') || 'Name: A-Z'}</option>
                  <option value="name_desc">{tProduct('sortNameDesc') || 'Name: Z-A'}</option>
                </select>
              </div>

              {/* Filters Button (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden px-4 py-2 bg-neutral-900 border border-neutral-900 rounded-lg text-white text-sm hover:bg-neutral-800 transition-colors"
              >
                {tProduct('filters') || 'Filters'}
              </button>
            </div>

            {/* Products */}
            {products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-600 text-lg mb-4">
                  {tSearch('noResults', { query: searchQuery }) || `No results found for "${searchQuery}"`}
                </p>
                <p className="text-neutral-500 text-sm">
                  {tSearch('tryDifferentKeywords') || 'Try different keywords or check your spelling.'}
                </p>
              </div>
            ) : (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-6'
                  }
                >
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      locale={locale as string}
                      showQuickAdd={true}
                      onQuickViewClick={(productId) => {
                        const foundProduct = products.find(p => p.id === productId);
                        if (foundProduct) setQuickViewProduct(foundProduct);
                      }}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                    >
                      {tProduct('previous') || 'Previous'}
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
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
                                ? 'bg-neutral-900 text-white'
                                : 'bg-white border border-neutral-300 text-neutral-900 hover:bg-neutral-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="text-neutral-400">...</span>;
                      }
                      return null;
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                    >
                      {tProduct('next') || 'Next'}
                    </button>
                  </div>
                )}

                {/* Results count */}
                <div className="mt-8 text-center text-neutral-600 text-sm">
                  {tProduct('showingProducts', {
                    start: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                    end: Math.min(currentPage * ITEMS_PER_PAGE, totalCount),
                    total: totalCount,
                  }) || `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of ${totalCount} products`}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Filters Modal */}
        {showFilters && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
            <div className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto shadow-xl">
              <ProductFilters
                categories={categories}
                locale={locale as string}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClose={() => setShowFilters(false)}
              />
            </div>
          </div>
        )}

        {/* Quick View Modal */}
        {quickViewProduct && (
          <QuickViewModal
            product={quickViewProduct}
            onClose={() => setQuickViewProduct(null)}
            locale={locale as string}
          />
        )}
      </div>
    </div>
  );
}

