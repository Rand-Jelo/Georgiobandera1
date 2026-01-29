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
      <div className="animate-in fade-in slide-in-from-left-4 duration-700">
        <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-3 bg-amber-500/50 rounded-full" />
          {t('categories') || 'Categories'}
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {parentCategories.map((category) => {
            const categoryName = locale === 'sv' ? category.name_sv : category.name_en;
            const hasChildren = category.children && category.children.length > 0;
            const isExpanded = expandedCategories.has(category.id);
            const isSelected = localFilters.categoryIds.includes(category.id);

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className={`flex items-center gap-3 cursor-pointer flex-1 group py-1.5 px-3 rounded-lg transition-all duration-300 ${isSelected ? 'bg-amber-50/50' : 'hover:bg-neutral-50'}`}>
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="w-4 h-4 text-amber-500 border-neutral-300 rounded focus:ring-amber-500/30 focus:ring-2 transition-colors cursor-pointer appearance-none border checked:bg-amber-500 checked:border-amber-500"
                      />
                      {isSelected && (
                        <svg className="absolute w-3 h-3 text-white pointer-events-none left-0.5 top-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-light transition-colors duration-300 ${isSelected ? 'text-amber-700 font-normal' : 'text-neutral-600 group-hover:text-neutral-900'}`}>
                      {categoryName}
                    </span>
                  </label>
                  {hasChildren && (
                    <button
                      onClick={() => toggleCategoryExpansion(category.id)}
                      className="p-1.5 text-neutral-400 hover:text-amber-600 hover:bg-neutral-50 rounded-full transition-all duration-300"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}
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
                  <div className="ml-7 space-y-1.5 border-l border-neutral-200/50 pl-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {category.children!.map((child) => {
                      const childName = locale === 'sv' ? child.name_sv : child.name_en;
                      const isChildSelected = localFilters.categoryIds.includes(child.id);
                      return (
                        <label key={child.id} className={`flex items-center gap-3 cursor-pointer group py-1 px-3 rounded-lg transition-all duration-300 ${isChildSelected ? 'bg-amber-50/30' : 'hover:bg-neutral-50'}`}>
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              checked={isChildSelected}
                              onChange={() => handleCategoryToggle(child.id)}
                              className="w-3.5 h-3.5 text-amber-500 border-neutral-300 rounded focus:ring-amber-500/30 focus:ring-2 transition-colors cursor-pointer appearance-none border checked:bg-amber-500 checked:border-amber-500"
                            />
                            {isChildSelected && (
                              <svg className="absolute w-2.5 h-2.5 text-white pointer-events-none left-0.5 top-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-[13px] font-light transition-colors duration-300 ${isChildSelected ? 'text-amber-700' : 'text-neutral-500 group-hover:text-neutral-800'}`}>
                            {childName}
                          </span>
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
      <div className="animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
        <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-3 bg-amber-500/50 rounded-full" />
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
      <div className="animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
        <h4 className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-3 bg-amber-500/50 rounded-full" />
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

