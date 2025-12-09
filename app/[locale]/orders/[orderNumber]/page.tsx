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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <Link
            href="/orders"
            className="text-indigo-600 hover:text-indigo-500"
          >
            View all orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
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
            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              Order Confirmed!
            </h1>
            <p className="mt-2 text-gray-600">
              Thank you for your order. We've sent a confirmation email.
            </p>
          </div>

          {/* Order Details */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Details
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Order Number</dt>
                <dd className="mt-1 font-medium text-gray-900">{order.order_number}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Date</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {new Date(order.created_at * 1000).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="mt-1 font-medium text-gray-900 capitalize">{order.status}</dd>
              </div>
              {order.tracking_number && (
                <div>
                  <dt className="text-gray-500">Tracking Number</dt>
                  <dd className="mt-1 font-medium text-gray-900">{order.tracking_number}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Order Items */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-sm text-gray-500">{item.variant_name}</p>
                    )}
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatPrice(item.total, order.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{order.shipping_name}</p>
              <p>{order.shipping_address_line1}</p>
              {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
              <p>
                {order.shipping_postal_code} {order.shipping_city}
              </p>
              <p>{order.shipping_country}</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-8 mt-8">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Subtotal</dt>
                <dd className="text-gray-900">{formatPrice(order.subtotal, order.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Shipping</dt>
                <dd className="text-gray-900">{formatPrice(order.shipping_cost, order.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Tax</dt>
                <dd className="text-gray-900">{formatPrice(order.tax, order.currency)}</dd>
              </div>
              <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-2">
                <dt className="text-gray-900">Total</dt>
                <dd className="text-gray-900">{formatPrice(order.total, order.currency)}</dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-8 mt-8 flex gap-4">
            <Link
              href="/shop"
              className="flex-1 text-center bg-gray-100 text-gray-900 py-2 px-4 rounded-md font-medium hover:bg-gray-200"
            >
              Continue Shopping
            </Link>
            <Link
              href="/orders"
              className="flex-1 text-center bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700"
            >
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

