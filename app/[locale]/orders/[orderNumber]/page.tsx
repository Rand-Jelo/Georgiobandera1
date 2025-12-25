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

interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  message: string | null;
  created_at: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
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
  statusHistory?: OrderStatusHistory[];
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
  const [guestEmail, setGuestEmail] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  const fetchOrder = async (email?: string) => {
    try {
      const url = email 
        ? `/api/orders/${orderNumber}?email=${encodeURIComponent(email)}`
        : `/api/orders/${orderNumber}`;
      
      const response = await fetch(url);
      const data = await response.json() as { order?: Order; error?: string };

      if (data.error) {
        if (data.error.includes('email') || data.error.includes('Unauthorized')) {
          setShowGuestForm(true);
          setError('');
        } else {
          setError(data.error);
        }
      } else {
        setOrder(data.order || null);
        setShowGuestForm(false);
      }
    } catch (err) {
      setError('Failed to load order');
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim()) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError('');
    await fetchOrder(guestEmail);
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

  if (error && !showGuestForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 mb-6 font-medium">{error}</p>
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

  if (showGuestForm && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-16 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-neutral-100 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">View Your Order</h1>
            <p className="text-neutral-600">Enter your email address to view order {orderNumber}</p>
          </div>
          
          <form onSubmit={handleGuestAccess} className="space-y-4">
            <div>
              <label htmlFor="guestEmail" className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="guestEmail"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
                className="block w-full px-4 py-3 border border-neutral-200 rounded-xl bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm"
              />
            </div>
            
            {error && (
              <div className="rounded-xl bg-red-50/50 border border-red-200/50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'View Order'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
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
            {/* Order Tracking Timeline */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  Order Tracking
                </h2>
              </div>
              
              {/* Tracking Timeline */}
              {order.statusHistory && order.statusHistory.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200"></div>
                  <div className="space-y-6">
                    {order.statusHistory.map((status, index) => {
                      const isLast = index === order.statusHistory!.length - 1;
                      const statusConfig = getStatusConfig(status.status);
                      
                      return (
                        <div key={status.id} className="relative flex items-start gap-4">
                          <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                            isLast ? 'bg-neutral-900' : 'bg-neutral-300'
                          }`}>
                            {isLast ? (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="bg-neutral-50 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-neutral-900 capitalize">{statusConfig.label}</p>
                                <p className="text-xs text-neutral-500">
                                  {new Date(status.created_at * 1000).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              {status.message && (
                                <p className="text-sm text-neutral-600">{status.message}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-50 rounded-xl p-6 text-center">
                  <p className="text-neutral-600">No tracking information available yet.</p>
                </div>
              )}

              {/* Tracking Number */}
              {order.tracking_number && (
                <div className="mt-6 bg-neutral-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Tracking Number</p>
                      <p className="text-base font-semibold text-neutral-900 font-mono">{order.tracking_number}</p>
                    </div>
                    <a
                      href={`https://tracking.postnord.com/track/${order.tracking_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
                    >
                      Track Package
                    </a>
                  </div>
                </div>
              )}
            </div>

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
                <div className="bg-neutral-50 rounded-xl p-4">
                  <dt className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Payment Status</dt>
                  <dd className="text-base font-semibold text-neutral-900 capitalize">{order.payment_status}</dd>
                </div>
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

// Helper function to get status configuration
function getStatusConfig(status: string): { label: string; icon: string } {
  const statusMap: Record<string, { label: string; icon: string }> = {
    pending: { label: 'Order Placed', icon: '📦' },
    processing: { label: 'Processing', icon: '⚙️' },
    shipped: { label: 'Shipped', icon: '🚚' },
    delivered: { label: 'Delivered', icon: '✅' },
    cancelled: { label: 'Cancelled', icon: '❌' },
    refunded: { label: 'Refunded', icon: '↩️' },
  };

  return statusMap[status.toLowerCase()] || { label: status, icon: '📋' };
}

