'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import ProductCard from '@/components/product/ProductCard';
import WishlistButton from '@/components/product/WishlistButton';

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

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: number;
  product: Product | null;
}

export default function WishlistPage() {
  const t = useTranslations('wishlist');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to load wishlist');
      }
      const data = await response.json() as { items: WishlistItem[] };
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      const response = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setItems(items.filter(item => item.product_id !== productId));
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-200 border-t-neutral-900 mx-auto"></div>
          <p className="mt-4 text-neutral-500 font-light">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 font-light">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 text-neutral-600 hover:text-neutral-900 underline font-light"
          >
            {tCommon('login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Dark Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white">
        {/* Elegant background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,_transparent,_transparent_2px,_rgba(255,255,255,0.02)_2px,_rgba(255,255,255,0.02)_4px)]" />
        </div>

        {/* Subtle gold accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            {/* Subtitle */}
            <div className="inline-block">
              <p className="text-[10px] font-light uppercase tracking-[0.4em] text-amber-400/80">
                {t('title')}
              </p>
              <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent mx-auto" />
            </div>

            {/* Main heading */}
            <h1 className="text-4xl font-extralight tracking-wide sm:text-5xl lg:text-6xl">
              {t('title')}
            </h1>

            {/* Description */}
            {items.length > 0 && (
              <p className="text-sm font-light tracking-wide text-neutral-400 sm:text-base">
                {items.length} {items.length === 1 ? t('item') : t('items')}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Wishlist Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {items.length === 0 ? (
            <div className="bg-white border border-neutral-200/50 p-16 text-center">
              <div className="max-w-md mx-auto space-y-6">
                <div className="w-24 h-24 mx-auto flex items-center justify-center">
                  <svg
                    className="w-full h-full text-neutral-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-light text-neutral-900">
                    {t('emptyTitle')}
                  </h3>
                  <p className="text-sm text-neutral-500 font-light">
                    {t('emptyDescription')}
                  </p>
                </div>
                <div className="pt-4">
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-sm font-light uppercase tracking-wider hover:bg-neutral-800 transition-all duration-300"
                  >
                    {t('browseProducts')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:gap-8">
              {items.map((item) => {
                if (!item.product) return null;
                return (
                  <div key={item.id} className="group relative">
                    <ProductCard product={item.product} locale={locale} />
                    <div className="absolute top-3 left-3 z-10">
                      <WishlistButton
                        productId={item.product.id}
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

