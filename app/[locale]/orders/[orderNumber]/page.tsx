'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import { Link } from '@/lib/i18n/routing';

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  currency: string;
  shipping_name: string;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  tracking_number: string | null;
  created_at: number;
  items: OrderItem[];
}

export default function OrderConfirmationPage() {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const orderNumber = params?.orderNumber as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderNumber}`);
      const data = await response.json() as { order?: Order; error?: string };

      if (data.error) {
        setError(data.error);
      } else {
        setOrder(data.order || null);
      }
    } catch (err) {
      setError('Failed to load order');
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-200 border-t-neutral-900 mx-auto"></div>
          <p className="mt-4 text-neutral-500 font-medium">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 mb-6 font-medium">{error || 'Order not found'}</p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-800 transition-all duration-300 hover:scale-105 shadow-lg"
          >
            View all orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden">
          {/* Success Message */}
          <div className="text-center py-12 px-8 bg-gradient-to-br from-green-50 to-white border-b border-neutral-100">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 shadow-lg">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-light tracking-tight text-neutral-900 mb-3">
              Order Confirmed!
            </h1>
            <p className="text-lg text-neutral-600">
              Thank you for your order. We've sent a confirmation email.
            </p>
          </div>

          <div className="p-8 space-y-8">
            {/* Order Details */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  Order Details
                </h2>
              </div>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-neutral-50 rounded-xl p-4">
                  <dt className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Order Number</dt>
                  <dd className="text-base font-semibold text-neutral-900">{order.order_number}</dd>
                </div>
                <div className="bg-neutral-50 rounded-xl p-4">
                  <dt className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Date</dt>
                  <dd className="text-base font-semibold text-neutral-900">
                    {new Date(order.created_at * 1000).toLocaleDateString()}
                  </dd>
                </div>
                <div className="bg-neutral-50 rounded-xl p-4">
                  <dt className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Status</dt>
                  <dd className="text-base font-semibold text-neutral-900 capitalize">{order.status}</dd>
                </div>
                {order.tracking_number && (
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <dt className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Tracking Number</dt>
                    <dd className="text-base font-semibold text-neutral-900">{order.tracking_number}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Order Items */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-neutral-900">Items</h2>
              </div>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start p-4 bg-neutral-50 rounded-xl">
                    <div className="flex-1 pr-4">
                      <p className="font-semibold text-neutral-900">{item.product_name}</p>
                      {item.variant_name && (
                        <p className="text-sm text-neutral-500 mt-1">{item.variant_name}</p>
                      )}
                      <p className="text-sm text-neutral-500 mt-1">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-neutral-900 whitespace-nowrap">
                      {formatPrice(item.total, order.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-neutral-900">Shipping Address</h2>
              </div>
              <div className="bg-neutral-50 rounded-xl p-6 text-sm text-neutral-600">
                <p className="font-semibold text-neutral-900 mb-2">{order.shipping_name}</p>
                <p>{order.shipping_address_line1}</p>
                {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                <p>
                  {order.shipping_postal_code} {order.shipping_city}
                </p>
                <p>{order.shipping_country}</p>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-neutral-900">Order Summary</h2>
              </div>
              <div className="bg-neutral-50 rounded-xl p-6">
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-neutral-600 font-medium">Subtotal (incl. VAT)</dt>
                    <dd className="text-neutral-900 font-semibold">{formatPrice(order.subtotal, order.currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-600 font-medium">Shipping</dt>
                    <dd className="text-neutral-900 font-semibold">{formatPrice(order.shipping_cost, order.currency)}</dd>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-200">
                    <dt>VAT included in subtotal</dt>
                    <dd>{formatPrice(order.tax, order.currency)}</dd>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-neutral-200 pt-3 mt-3">
                    <dt className="text-neutral-900">Total</dt>
                    <dd className="text-neutral-900">{formatPrice(order.subtotal + order.shipping_cost, order.currency)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-neutral-100">
              <Link
                href="/shop"
                className="flex-1 inline-flex items-center justify-center gap-2 text-center bg-white border border-neutral-200 text-neutral-900 py-3 px-6 rounded-full font-medium hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Continue Shopping
              </Link>
              <Link
                href="/orders"
                className="flex-1 inline-flex items-center justify-center gap-2 text-center bg-neutral-900 text-white py-3 px-6 rounded-full font-medium hover:bg-neutral-800 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                View All Orders
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

