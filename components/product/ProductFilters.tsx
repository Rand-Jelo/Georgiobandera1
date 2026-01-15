'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Category {
  id: string;
  name_en: string;
  name_sv: string;
  slug: string;
  parent_id?: string | null;
  children?: Category[];
}

interface ProductFiltersProps {
  categories: Category[];
  locale: string;
  filters: {
    categoryIds: string[];
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  };
  onFiltersChange: (filters: {
    categoryIds: string[];
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }) => void;
  onClose?: () => void;
}

export default function ProductFilters({
  categories,
  locale,
  filters,
  onFiltersChange,
  onClose,
}: ProductFiltersProps) {
  const t = useTranslations('product');
  const [localFilters, setLocalFilters] = useState(filters);
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || 0,
    max: filters.maxPrice || 10000,
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filter to show only parent categories (those without a parent_id or top-level)
  const parentCategories = categories.filter(cat => !cat.parent_id);

  const handleCategoryToggle = (categoryId: string) => {
    const newCategoryIds = localFilters.categoryIds.includes(categoryId)
      ? localFilters.categoryIds.filter(id => id !== categoryId)
      : [...localFilters.categoryIds, categoryId];
    
    setLocalFilters({ ...localFilters, categoryIds: newCategoryIds });
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handlePriceChange = (field: 'min' | 'max', value: number) => {
    const newPriceRange = { ...priceRange, [field]: value };
    setPriceRange(newPriceRange);
    setLocalFilters({
      ...localFilters,
      minPrice: newPriceRange.min > 0 ? newPriceRange.min : undefined,
      maxPrice: newPriceRange.max < 10000 ? newPriceRange.max : undefined,
    });
  };

  const handleStockToggle = (inStock: boolean | undefined) => {
    setLocalFilters({ ...localFilters, inStock });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose?.();
  };

  const handleReset = () => {
    const resetFilters = {
      categoryIds: [],
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
    };
    setLocalFilters(resetFilters);
    setPriceRange({ min: 0, max: 10000 });
    onFiltersChange(resetFilters);
  };

  return (
    <div className="space-y-6">

      {/* Categories */}
      <div>
        <h4 className="text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
          {t('categories') || 'Categories'}
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {parentCategories.map((category) => {
            const categoryName = locale === 'sv' ? category.name_sv : category.name_en;
            const hasChildren = category.children && category.children.length > 0;
            const isExpanded = expandedCategories.has(category.id);
            
            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-3 cursor-pointer flex-1 group">
                    <input
                      type="checkbox"
                      checked={localFilters.categoryIds.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="w-4 h-4 text-amber-500 border-neutral-300 rounded focus:ring-amber-500/30 focus:ring-2 transition-colors"
                    />
                    <span className="text-sm text-neutral-700 font-light group-hover:text-amber-600 transition-colors duration-300">{categoryName}</span>
                  </label>
                  {hasChildren && (
                    <button
                      onClick={() => toggleCategoryExpansion(category.id)}
                      className="p-1 text-neutral-400 hover:text-amber-600 transition-colors duration-300"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
                {hasChildren && isExpanded && (
                  <div className="ml-7 space-y-2 border-l border-neutral-200/50 pl-4">
                    {category.children!.map((child) => {
                      const childName = locale === 'sv' ? child.name_sv : child.name_en;
                      return (
                        <label key={child.id} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={localFilters.categoryIds.includes(child.id)}
                            onChange={() => handleCategoryToggle(child.id)}
                            className="w-4 h-4 text-amber-500 border-neutral-300 rounded focus:ring-amber-500/30 focus:ring-2 transition-colors"
                          />
                          <span className="text-sm text-neutral-600 font-light group-hover:text-amber-600 transition-colors duration-300">{childName}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
          {t('priceRange') || 'Price Range'}
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={priceRange.min || ''}
              onChange={(e) => handlePriceChange('min', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 border border-neutral-200/50 rounded-full text-sm text-neutral-900 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 placeholder:text-neutral-400 font-light transition-all"
            />
            <span className="text-neutral-400 font-light">-</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={priceRange.max || ''}
              onChange={(e) => handlePriceChange('max', parseFloat(e.target.value) || 10000)}
              className="w-full px-4 py-2.5 border border-neutral-200/50 rounded-full text-sm text-neutral-900 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 placeholder:text-neutral-400 font-light transition-all"
            />
          </div>
        </div>
      </div>

      {/* Availability */}
      <div>
        <h4 className="text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
          {t('availability') || 'Availability'}
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="stock"
              checked={localFilters.inStock === true}
              onChange={() => handleStockToggle(true)}
              className="w-4 h-4 text-amber-500 border-neutral-300 focus:ring-amber-500/30 focus:ring-2"
            />
            <span className="text-sm text-neutral-700 font-light group-hover:text-amber-600 transition-colors duration-300">{t('inStock') || 'In Stock'}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="stock"
              checked={localFilters.inStock === false}
              onChange={() => handleStockToggle(false)}
              className="w-4 h-4 text-amber-500 border-neutral-300 focus:ring-amber-500/30 focus:ring-2"
            />
            <span className="text-sm text-neutral-700 font-light group-hover:text-amber-600 transition-colors duration-300">{t('outOfStock') || 'Out of Stock'}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="stock"
              checked={localFilters.inStock === undefined}
              onChange={() => handleStockToggle(undefined)}
              className="w-4 h-4 text-amber-500 border-neutral-300 focus:ring-amber-500/30 focus:ring-2"
            />
            <span className="text-sm text-neutral-700 font-light group-hover:text-amber-600 transition-colors duration-300">{t('all') || 'All'}</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-neutral-200/50">
        <button
          onClick={handleApply}
          className="flex-1 px-5 py-2.5 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-all duration-300 text-sm font-light tracking-wide shadow-sm hover:shadow-md"
        >
          {t('apply') || 'Apply'}
        </button>
        <button
          onClick={handleReset}
          className="px-5 py-2.5 border border-neutral-200/50 text-neutral-700 rounded-full hover:bg-neutral-50 hover:border-amber-500/30 hover:text-amber-600 transition-all duration-300 text-sm font-light tracking-wide"
        >
          {t('reset') || 'Reset'}
        </button>
      </div>
    </div>
  );
}

