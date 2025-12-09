'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
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
  category?: {
    id: string;
    name_en: string;
    name_sv: string;
    slug: string;
  } | null;
}

interface FeaturedProductsProps {
  products: Product[];
  loading: boolean;
}

export default function FeaturedProducts({ products, loading }: FeaturedProductsProps) {
  const t = useTranslations('home');
  const locale = useLocale();

  useEffect(() => {
    if (products.length === 0) return;

    const el = document.getElementById('autoScroll');
    if (!el) return;

    let isHovered = false;
    const gapPx = 16; // Tailwind gap-4 = 1rem = 16px
    const intervalMs = 2600; // time between jumps

    const handleEnter = () => {
      isHovered = true;
    };

    const handleLeave = () => {
      isHovered = false;
    };

    el.addEventListener('mouseenter', handleEnter);
    el.addEventListener('mouseleave', handleLeave);

    const scrollInterval = window.setInterval(() => {
      const maxScroll = el.scrollWidth / 2; // because we render products twice
      if (maxScroll <= 0) return;
      if (isHovered) return;

      const firstCard = el.querySelector<HTMLElement>('[data-product-card]');
      if (!firstCard) return;

      const step = firstCard.offsetWidth + gapPx;
      const current = el.scrollLeft;

      if (current + step >= maxScroll) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, intervalMs);

    return () => {
      window.clearInterval(scrollInterval);
      el.removeEventListener('mouseenter', handleEnter);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [products]);

  if (loading) {
    return (
      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 mt-4">
        <h2 className="text-sm font-medium tracking-[0.22em] text-neutral-500 uppercase">
          {t('featuredProducts')}
        </h2>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 mt-4">
        <h2 className="text-sm font-medium tracking-[0.22em] text-neutral-500 uppercase">
          {t('featuredProducts')}
        </h2>
        <div className="text-center text-neutral-500 py-12">
          <p>No featured products available yet.</p>
        </div>
      </section>
    );
  }

  // Duplicate products for seamless loop
  const loopedProducts = [...products, ...products];

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 mt-4">
      <h2 className="text-sm font-medium tracking-[0.22em] text-neutral-500 uppercase">
        {t('featuredProducts')}
      </h2>

      {/* Auto-scrolling featured products */}
      <div className="mt-6 relative">
        <div
          id="autoScroll"
          className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {loopedProducts.map((product, index) => {
            const name = locale === 'sv' ? product.name_sv : product.name_en;
            const categoryName = product.category
              ? (locale === 'sv' ? product.category.name_sv : product.category.name_en)
              : 'Product';
            const imageUrl = product.images?.[0]?.url;

            return (
              <Link
                key={`${product.id}-${index}`}
                href={`/products/${product.slug}`}
                data-product-card
                className="group min-w-[260px] rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="mb-3 h-40 w-full rounded-xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-950 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] group-hover:-translate-y-1 relative overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={name}
                      fill
                      className="object-cover"
                      sizes="260px"
                    />
                  ) : null}
                </div>

                <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                  {categoryName}
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-900">{name}</p>
                <p className="mt-1 text-sm text-neutral-700">
                  {formatPrice(product.price, 'SEK')}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Left/right fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-neutral-50/40 via-neutral-50/10 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-neutral-50/40 via-neutral-50/10 to-transparent" />
      </div>
    </section>
  );
}

