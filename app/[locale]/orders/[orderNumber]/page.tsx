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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-200 border-t-neutral-900 mx-auto"></div>
          <p className="mt-4 text-neutral-500 font-light">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error && !showGuestForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 mb-6 font-light">{error}</p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-sm font-light uppercase tracking-wider hover:bg-neutral-800 transition-all duration-300"
          >
            View all orders
          </Link>
        </div>
      </div>
    );
  }

  if (showGuestForm && !order) {
    return (
      <div className="min-h-screen bg-white">
        {/* Dark Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_50%)]" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,_transparent,_transparent_2px,_rgba(255,255,255,0.02)_2px,_rgba(255,255,255,0.02)_4px)]" />
          </div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 py-24">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="inline-block">
                <p className="text-[10px] font-light uppercase tracking-[0.4em] text-amber-400/80">
                  View Order
                </p>
                <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent mx-auto" />
              </div>
              <h1 className="text-4xl font-extralight tracking-wide sm:text-5xl lg:text-6xl">
                Order #{orderNumber}
              </h1>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full mx-auto">
            <div className="bg-white border border-neutral-200/50 overflow-hidden">
              <form className="px-8 py-10 space-y-6" onSubmit={handleGuestAccess}>
                <div>
                  <label htmlFor="guestEmail" className="block text-xs font-light uppercase tracking-wider text-neutral-700 mb-3">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="guestEmail"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                    placeholder="your.email@example.com"
                    className="block w-full px-5 py-3.5 border border-neutral-200/50 bg-white/80 backdrop-blur-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all text-sm font-light"
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50/50 border border-red-200/50 p-4 backdrop-blur-sm">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
                
                <div className="pt-6 border-t border-neutral-200/50">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 border border-transparent text-sm font-light uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {loading ? 'Loading...' : 'View Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Dark Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,_transparent,_transparent_2px,_rgba(255,255,255,0.02)_2px,_rgba(255,255,255,0.02)_4px)]" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="inline-block">
              <p className="text-[10px] font-light uppercase tracking-[0.4em] text-amber-400/80">
                Order Details
              </p>
              <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent mx-auto" />
            </div>
            <h1 className="text-4xl font-extralight tracking-wide sm:text-5xl lg:text-6xl">
              Order #{order.order_number}
            </h1>
            <p className="text-sm font-light tracking-wide text-neutral-400 sm:text-base">
              {new Date(order.created_at * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Order Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Order Tracking Timeline */}
          <div className="bg-white border border-neutral-200/50">
            <div className="p-8 border-b border-neutral-200/50">
              <h2 className="text-sm font-light uppercase tracking-wider text-neutral-900">
                Order Tracking
              </h2>
            </div>
            <div className="p-8">
              
              {order.statusHistory && order.statusHistory.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-200/50"></div>
                  <div className="space-y-6">
                    {order.statusHistory.map((status, index) => {
                      const isLast = index === order.statusHistory!.length - 1;
                      const statusConfig = getStatusConfig(status.status);
                      
                      return (
                        <div key={status.id} className="relative flex items-start gap-4">
                          <div className={`relative z-10 flex items-center justify-center w-8 h-8 ${
                            isLast ? 'bg-neutral-900' : 'bg-neutral-300'
                          }`}>
                            {isLast ? (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <div className="w-2 h-2 bg-white"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="bg-neutral-50/50 backdrop-blur-sm border border-neutral-200/50 p-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-light text-neutral-900 uppercase tracking-wide text-sm">{statusConfig.label}</p>
                                <p className="text-xs text-neutral-500 font-light">
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
                                <p className="text-sm text-neutral-600 font-light">{status.message}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-50/50 backdrop-blur-sm border border-neutral-200/50 p-6 text-center">
                  <p className="text-neutral-600 font-light">No tracking information available yet.</p>
                </div>
              )}

              {order.tracking_number && (
                <div className="mt-6 bg-neutral-50/50 backdrop-blur-sm border border-neutral-200/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1 font-light">Tracking Number</p>
                      <p className="text-base font-light text-neutral-900 font-mono">{order.tracking_number}</p>
                    </div>
                    <a
                      href={`https://tracking.postnord.com/track/${order.tracking_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-neutral-900 text-white text-xs font-light uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                    >
                      Track Package
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white border border-neutral-200/50">
            <div className="p-8 border-b border-neutral-200/50">
              <h2 className="text-sm font-light uppercase tracking-wider text-neutral-900">
                Order Details
              </h2>
            </div>
            <div className="p-8">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-neutral-50/50 backdrop-blur-sm border border-neutral-200/50 p-4">
                  <dt className="text-xs text-neutral-500 uppercase tracking-wider mb-2 font-light">Order Number</dt>
                  <dd className="text-base font-light text-neutral-900">{order.order_number}</dd>
                </div>
                <div className="bg-neutral-50/50 backdrop-blur-sm border border-neutral-200/50 p-4">
                  <dt className="text-xs text-neutral-500 uppercase tracking-wider mb-2 font-light">Date</dt>
                  <dd className="text-base font-light text-neutral-900">
                    {new Date(order.created_at * 1000).toLocaleDateString()}
                  </dd>
                </div>
                <div className="bg-neutral-50/50 backdrop-blur-sm border border-neutral-200/50 p-4">
                  <dt className="text-xs text-neutral-500 uppercase tracking-wider mb-2 font-light">Status</dt>
                  <dd className="text-base font-light text-neutral-900 uppercase tracking-wide">{order.status}</dd>
                </div>
                <div className="bg-neutral-50/50 backdrop-blur-sm border border-neutral-200/50 p-4">
                  <dt className="text-xs text-neutral-500 uppercase tracking-wider mb-2 font-light">Payment Status</dt>
                  <dd className="text-base font-light text-neutral-900 uppercase tracking-wide">{order.payment_status}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white border border-neutral-200/50">
            <div className="p-8 border-b border-neutral-200/50">
              <h2 className="text-sm font-light uppercase tracking-wider text-neutral-900">Items</h2>
            </div>
            <div className="p-8 space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-4 bg-neutral-50/50 backdrop-blur-sm border border-neutral-200/50">
                  <div className="flex-1 pr-4">
                    <p className="font-light text-neutral-900">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-sm text-neutral-500 mt-1 font-light">{item.variant_name}</p>
                    )}
                    <p className="text-sm text-neutral-500 mt-1 font-light">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-light text-neutral-900 whitespace-nowrap">
                    {formatPrice(item.total, order.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-neutral-200/50">
            <div className="p-8 border-b border-neutral-200/50">
              <h2 className="text-sm font-light uppercase tracking-wider text-neutral-900">Shipping Address</h2>
            </div>
            <div className="p-8">
              <div className="bg-neutral-50/50 backdrop-blur-sm border border-neutral-200/50 p-6 text-sm text-neutral-600 font-light">
                <p className="font-light text-neutral-900 mb-2">{order.shipping_name}</p>
                <p>{order.shipping_address_line1}</p>
                {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                <p>
                  {order.shipping_postal_code} {order.shipping_city}
                </p>
                <p>{order.shipping_country}</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white border border-neutral-200/50">
            <div className="p-8 border-b border-neutral-200/50">
              <h2 className="text-sm font-light uppercase tracking-wider text-neutral-900">Order Summary</h2>
            </div>
            <div className="p-8">
              <div className="bg-neutral-50/50 backdrop-blur-sm border border-neutral-200/50 p-6">
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-neutral-600 font-light">Subtotal (incl. VAT)</dt>
                    <dd className="text-neutral-900 font-light">{formatPrice(order.subtotal, order.currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-600 font-light">Shipping</dt>
                    <dd className="text-neutral-900 font-light">{formatPrice(order.shipping_cost, order.currency)}</dd>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-200/50 font-light">
                    <dt>VAT included in subtotal</dt>
                    <dd>{formatPrice(order.tax, order.currency)}</dd>
                  </div>
                  <div className="flex justify-between text-lg font-light border-t border-neutral-200/50 pt-3 mt-3">
                    <dt className="text-neutral-900">Total</dt>
                    <dd className="text-neutral-900">{formatPrice(order.subtotal + order.shipping_cost, order.currency)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/shop"
              className="flex-1 inline-flex items-center justify-center gap-2 text-center bg-white border border-neutral-200/50 text-neutral-900 py-4 px-6 text-sm font-light uppercase tracking-wider hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Continue Shopping
            </Link>
            <Link
              href="/orders"
              className="flex-1 inline-flex items-center justify-center gap-2 text-center bg-neutral-900 text-white py-4 px-6 text-sm font-light uppercase tracking-wider hover:bg-neutral-800 transition-all duration-300"
            >
              View All Orders
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
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

