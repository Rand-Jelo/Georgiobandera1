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
      <article className="group relative bg-white border-b border-neutral-200/50 transition-all duration-300 hover:bg-neutral-50/30">
        <div onClick={handleCardClick} className="flex gap-8 cursor-pointer py-6">
          {/* Image */}
          <div className="relative w-32 h-32 flex-shrink-0 bg-neutral-50">
            {product.images && product.images.length > 0 ? (
              <Image
                src={imageUrl}
                alt={product.images[0]?.alt_text_en || name}
                fill
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                sizes="128px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="inline-block h-px w-8 bg-gradient-to-r from-transparent via-neutral-300 to-transparent mb-2" />
                  <p className="text-[9px] font-light uppercase tracking-[0.2em] text-neutral-300">Image</p>
                </div>
              </div>
            )}
            {hasDiscount && (
              <div className="absolute top-2 right-2 bg-amber-500 px-2 py-0.5">
                <p className="text-[8px] font-light uppercase tracking-[0.3em] text-white">Sale</p>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="flex-1 min-w-0 pr-8">
              {categoryName && (
                <p className="text-[9px] uppercase tracking-[0.4em] text-neutral-400 font-light mb-2">
                  {categoryName}
                </p>
              )}
              <h3 className="text-lg font-extralight tracking-wide text-neutral-900 group-hover:text-amber-600 transition-colors duration-300 mb-2 leading-tight">
                {name}
              </h3>
              <div className="flex items-baseline gap-3">
                <span className="text-base font-light text-neutral-900">
                  {formatPrice(product.price, 'SEK')}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-neutral-400 line-through font-extralight">
                    {formatPrice(product.compare_at_price!, 'SEK')}
                  </span>
                )}
              </div>
            </div>
            
            {/* Add to Cart */}
            {showQuickAdd && (
              <button
                onClick={handleQuickAdd}
                disabled={adding || quickAddSuccess}
                className="px-6 py-2.5 bg-neutral-900 text-white text-xs font-light uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                {quickAddSuccess ? (
                  'Added'
                ) : adding ? (
                  'Adding...'
                ) : (
                  t('addToCart') || 'Add to Cart'
                )}
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative" onClick={handleCardClick}>
      <div className="block cursor-pointer">
        {/* Image Container - Refined */}
        <div className="relative w-full overflow-hidden bg-neutral-50 aspect-[3/4] mb-6">
          {product.images && product.images.length > 0 ? (
            <>
              <Image
                src={imageUrl}
                alt={product.images[0]?.alt_text_en || name}
                fill
                className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {/* Subtle overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-3">
                <div className="inline-block h-px w-12 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
                <p className="text-[10px] font-light uppercase tracking-[0.2em] text-neutral-300">Image</p>
              </div>
            </div>
          )}
          
          {/* Sale Badge - Refined */}
          {hasDiscount && (
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-amber-500 px-3 py-1">
                <p className="text-[9px] font-light uppercase tracking-[0.3em] text-white">
                  Sale
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content - Refined Typography */}
        <div className="space-y-3">
          {categoryName && (
            <p className="text-[9px] uppercase tracking-[0.4em] text-neutral-400 font-light">
              {categoryName}
            </p>
          )}
          
          <h3 className="text-lg font-extralight tracking-wide text-neutral-900 leading-tight group-hover:text-amber-600 transition-colors duration-300">
            {name}
          </h3>
          
          {/* Price - Refined */}
          <div className="flex items-baseline gap-3 pt-1">
            {hasDiscount ? (
              <>
                <span className="text-base font-light text-neutral-900">
                  {formatPrice(product.price, 'SEK')}
                </span>
                <span className="text-sm text-neutral-400 line-through font-extralight">
                  {formatPrice(product.compare_at_price!, 'SEK')}
                </span>
              </>
            ) : (
              <span className="text-base font-light text-neutral-900">
                {formatPrice(product.price, 'SEK')}
              </span>
            )}
          </div>
          
          {/* Subtle divider */}
          <div className="h-px w-0 bg-gradient-to-r from-amber-500/50 to-transparent transition-all duration-500 group-hover:w-full mt-4" />
          
          {/* Add to Cart Button - Refined */}
          {showQuickAdd && (
            <button
              onClick={handleQuickAdd}
              disabled={adding || quickAddSuccess}
              className="mt-6 w-full px-5 py-3 bg-neutral-900 text-white text-xs font-light uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {quickAddSuccess ? (
                'Added'
              ) : adding ? (
                'Adding...'
              ) : (
                t('addToCart') || 'Add to Cart'
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
