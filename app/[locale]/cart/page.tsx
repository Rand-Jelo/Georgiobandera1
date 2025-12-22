'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

interface CartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product: {
    id: string;
    name_en: string;
    name_sv: string;
    price: number;
    slug: string;
    images?: Array<{
      id: string;
      url: string;
      alt_text_en?: string | null;
      alt_text_sv?: string | null;
    }>;
  } | null;
  variant: {
    id: string;
    name_en: string | null;
    name_sv: string | null;
    price: number | null;
    option1_value: string | null;
    option2_value: string | null;
  } | null;
}

export default function CartPage() {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      const data = await response.json() as { items?: CartItem[] };
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(itemId);
      return;
    }

    setUpdating(itemId);
    try {
      const response = await fetch('/api/cart', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, quantity }),
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const response = await fetch(`/api/cart?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setUpdating(null);
    }
  };

  const getItemPrice = (item: CartItem): number => {
    if (item.variant?.price !== null && item.variant?.price !== undefined) {
      return item.variant.price;
    }
    return item.product?.price || 0;
  };

  const getItemName = (item: CartItem, locale: string = 'en'): string => {
    const productName = locale === 'sv' 
      ? item.product?.name_sv || item.product?.name_en || ''
      : item.product?.name_en || '';
    
    if (item.variant) {
      const variantName = locale === 'sv'
        ? item.variant.name_sv || item.variant.name_en
        : item.variant.name_en;
      
      if (variantName) {
        return `${productName} - ${variantName}`;
      }
      
      // Build variant name from options
      const options: string[] = [];
      if (item.variant.option1_value) options.push(item.variant.option1_value);
      if (item.variant.option2_value) options.push(item.variant.option2_value);
      if (options.length > 0) {
        return `${productName} (${options.join(', ')})`;
      }
    }
    
    return productName;
  };

  const subtotal = items.reduce((sum, item) => {
    return sum + getItemPrice(item) * item.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-200 border-t-neutral-900 mx-auto"></div>
          <p className="mt-4 text-neutral-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-light tracking-tight text-neutral-900 mb-12">{t('title')}</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-16 text-center">
            <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">{t('empty')}</h3>
            <p className="text-neutral-500 mb-8">
              Start shopping to add items to your cart.
            </p>
            <div>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-800 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {t('continueShopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-light tracking-tight text-neutral-900 mb-12">{t('title')}</h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
              <div className="divide-y divide-neutral-100">
                {items.map((item) => {
                  const price = getItemPrice(item);
                  const total = price * item.quantity;
                  const isUpdating = updating === item.id;

                  return (
                    <div key={item.id} className="p-6 hover:bg-neutral-50/50 transition-colors">
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-neutral-50 to-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm relative">
                          {item.product?.images && item.product.images.length > 0 ? (
                            <Image
                              src={item.product.images[0].url}
                              alt={item.product.images[0].alt_text_en || getItemName(item, locale)}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg
                                className="w-10 h-10 text-neutral-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/products/${item.product?.slug}`}
                                className="block"
                              >
                                <h3 className="text-lg font-semibold text-neutral-900 hover:text-neutral-600 transition-colors">
                                  {getItemName(item, locale as string)}
                                </h3>
                              </Link>
                              <p className="mt-1 text-sm text-neutral-500 font-medium">
                                {formatPrice(price, 'SEK')} each
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={isUpdating}
                              className="flex-shrink-0 p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-300"
                              aria-label="Remove item"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center border border-neutral-200 rounded-full bg-white shadow-sm">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={isUpdating || item.quantity <= 1}
                                className="px-4 py-2 text-neutral-600 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-full"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="px-6 py-2 text-neutral-900 font-medium min-w-[3rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={isUpdating}
                                className="px-4 py-2 text-neutral-600 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-full"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-xl font-semibold text-neutral-900">
                              {formatPrice(total, 'SEK')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-10 lg:mt-0 lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden sticky top-8">
              <div className="px-6 py-5 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-neutral-900">
                    {t('orderSummary')}
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <dl className="space-y-4">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-neutral-600 font-medium">{t('subtotal')}</dt>
                    <dd className="text-sm font-semibold text-neutral-900">
                      {formatPrice(subtotal, 'SEK')}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-neutral-600 font-medium">{t('shipping')}</dt>
                    <dd className="text-sm font-medium text-neutral-500">
                      {t('calculatedAtCheckout')}
                    </dd>
                  </div>
                  <div className="border-t border-neutral-200 pt-4 flex items-center justify-between">
                    <dt className="text-base font-semibold text-neutral-900">{t('total')}</dt>
                    <dd className="text-base font-semibold text-neutral-900">
                      {formatPrice(subtotal, 'SEK')}
                    </dd>
                  </div>
                </dl>

                <div className="mt-8">
                  <Link
                    href="/checkout"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-800 transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    {t('checkout')}
                  </Link>
                </div>

                <div className="mt-4">
                  <Link
                    href="/shop"
                    className="w-full inline-flex items-center justify-center gap-2 text-center text-sm text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {t('continueShopping')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

