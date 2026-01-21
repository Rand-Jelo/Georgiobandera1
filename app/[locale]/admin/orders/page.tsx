'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { Order } from '@/types/database';

export default function AdminOrdersPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, []);

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
      fetchOrders();
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      // Fetch all orders without search - we'll filter client-side
      const url = `/api/admin/orders${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json() as { orders?: Order[] };
      setAllOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  useEffect(() => {
    if (!isAdmin) return;

    let filtered = [...allOrders];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order => {
        const orderNumber = order.order_number?.toLowerCase() || '';
        const email = order.email?.toLowerCase() || '';
        const name = order.shipping_name?.toLowerCase() || '';
        const address = `${order.shipping_address_line1 || ''} ${order.shipping_address_line2 || ''} ${order.shipping_city || ''} ${order.shipping_postal_code || ''} ${order.shipping_country || ''}`.toLowerCase();
        return orderNumber.includes(query) || 
               email.includes(query) || 
               name.includes(query) || 
               address.includes(query);
      });
    }

    setOrders(filtered);
  }, [allOrders, searchQuery, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, isAdmin]);

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-6 sm:py-12 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-6 sm:mb-8">
          <Link
            href="/admin"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            {t('backToDashboard')}
          </Link>
          <h1 className="text-2xl sm:text-4xl font-semibold text-white mb-1 sm:mb-2">{t('orders')}</h1>
          <p className="text-sm sm:text-base text-neutral-400">{t('viewManageOrders')}</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder={t('search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-white/20 bg-black/50 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-sm text-neutral-400">{t('filter')}:</span>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-white text-black'
                    : 'bg-black/50 text-neutral-300 hover:bg-black/70 border border-white/10'
                }`}
              >
                {status === 'all' ? t('all') : status === 'pending' ? t('pending') : status === 'paid' ? t('paid') : status === 'processing' ? t('processing') : status === 'shipped' ? t('shipped') : status === 'delivered' ? t('delivered') : status === 'cancelled' ? t('cancelled') : t('refunded')}
              </button>
            ))}
          </div>
          </div>
        </div>

        {orders.length === 0 && !loading ? (
          <div className="bg-black/50 border border-white/10 rounded-lg p-8 sm:p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <svg className="w-12 sm:w-16 h-12 sm:h-16 text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-neutral-400 text-base sm:text-lg font-medium mb-2">{t('noResults')}</p>
              <p className="text-neutral-500 text-xs sm:text-sm">
                {searchQuery || statusFilter !== 'all' 
                  ? t('noResults')
                  : t('noResults')
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-black/50 border border-white/10 rounded-lg overflow-visible">
            <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-black/70">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  {t('orderNumber')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden sm:table-cell">
                  {t('customer')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  {t('total')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden md:table-cell">
                  {t('date')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.map((order) => {
                const formatCurrency = (amount: number) => {
                  return new Intl.NumberFormat('sv-SE', {
                    style: 'currency',
                    currency: order.currency || 'SEK',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(amount);
                };

                const getStatusColor = (status: Order['status']) => {
                  switch (status) {
                    case 'paid':
                    case 'delivered':
                      return 'bg-green-500/20 text-green-300';
                    case 'pending':
                      return 'bg-yellow-500/20 text-yellow-300';
                    case 'processing':
                    case 'shipped':
                      return 'bg-blue-500/20 text-blue-300';
                    case 'cancelled':
                    case 'refunded':
                      return 'bg-red-500/20 text-red-300';
                    default:
                      return 'bg-gray-500/20 text-gray-300';
                  }
                };

                return (
                  <tr key={order.id} className="hover:bg-black/30 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-white">{order.order_number}</div>
                      <div className="text-xs text-neutral-500 sm:hidden">{order.shipping_name || order.email}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm text-white">{order.shipping_name || order.email}</div>
                      <div className="text-xs text-neutral-500">{order.email}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-white">{formatCurrency(order.subtotal + order.shipping_cost)}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}
                      >
                        {order.status === 'pending' ? t('pending') : order.status === 'paid' ? t('paid') : order.status === 'processing' ? t('processing') : order.status === 'shipped' ? t('shipped') : order.status === 'delivered' ? t('delivered') : order.status === 'cancelled' ? t('cancelled') : t('refunded')}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-neutral-400">
                        {new Date(order.created_at * 1000).toLocaleDateString('sv-SE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-white hover:text-neutral-300 text-xs sm:text-sm"
                      >
                        {t('view')}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

