'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';
import QuickViewModal from '@/components/product/QuickViewModal';
import SearchInput from '@/components/search/SearchInput';
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
  parent_id?: string | null;
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
      // Keep nested structure for filters
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

  // Helper function to get all child category IDs recursively from nested structure
  const getAllChildCategoryIds = (categoryId: string, allCategories: Category[]): string[] => {
    const result: string[] = [categoryId];
    
    // Find the category in the nested structure
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
    
    // Recursively collect all descendant IDs
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

    // For each selected category, add it and all its children
    categoryIds.forEach(categoryId => {
      expanded.push(...getAllChildCategoryIds(categoryId, categories));
    });

    // Remove duplicates
    return [...new Set(expanded)];
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', 'active');
      if (filters.categoryIds.length > 0) {
        // Expand parent categories to include all child categories
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
      if (filters.categoryIds.length > 0) {
        // Expand parent categories to include all child categories
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-neutral-200 border-t-amber-500"></div>
          <p className="mt-6 text-neutral-500 font-light tracking-wide">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 font-light">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Matching Homepage */}
      <section className="relative bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
        {/* Elegant background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,_transparent,_transparent_2px,_rgba(255,255,255,0.02)_2px,_rgba(255,255,255,0.02)_4px)]" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="max-w-4xl">
            {/* Elegant subtitle */}
            <div className="inline-block mb-4 sm:mb-6">
              <p className="text-[9px] sm:text-[10px] font-light uppercase tracking-[0.4em] text-amber-400/80">
                Our Collection
              </p>
              <div className="mt-2 h-px w-12 sm:w-16 bg-gradient-to-r from-amber-500/50 to-transparent" />
            </div>
            
            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extralight tracking-[0.02em] leading-[1.1] mb-4 sm:mb-6">
              {t('shop')}
            </h1>
            
            {/* Description */}
            <p className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed max-w-2xl mb-6 sm:mb-8">
              {totalCount > 0 
                ? `Discover ${totalCount} premium products crafted for excellence`
                : 'Browse our curated collection of professional hair care products'
              }
            </p>

            {/* Search Bar - Integrated */}
            <div className="max-w-2xl">
              <SearchInput />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">

        <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 lg:gap-16">
          {/* Filters Sidebar (Desktop) - Redesigned */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-8">
              {/* Filter Header */}
              <div className="mb-8 pb-6 border-b border-neutral-200/50">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-light uppercase tracking-[0.3em] text-neutral-500">
                    {tProduct('filters') || 'Filters'}
                  </h2>
                  {(filters.categoryIds.length > 0 || filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.inStock !== undefined) && (
                    <button
                      onClick={handleFiltersChange.bind(null, { categoryIds: [], minPrice: undefined, maxPrice: undefined, inStock: undefined })}
                      className="text-xs font-light text-neutral-400 hover:text-amber-600 transition-colors duration-300"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="h-px w-12 bg-gradient-to-r from-amber-500/40 to-transparent mt-4" />
              </div>
              
              {/* Filters Content */}
              <div className="space-y-8">
                <ProductFilters
                  categories={categories}
                  locale={locale}
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                />
              </div>
            </div>
          </aside>

          {/* Filters Modal (Mobile) - Refined */}
          {showFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
              <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-neutral-200/50 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between z-10 backdrop-blur-sm">
                  <div>
                    <h2 className="text-xs sm:text-sm font-light uppercase tracking-[0.3em] text-neutral-500 mb-1">{tProduct('filters') || 'Filters'}</h2>
                    <div className="h-px w-10 sm:w-12 bg-gradient-to-r from-amber-500/40 to-transparent" />
                  </div>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-1.5 sm:p-2 text-neutral-400 hover:text-neutral-900 transition-colors duration-300"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 sm:p-6">
                  <ProductFilters
                    categories={categories}
                    locale={locale}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onClose={() => setShowFilters(false)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main Products Area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar - Refined */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-8 sm:mb-10">
              {/* Results count */}
              {totalCount > 0 && (
                <div>
                  <p className="text-[10px] sm:text-xs font-light text-neutral-400 tracking-wide uppercase">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
                  </p>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* View Mode Toggle - Refined */}
                <div className="hidden md:flex items-center gap-1 border border-neutral-200/50 rounded-full p-1 bg-white/50 backdrop-blur-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-full transition-all duration-300 ${
                      viewMode === 'grid'
                        ? 'bg-neutral-900 text-white shadow-md'
                        : 'text-neutral-500 hover:text-amber-600'
                    }`}
                    aria-label="Grid view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-full transition-all duration-300 ${
                      viewMode === 'list'
                        ? 'bg-neutral-900 text-white shadow-md'
                        : 'text-neutral-500 hover:text-amber-600'
                    }`}
                    aria-label="List view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>

                {/* Sort Dropdown - Refined */}
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/50 backdrop-blur-sm border border-neutral-200/50 rounded-full text-neutral-900 text-[10px] sm:text-xs md:text-sm font-light tracking-wide focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
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
                  className="lg:hidden inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-900 text-white rounded-full text-[10px] sm:text-xs font-light tracking-wide hover:bg-neutral-800 transition-all duration-300"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {tProduct('filters') || 'Filters'}
                </button>
              </div>
            </div>

            {/* Products Grid/List */}
            {products.length === 0 ? (
              <div className="text-center py-32">
                <div className="w-24 h-24 rounded-full bg-neutral-50 flex items-center justify-center mx-auto mb-8">
                  <svg className="w-12 h-12 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-neutral-600 text-xl font-light tracking-wide mb-3">No products found</p>
                <p className="text-neutral-400 text-sm font-light">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <>
                {/* Grid view - always shown on mobile, shown on desktop when viewMode is grid */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 lg:gap-12 ${viewMode === 'list' ? 'md:hidden' : ''}`}>
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      locale={locale as string}
                      showQuickAdd={true}
                      viewMode="grid"
                      onQuickView={() => setQuickViewProduct(product)}
                    />
                  ))}
                </div>
                
                {/* List view - only shown on desktop when viewMode is list */}
                {viewMode === 'list' && (
                  <div className="hidden md:block space-y-6 sm:space-y-8">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        locale={locale as string}
                        showQuickAdd={true}
                        viewMode="list"
                        onQuickView={() => setQuickViewProduct(product)}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination - Refined */}
                {totalPages > 1 && (
                  <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-24 flex flex-col items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white border border-neutral-200/50 rounded-full text-neutral-700 text-[10px] sm:text-xs font-light tracking-wide disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-50 hover:border-amber-500/30 hover:text-amber-600 transition-all duration-300"
                        aria-label="Previous page"
                      >
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                        </svg>
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
                              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-light tracking-wide transition-all duration-300 ${
                                currentPage === page
                                  ? 'bg-neutral-900 text-white'
                                  : 'text-neutral-600 hover:text-amber-600 hover:bg-neutral-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="text-neutral-300 px-0.5 sm:px-1 text-[10px] sm:text-xs">...</span>;
                        }
                        return null;
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white border border-neutral-200/50 rounded-full text-neutral-700 text-[10px] sm:text-xs font-light tracking-wide disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-50 hover:border-amber-500/30 hover:text-amber-600 transition-all duration-300"
                        aria-label="Next page"
                      >
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Page indicator */}
                    <p className="text-[9px] sm:text-[10px] font-light uppercase tracking-[0.2em] text-neutral-400">
                      Page {currentPage} of {totalPages}
                    </p>
                  </div>
                )}
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
