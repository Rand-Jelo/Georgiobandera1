'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';

interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total: number;
  created_at: number;
}

interface Customer {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  is_registered: boolean;
  order_count: number;
  total_spent: number;
  last_order_date: number | null;
  created_at: number;
  orders: Order[];
}

export default function AdminCustomerDetailsPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const params = useParams();
  const customerId = decodeURIComponent(params.id as string);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, [customerId]);

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
      fetchCustomer();
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/customers/${encodeURIComponent(customerId)}`);
      if (!response.ok) {
        setError('Customer not found');
        setLoading(false);
        return;
      }
      const data = await response.json() as { customer?: Customer };
      if (data.customer) {
        setCustomer(data.customer);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
      setError('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
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

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-red-400 text-lg">{error || 'Customer not found'}</div>
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
            href="/admin/customers"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            {t('backToCustomers')}
          </Link>
          <h1 className="text-2xl sm:text-4xl font-semibold text-white mb-1 sm:mb-2">{t('customerDetails')}</h1>
          <p className="text-sm sm:text-base text-neutral-400">{t('viewCustomerInfoAndHistory')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">{t('customerInfo')}</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-neutral-400">{t('name')}</p>
                  <p className="text-white font-medium">{customer.name || t('notProvided')}</p>
                </div>
                <div>
                  <p className="text-neutral-400">{t('email')}</p>
                  <p className="text-white font-medium break-all">{customer.email}</p>
                </div>
                {customer.phone && (
                  <div>
                    <p className="text-neutral-400">{t('phone')}</p>
                    <p className="text-white font-medium">{customer.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-neutral-400">{t('accountType')}</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      customer.is_registered
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-gray-500/20 text-gray-300'
                    }`}
                  >
                    {customer.is_registered ? t('registeredUser') : t('guestCustomer')}
                  </span>
                </div>
                <div>
                  <p className="text-neutral-400">{t('memberSince')}</p>
                  <p className="text-white font-medium">
                    {new Date(customer.created_at * 1000).toLocaleDateString('sv-SE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Stats */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">{t('statistics')}</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">{t('totalOrders')}</span>
                  <span className="text-white font-medium">{customer.order_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">{t('totalSpent')}</span>
                  <span className="text-white font-medium">{formatCurrency(customer.total_spent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">{t('averageOrder')}</span>
                  <span className="text-white font-medium">
                    {customer.order_count > 0
                      ? formatCurrency(customer.total_spent / customer.order_count)
                      : formatCurrency(0)}
                  </span>
                </div>
                {customer.last_order_date && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">{t('lastOrder')}</span>
                    <span className="text-white font-medium">
                      {new Date(customer.last_order_date * 1000).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2 bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">{t('orderHistory')}</h2>
            {customer.orders.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <p>{t('noOrdersYet')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-black/70">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        {t('orderNumber')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden sm:table-cell">
                        {t('date')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        {t('status')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden md:table-cell">
                        {t('total')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        {t('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {customer.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-black/30 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-medium text-white">{order.order_number}</div>
                          <div className="text-xs text-neutral-500 sm:hidden">
                            {new Date(order.created_at * 1000).toLocaleDateString('sv-SE', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-sm text-neutral-400">
                            {new Date(order.created_at * 1000).toLocaleDateString('sv-SE', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}
                          >
                            {order.status === 'pending' ? t('pending') : order.status === 'paid' ? t('paid') : order.status === 'processing' ? t('processing') : order.status === 'shipped' ? t('shipped') : order.status === 'delivered' ? t('delivered') : order.status === 'cancelled' ? t('cancelled') : t('refunded')}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm font-medium text-white">{formatCurrency(order.total)}</div>
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

