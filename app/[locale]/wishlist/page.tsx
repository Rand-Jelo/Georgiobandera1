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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 text-neutral-600 hover:text-neutral-900 underline"
          >
            {tCommon('login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {t('title') || 'My Wishlist'}
          </h1>
          <p className="text-neutral-600">
            {items.length === 0
              ? t('empty') || 'Your wishlist is empty'
              : `${items.length} ${items.length === 1 ? t('item') || 'item' : t('items') || 'items'}`}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-24 w-24 text-neutral-400"
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
            <h3 className="mt-4 text-lg font-medium text-neutral-900">
              {t('emptyTitle') || 'No items in your wishlist'}
            </h3>
            <p className="mt-2 text-sm text-neutral-500">
              {t('emptyDescription') || 'Start adding products you love to your wishlist'}
            </p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-neutral-900 hover:bg-neutral-800"
              >
                {t('browseProducts') || 'Browse Products'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
            {items.map((item) => {
              if (!item.product) return null;
              return (
                <div key={item.id} className="group relative">
                  <ProductCard product={item.product} locale={locale} />
                  <div className="absolute top-3 right-3 z-10">
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
    </div>
  );
}

