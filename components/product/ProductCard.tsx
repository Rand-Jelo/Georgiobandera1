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
}

export default function ProductCard({ product, locale = 'en', showQuickAdd = false }: ProductCardProps) {
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

  return (
    <div className="group relative">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative w-full overflow-hidden rounded-3xl border border-white/20 bg-neutral-900/40 aspect-[4/5]">
          {product.images && product.images.length > 0 ? (
            <Image
              src={imageUrl}
              alt={product.images[0]?.alt_text_en || name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-500">
              Product image coming soon
            </div>
          )}
          {hasDiscount && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              Sale
            </div>
          )}
          {showQuickAdd && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={handleQuickAdd}
                disabled={adding || quickAddSuccess}
                className="px-4 py-2 bg-white text-neutral-900 rounded-lg font-medium text-sm hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {quickAddSuccess ? (
                  'Added!'
                ) : adding ? (
                  'Adding...'
                ) : (
                  t('addToCart') || 'Add to Cart'
                )}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-1">
          {categoryName && (
            <p className="text-xs uppercase tracking-[0.15em] text-white/70 font-medium">
              {categoryName}
            </p>
          )}
          <h3 className="text-base font-medium tracking-tight text-white group-hover:text-white/80 transition-colors">
            {name}
          </h3>
          
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base font-medium text-white">
              {formatPrice(product.price, 'SEK')}
            </span>
            {hasDiscount && (
              <span className="text-sm text-white/50 line-through">
                {formatPrice(product.compare_at_price!, 'SEK')}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
