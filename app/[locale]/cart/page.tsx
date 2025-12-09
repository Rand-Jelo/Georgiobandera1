'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('title')}</h1>
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('empty')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start shopping to add items to your cart.
            </p>
            <div className="mt-6">
              <Link
                href="/shop"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {t('continueShopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('title')}</h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          <div className="lg:col-span-7">
            <div className="bg-white shadow rounded-lg">
              <ul className="divide-y divide-gray-200">
                {items.map((item) => {
                  const price = getItemPrice(item);
                  const total = price * item.quantity;
                  const isUpdating = updating === item.id;

                  return (
                    <li key={item.id} className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center">
                          {/* Product image placeholder */}
                          <svg
                            className="w-12 h-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>

                        <div className="ml-6 flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900">
                                {getItemName(item)}
                              </h3>
                              <p className="mt-1 text-sm text-gray-500">
                                {formatPrice(price, 'SEK')} each
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={isUpdating}
                              className="ml-4 text-gray-400 hover:text-gray-500"
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

                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center border border-gray-300 rounded-md">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={isUpdating || item.quantity <= 1}
                                className="px-3 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                -
                              </button>
                              <span className="px-4 py-1 text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={isUpdating}
                                className="px-3 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                              {formatPrice(total, 'SEK')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="mt-10 lg:mt-0 lg:col-span-5">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {t('orderSummary')}
              </h2>
              <dl className="space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">{t('subtotal')}</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatPrice(subtotal, 'SEK')}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">{t('shipping')}</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {t('calculatedAtCheckout')}
                  </dd>
                </div>
                <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                  <dt className="text-base font-medium text-gray-900">{t('total')}</dt>
                  <dd className="text-base font-medium text-gray-900">
                    {formatPrice(subtotal, 'SEK')}
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <Link
                  href="/checkout"
                  className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {t('checkout')}
                </Link>
              </div>

              <div className="mt-4">
                <Link
                  href="/shop"
                  className="text-center block text-sm text-indigo-600 hover:text-indigo-500"
                >
                  {t('continueShopping')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

