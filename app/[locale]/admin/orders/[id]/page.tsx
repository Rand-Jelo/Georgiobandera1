'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import type { Order, OrderItem } from '@/types/database';

export default function AdminOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status'] | ''>('');
  const [newTrackingNumber, setNewTrackingNumber] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, [orderId]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json() as { user?: { is_admin?: boolean } };
      if (!data.user || !data.user.is_admin) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      fetchOrder();
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}`);
      if (!response.ok) {
        alert('Order not found');
        router.push('/admin/orders');
        return;
      }

      const data = await response.json() as { order?: Order; items?: OrderItem[] };
      if (data.order) {
        setOrder(data.order);
        setNewStatus(data.order.status);
        setNewTrackingNumber(data.order.tracking_number || '');
      }
      if (data.items) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === order?.status) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json() as { error?: string; order?: Order };

      if (!response.ok) {
        alert(data.error || 'Failed to update order status');
        return;
      }

      if (data.order) {
        setOrder(data.order);
      }
      alert('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      alert('An error occurred while updating the order.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateTracking = async () => {
    if (!newTrackingNumber.trim()) {
      alert('Please enter a tracking number');
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tracking_number: newTrackingNumber.trim() }),
      });

      const data = await response.json() as { error?: string; order?: Order };

      if (!response.ok) {
        alert(data.error || 'Failed to update tracking number');
        return;
      }

      if (data.order) {
        setOrder(data.order);
        setNewTrackingNumber(data.order.tracking_number || '');
      }
      alert('Tracking number updated successfully');
    } catch (error) {
      console.error('Error updating tracking:', error);
      alert('An error occurred while updating the tracking number.');
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'SEK') => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'paid':
      case 'delivered':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'processing':
      case 'shipped':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-12 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <Link
            href="/admin/orders"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            ← Back to Orders
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-white mb-2">Order {order.order_number}</h1>
              <p className="text-neutral-400">Order details and management</p>
            </div>
            <span
              className={`px-4 py-2 text-sm font-medium rounded-full border ${getStatusColor(order.status)}`}
            >
              {order.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Order Items</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                    <div>
                      <p className="text-white font-medium">{item.product_name}</p>
                      {item.variant_name && (
                        <p className="text-sm text-neutral-400">Variant: {item.variant_name}</p>
                      )}
                      {item.sku && (
                        <p className="text-xs text-neutral-500">SKU: {item.sku}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-white">Qty: {item.quantity}</p>
                      <p className="text-neutral-400">{formatCurrency(item.price)}</p>
                      <p className="text-sm text-white font-medium">Total: {formatCurrency(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Shipping Address</h2>
              <div className="text-neutral-300 space-y-1">
                <p className="text-white font-medium">{order.shipping_name}</p>
                <p>{order.shipping_address_line1}</p>
                {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                <p>{order.shipping_city}, {order.shipping_postal_code}</p>
                <p>{order.shipping_country}</p>
                {order.shipping_phone && <p className="mt-2">Phone: {order.shipping_phone}</p>}
              </div>
            </div>
          </div>

          {/* Order Summary & Actions */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Shipping:</span>
                  <span>{formatCurrency(order.shipping_cost, order.currency)}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Tax:</span>
                  <span>{formatCurrency(order.tax, order.currency)}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between text-white font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(order.total, order.currency)}</span>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Order Information</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-neutral-400">Order Date:</span>
                  <p className="text-white">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <span className="text-neutral-400">Email:</span>
                  <p className="text-white">{order.email}</p>
                </div>
                {order.payment_method && (
                  <div>
                    <span className="text-neutral-400">Payment Method:</span>
                    <p className="text-white capitalize">{order.payment_method}</p>
                  </div>
                )}
                {order.payment_status && (
                  <div>
                    <span className="text-neutral-400">Payment Status:</span>
                    <p className="text-white capitalize">{order.payment_status}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Update Status */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Update Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Order Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as Order['status'])}
                    className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating || newStatus === order.status}
                  className="w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>

            {/* Tracking Number */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Tracking Number</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={newTrackingNumber}
                    onChange={(e) => setNewTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-neutral-500"
                  />
                </div>
                <button
                  onClick={handleUpdateTracking}
                  disabled={updating || !newTrackingNumber.trim() || newTrackingNumber === order.tracking_number}
                  className="w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? 'Updating...' : 'Update Tracking'}
                </button>
                {order.tracking_number && (
                  <p className="text-sm text-neutral-400">
                    Current: {order.tracking_number}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

