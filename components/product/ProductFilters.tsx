'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ProductFiltersProps {
  categories: Array<{ id: string; name_en: string; name_sv: string; slug: string }>;
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

  const handleCategoryToggle = (categoryId: string) => {
    const newCategoryIds = localFilters.categoryIds.includes(categoryId)
      ? localFilters.categoryIds.filter(id => id !== categoryId)
      : [...localFilters.categoryIds, categoryId];
    
    setLocalFilters({ ...localFilters, categoryIds: newCategoryIds });
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
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((category) => {
            const categoryName = locale === 'sv' ? category.name_sv : category.name_en;
            return (
              <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.categoryIds.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900"
                />
                <span className="text-sm text-neutral-700">{categoryName}</span>
              </label>
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
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
            />
            <span className="text-neutral-500">-</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={priceRange.max || ''}
              onChange={(e) => handlePriceChange('max', parseFloat(e.target.value) || 10000)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
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
          {t('applyFilters') || 'Apply Filters'}
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

