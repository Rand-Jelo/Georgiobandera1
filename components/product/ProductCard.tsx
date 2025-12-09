'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

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
}

export default function ProductCard({ product, locale = 'en' }: ProductCardProps) {
  const t = useTranslations('product');
  const name = locale === 'sv' ? product.name_sv : product.name_en;
  const imageUrl = product.images?.[0]?.url || '/placeholder-product.jpg';
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

  // Get category name from product data
  const categoryName = product.category
    ? (locale === 'sv' ? product.category.name_sv : product.category.name_en)
    : null;

  return (
    <Link href={`/products/${product.slug}`} className="group">
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
  );
}
