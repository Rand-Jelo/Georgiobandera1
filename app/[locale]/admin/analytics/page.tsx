'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

interface RevenueByStatus {
  paid: number;
  pending: number;
  refunded: number;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [revenueByStatus, setRevenueByStatus] = useState<RevenueByStatus>({
    paid: 0,
    pending: 0,
    refunded: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, isAdmin]);

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
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?days=${days}&limit=10`);
      if (!response.ok) {
        console.error('Failed to fetch analytics');
        return;
      }

      const data = await response.json() as {
        salesData?: SalesDataPoint[];
        topProducts?: TopProduct[];
        revenueByStatus?: RevenueByStatus;
      };

      setSalesData(data.salesData || []);
      setTopProducts(data.topProducts || []);
      setRevenueByStatus(data.revenueByStatus || { paid: 0, pending: 0, refunded: 0 });
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-12 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-white mb-2">Analytics</h1>
              <p className="text-neutral-400">Sales performance and product insights</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm text-neutral-400">Time Period:</label>
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10))}
                className="px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-lg border border-white/10 bg-gradient-to-br from-green-500/10 to-green-600/5">
            <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-2">
              Total Revenue (Paid)
            </h3>
            <p className="text-3xl font-bold text-white">{formatCurrency(revenueByStatus.paid)}</p>
          </div>
          <div className="p-6 rounded-lg border border-white/10 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
            <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-2">
              Pending Orders
            </h3>
            <p className="text-3xl font-bold text-white">{formatCurrency(revenueByStatus.pending)}</p>
          </div>
          <div className="p-6 rounded-lg border border-white/10 bg-gradient-to-br from-red-500/10 to-red-600/5">
            <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-2">
              Refunded
            </h3>
            <p className="text-3xl font-bold text-white">{formatCurrency(revenueByStatus.refunded)}</p>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="bg-black/50 border border-white/10 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Sales Over Time</h2>
          {salesData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-neutral-400">
              No sales data available for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis
                  dataKey="date"
                  stroke="#ffffff60"
                  tickFormatter={formatDate}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#ffffff60"
                  tickFormatter={(value) => formatCurrency(value)}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#000000',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') {
                      return [formatCurrency(value), 'Revenue'];
                    }
                    return [value, 'Orders'];
                  }}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Legend
                  wrapperStyle={{ color: '#ffffff' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Orders"
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products Chart */}
        <div className="bg-black/50 border border-white/10 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Top Products</h2>
          {topProducts.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-neutral-400">
              No product sales data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis
                  dataKey="product_name"
                  stroke="#ffffff60"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#ffffff60"
                  tickFormatter={(value) => value.toString()}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#000000',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'total_revenue') {
                      return [formatCurrency(value), 'Revenue'];
                    }
                    if (name === 'total_quantity') {
                      return [value, 'Units Sold'];
                    }
                    return [value, name];
                  }}
                />
                <Legend
                  wrapperStyle={{ color: '#ffffff' }}
                />
                <Bar dataKey="total_quantity" fill="#3b82f6" name="Units Sold" />
                <Bar dataKey="total_revenue" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products Table */}
        <div className="bg-black/50 border border-white/10 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Top Products Details</h2>
          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              No product sales data available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-black/70">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                      Units Sold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                      Orders
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {topProducts.map((product) => (
                    <tr key={product.product_id} className="hover:bg-black/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{product.product_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-300">{product.total_quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{formatCurrency(product.total_revenue)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-300">{product.order_count}</div>
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
  );
}

