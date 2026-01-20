'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { Link } from '@/lib/i18n/routing';

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  currency: string;
  created_at: number;
  tracking_number: string | null;
}

export default function OrdersPage() {
  const t = useTranslations('orders');
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // First check if user is authenticated and verified
      const authResponse = await fetch('/api/auth/me');
      if (authResponse.ok) {
        const authData = await authResponse.json() as { user?: { email_verified?: boolean } };
        if (authData.user && !authData.user.email_verified) {
          router.push('/verify-email-required');
          return;
        }
      }

      const response = await fetch('/api/orders');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      const data = await response.json() as { orders?: Order[] };
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: t('pending'),
      paid: t('paid'),
      processing: t('processing'),
      shipped: t('shipped'),
      delivered: t('delivered'),
      cancelled: t('cancelled'),
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
      paid: 'bg-neutral-500/10 text-neutral-700 border-neutral-500/20',
      processing: 'bg-neutral-500/10 text-neutral-700 border-neutral-500/20',
      shipped: 'bg-neutral-500/10 text-neutral-700 border-neutral-500/20',
      delivered: 'bg-neutral-500/10 text-neutral-700 border-neutral-500/20',
      cancelled: 'bg-red-500/10 text-red-700 border-red-500/20',
    };
    return colorMap[status] || 'bg-neutral-500/10 text-neutral-700 border-neutral-500/20';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-200 border-t-neutral-900 mx-auto"></div>
          <p className="mt-4 text-neutral-500 font-light">Loading...</p>
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
                {t('orderHistory') || 'Order History'}
              </p>
              <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent mx-auto" />
            </div>

            {/* Main heading */}
            <h1 className="text-4xl font-extralight tracking-wide sm:text-5xl lg:text-6xl">
              {t('title')}
            </h1>

            {/* Description */}
            {orders.length > 0 && (
              <p className="text-sm font-light tracking-wide text-neutral-400 sm:text-base">
                {t('ordersFound', { count: orders.length })}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Orders Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {orders.length === 0 ? (
            <div className="bg-white border border-neutral-200/50 p-16 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-neutral-600 font-light text-lg">{t('noOrders')}</p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-neutral-900 text-white text-sm font-light uppercase tracking-wider hover:bg-neutral-800 transition-all duration-300"
                >
                  {t('continueShopping') || 'Continue Shopping'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.order_number}`}
                  className="group block"
                >
                  <div className="bg-white border border-neutral-200/50 hover:border-amber-500/30 transition-all duration-300">
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-xs font-light uppercase tracking-wider text-neutral-500 mb-1">
                                {t('orderNumber')}
                              </p>
                              <p className="text-base font-light tracking-wide text-neutral-900">
                                {order.order_number}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center px-3 py-1 border text-xs font-light uppercase tracking-wider ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-500 font-light">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(order.created_at * 1000).toLocaleDateString()}
                            </div>
                            {order.tracking_number && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-mono text-xs">{order.tracking_number}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="text-xs font-light uppercase tracking-wider text-neutral-500 mb-1">
                              Total
                            </p>
                            <p className="text-lg font-light tracking-wide text-neutral-900">
                              {formatPrice(order.subtotal + order.shipping_cost, order.currency)}
                            </p>
                          </div>
                          <svg className="w-5 h-5 text-neutral-400 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

