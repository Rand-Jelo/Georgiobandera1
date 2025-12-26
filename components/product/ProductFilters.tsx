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
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">
          {t('filters') || 'Filters'}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900"
            aria-label="Close filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-neutral-900 mb-3">
          {t('categories') || 'Categories'}
        </h4>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {parentCategories.map((category) => {
            const categoryName = locale === 'sv' ? category.name_sv : category.name_en;
            const hasChildren = category.children && category.children.length > 0;
            const isExpanded = expandedCategories.has(category.id);
            
            return (
              <div key={category.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={localFilters.categoryIds.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900"
                    />
                    <span className="text-sm text-neutral-700 font-medium">{categoryName}</span>
                  </label>
                  {hasChildren && (
                    <button
                      onClick={() => toggleCategoryExpansion(category.id)}
                      className="p-1 text-neutral-500 hover:text-neutral-900 transition-colors"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
                {hasChildren && isExpanded && (
                  <div className="ml-6 space-y-1 border-l-2 border-neutral-200 pl-3">
                    {category.children!.map((child) => {
                      const childName = locale === 'sv' ? child.name_sv : child.name_en;
                      return (
                        <label key={child.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localFilters.categoryIds.includes(child.id)}
                            onChange={() => handleCategoryToggle(child.id)}
                            className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900"
                          />
                          <span className="text-sm text-neutral-600">{childName}</span>
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
      <div className="mb-6">
        <h4 className="text-sm font-medium text-neutral-900 mb-3">
          {t('priceRange') || 'Price Range'}
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={priceRange.min || ''}
              onChange={(e) => handlePriceChange('min', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 placeholder:text-neutral-400"
            />
            <span className="text-neutral-500">-</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={priceRange.max || ''}
              onChange={(e) => handlePriceChange('max', parseFloat(e.target.value) || 10000)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 placeholder:text-neutral-400"
            />
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-neutral-900 mb-3">
          {t('availability') || 'Availability'}
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="stock"
              checked={localFilters.inStock === true}
              onChange={() => handleStockToggle(true)}
              className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
            />
            <span className="text-sm text-neutral-700">{t('inStock') || 'In Stock'}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="stock"
              checked={localFilters.inStock === false}
              onChange={() => handleStockToggle(false)}
              className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
            />
            <span className="text-sm text-neutral-700">{t('outOfStock') || 'Out of Stock'}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="stock"
              checked={localFilters.inStock === undefined}
              onChange={() => handleStockToggle(undefined)}
              className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
            />
            <span className="text-sm text-neutral-700">{t('all') || 'All'}</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleApply}
          className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
        >
          {t('apply') || 'Apply'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
        >
          {t('reset') || 'Reset'}
        </button>
      </div>
    </div>
  );
}

