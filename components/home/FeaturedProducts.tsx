'use client';

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

  if (loading) {
    return (
      <section className="relative bg-white py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center sm:mb-12">
            <div className="inline-block">
              <p className="text-[9px] font-light uppercase tracking-[0.4em] text-neutral-400 sm:text-[10px]">
                {t('featuredProducts')}
              </p>
              <div className="mt-2 h-px w-12 bg-gradient-to-r from-amber-500/50 to-transparent mx-auto sm:w-16" />
            </div>
          </div>
          <div className="text-center py-12 sm:py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-neutral-200 border-t-amber-500"></div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="relative bg-white py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 text-center sm:mb-12">
            <div className="inline-block">
              <p className="text-[9px] font-light uppercase tracking-[0.4em] text-neutral-400 sm:text-[10px]">
                {t('featuredProducts')}
              </p>
              <div className="mt-2 h-px w-12 bg-gradient-to-r from-amber-500/50 to-transparent mx-auto sm:w-16" />
            </div>
          </div>
          <div className="text-center text-neutral-400 py-12 sm:py-16">
            <p className="text-xs font-light sm:text-sm">No featured products available yet.</p>
          </div>
        </div>
      </section>
    );
  }

  // Double the products for the infinite loop effect on desktop
  const carouselProducts = [...products, ...products];

  return (
    <section className="relative bg-white py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.01)_0%,_transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header with elegant styling */}
        <div className="mb-10 text-center sm:mb-12 md:mb-16">
          <div className="inline-block">
            <p className="text-[9px] font-light uppercase tracking-[0.4em] text-neutral-500 sm:text-[10px]">
              {t('featuredProducts')}
            </p>
            <div className="mt-2 h-px w-16 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto sm:mt-3 sm:w-20" />
          </div>
          <h2 className="mt-4 text-2xl font-light tracking-wide text-neutral-900 sm:mt-6 sm:text-3xl md:text-4xl">
            Signature Collection
          </h2>
        </div>

        {/* 
            MOBILE LAYOUT: Vertical Stack (First 3 items only) 
        */}
        <div className="flex flex-col gap-6 md:hidden">
          {products.slice(0, 3).map((product) => {
            const name = locale === 'sv' ? product.name_sv : product.name_en;
            const categoryName = product.category
              ? (locale === 'sv' ? product.category.name_sv : product.category.name_en)
              : 'Product';
            const imageUrl = product.images?.[0]?.url;
            const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group relative flex flex-col bg-white border border-neutral-200/50 transition-all duration-500 ease-out hover:border-amber-500/30 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]"
              >
                {/* Image container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 w-full">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={name}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 320px"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300" />
                  )}
                  {hasDiscount && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-amber-500/95 backdrop-blur-sm px-3 py-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-white">Sale</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex flex-1 flex-col p-4 text-center">
                  <p className="text-[9px] font-light uppercase tracking-[0.3em] text-neutral-400 mb-2">
                    {categoryName}
                  </p>
                  <h3 className="mb-2 text-sm font-light tracking-wide text-neutral-900">
                    {name}
                  </h3>
                  <div className="mt-auto flex items-baseline justify-center gap-2">
                    {hasDiscount ? (
                      <>
                        <span className="text-base font-light text-neutral-900">
                          {formatPrice(product.price, 'SEK')}
                        </span>
                        <span className="text-xs font-light text-neutral-400 line-through">
                          {formatPrice(product.compare_at_price!, 'SEK')}
                        </span>
                      </>
                    ) : (
                      <span className="text-base font-light text-neutral-900">
                        {formatPrice(product.price, 'SEK')}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>


        {/* 
            DESKTOP LAYOUT: Infinite Scrolling Carousel 
            - We duplicate the list to allow for a seamless loop.
            - The animation translates X by -50% (the width of the first set).
        */}
        <div className="hidden md:flex w-full overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
          <div className="flex gap-8 animate-scroll hover:[animation-play-state:paused] w-max">
            {carouselProducts.map((product, index) => {
              // Create a unique key for duplicated items to avoid React warnings
              const uniqueKey = `${product.id}-${index}`;

              const name = locale === 'sv' ? product.name_sv : product.name_en;
              const categoryName = product.category
                ? (locale === 'sv' ? product.category.name_sv : product.category.name_en)
                : 'Product';
              const imageUrl = product.images?.[0]?.url;
              const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

              return (
                <Link
                  key={uniqueKey}
                  href={`/products/${product.slug}`}
                  className="
                       group relative flex flex-col bg-white border border-neutral-200/50 
                       transition-all duration-500 ease-out 
                       hover:border-amber-500/30 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]
                       min-w-[320px] w-[320px] flex-shrink-0
                     "
                >
                  {/* Image container */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 w-full">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="320px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300" />
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    {hasDiscount && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="bg-amber-500/95 backdrop-blur-sm px-3 py-1.5">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-white">Sale</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex flex-1 flex-col p-6 text-center">
                    <p className="text-[9px] font-light uppercase tracking-[0.3em] text-neutral-400 mb-2">
                      {categoryName}
                    </p>
                    <h3 className="mb-3 text-base font-light tracking-wide text-neutral-900 group-hover:text-amber-600 transition-colors duration-300">
                      {name}
                    </h3>

                    <div className="mt-auto flex items-baseline justify-center gap-2">
                      {hasDiscount ? (
                        <>
                          <span className="text-lg font-light text-neutral-900">
                            {formatPrice(product.price, 'SEK')}
                          </span>
                          <span className="text-sm font-light text-neutral-400 line-through">
                            {formatPrice(product.compare_at_price!, 'SEK')}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-light text-neutral-900">
                          {formatPrice(product.price, 'SEK')}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 h-px w-0 bg-gradient-to-r from-transparent via-amber-500 to-transparent transition-all duration-500 group-hover:w-full mx-auto opacity-50" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
