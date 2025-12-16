'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { useCart } from '@/lib/hooks/useCart';

interface Product {
  id: string;
  name_en: string;
  name_sv: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images?: Array<{ url: string; alt_text_en?: string | null }>;
  category_id?: string | null;
  category?: {
    id: string;
    name_en: string;
    name_sv: string;
    slug: string;
  } | null;
}

interface ProductCardProps {
  product: Product;
  locale?: string;
  showQuickAdd?: boolean;
  viewMode?: 'grid' | 'list';
  onQuickView?: () => void;
}

export default function ProductCard({ product, locale = 'en', showQuickAdd = false, viewMode = 'grid', onQuickView }: ProductCardProps) {
  const t = useTranslations('product');
  const { addToCart, adding } = useCart();
  const [quickAddSuccess, setQuickAddSuccess] = useState(false);
  const name = locale === 'sv' ? product.name_sv : product.name_en;
  const imageUrl = product.images?.[0]?.url || '/placeholder-product.jpg';
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

  // Get category name from product data
  const categoryName = product.category
    ? (locale === 'sv' ? product.category.name_sv : product.category.name_en)
    : null;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product.id, undefined, 1);
      setQuickAddSuccess(true);
      setTimeout(() => setQuickAddSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking on a link or button, don't trigger quick view
    if ((e.target as HTMLElement).closest('a, button')) return;
    if (onQuickView) {
      e.preventDefault();
      e.stopPropagation();
      onQuickView();
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="group relative bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div onClick={handleCardClick} className="flex gap-6 cursor-pointer">
          <div className="flex gap-6 flex-1">
            <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={imageUrl}
                  alt={product.images[0]?.alt_text_en || name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="128px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-neutral-400 bg-neutral-50">
                  No image
                </div>
              )}
              {hasDiscount && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  Sale
                </div>
              )}
            </div>
          <div className="flex-1 flex items-center justify-between py-4 pr-4">
            <div className="flex-1">
              {categoryName && (
                <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 font-medium mb-1">
                  {categoryName}
                </p>
              )}
              <h3 className="text-lg font-medium tracking-tight text-neutral-900 group-hover:text-neutral-600 transition-colors mb-2">
                {name}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-medium text-neutral-900">
                  {formatPrice(product.price, 'SEK')}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-neutral-500 line-through">
                    {formatPrice(product.compare_at_price!, 'SEK')}
                  </span>
                )}
              </div>
            </div>
            {showQuickAdd && (
              <button
                onClick={handleQuickAdd}
                disabled={adding || quickAddSuccess}
                className="px-6 py-2 bg-neutral-900 text-white rounded-lg font-medium text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {quickAddSuccess ? (
                  'Added!'
                ) : adding ? (
                  'Adding...'
                ) : (
                  t('addToCart') || 'Add to Cart'
                )}
              </button>
            )}
          </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative" onClick={handleCardClick}>
      <div className="block cursor-pointer">
        <div className="relative w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 aspect-[4/5]">
          {product.images && product.images.length > 0 ? (
            <Image
              src={imageUrl}
              alt={product.images[0]?.alt_text_en || name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400 bg-neutral-50">
              Product image coming soon
            </div>
          )}
          {hasDiscount && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Sale
            </div>
          )}
        </div>

        <div className="mt-4 space-y-1">
          {categoryName && (
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 font-medium">
              {categoryName}
            </p>
          )}
          <h3 className="text-base font-medium tracking-tight text-neutral-900 group-hover:text-neutral-600 transition-colors">
            {name}
          </h3>
          
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base font-medium text-neutral-900">
              {formatPrice(product.price, 'SEK')}
            </span>
            {hasDiscount && (
              <span className="text-sm text-neutral-500 line-through">
                {formatPrice(product.compare_at_price!, 'SEK')}
              </span>
            )}
          </div>
          {showQuickAdd && (
            <button
              onClick={handleQuickAdd}
              disabled={adding || quickAddSuccess}
              className="mt-3 w-full px-4 py-2 bg-neutral-900 text-white rounded-lg font-medium text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {quickAddSuccess ? (
                'Added!'
              ) : adding ? (
                'Adding...'
              ) : (
                t('addToCart') || 'Add to Cart'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
