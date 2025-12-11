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
  const [seeding, setSeeding] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteSampleData = async () => {
    if (!confirm('Are you sure you want to delete all sample sales data? This will only delete orders with customer*@example.com emails.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/admin/seed-sales', { method: 'DELETE' });
      const data = await response.json() as { error?: string; message?: string; deletedOrders?: number };

      if (!response.ok) {
        alert(data.error || 'Failed to delete sample sales data');
        return;
      }

      alert(data.message || `Deleted ${data.deletedOrders || 0} sample orders successfully!`);
      await fetchAnalytics(); // Refresh analytics
    } catch (error) {
      console.error('Error deleting sample sales:', error);
      alert('An error occurred while deleting sample sales data.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSeedSales = async () => {
    if (!confirm('This will create 20 random orders for testing. Continue?')) {
      return;
    }

    setSeeding(true);
    try {
      const response = await fetch('/api/admin/seed-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 20 }),
      });

      const data = await response.json() as { success?: boolean; error?: string; message?: string; details?: string };

      if (!response.ok) {
        const errorMsg = data.details 
          ? `${data.error || 'Failed to generate sales data'}: ${data.details}`
          : data.error || 'Failed to generate sales data';
        console.error('Seed sales error:', data);
        alert(errorMsg);
        return;
      }

      alert(data.message || 'Sales data generated successfully!');
      await fetchAnalytics(); // Refresh analytics
    } catch (error) {
      console.error('Error seeding sales:', error);
      alert('An error occurred while generating sales data.');
    } finally {
      setSeeding(false);
    }
  };

  const handleDeleteAndRegenerate = async () => {
    if (!confirm('This will delete all sample sales data and generate new data. Continue?')) {
      return;
    }

    setDeleting(true);
    try {
      // Delete existing sample data
      const deleteResponse = await fetch('/api/admin/seed-sales', { method: 'DELETE' });
      const deleteData = await deleteResponse.json() as { error?: string; message?: string };

      if (!deleteResponse.ok) {
        alert(deleteData.error || 'Failed to delete sample sales data');
        setDeleting(false);
        return;
      }

      // Generate new data
      setSeeding(true);
      const seedResponse = await fetch('/api/admin/seed-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 20 }),
      });
      const seedData = await seedResponse.json() as { error?: string; message?: string; details?: string };

      if (!seedResponse.ok) {
        const errorMsg = seedData.details 
          ? `${seedData.error || 'Failed to generate sales data'}: ${seedData.details}`
          : seedData.error || 'Failed to generate sales data';
        console.error('Seed sales error:', seedData);
        alert(errorMsg);
        return;
      }

      alert('Sample sales data deleted and regenerated successfully!');
      await fetchAnalytics(); // Refresh analytics
    } catch (error) {
      console.error('Error deleting and regenerating sales:', error);
      alert('An error occurred while processing sales data.');
    } finally {
      setDeleting(false);
      setSeeding(false);
    }
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
              <button
                onClick={handleDeleteSampleData}
                disabled={deleting || seeding}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete Sample Data'}
              </button>
              <button
                onClick={handleSeedSales}
                disabled={seeding || deleting}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {seeding ? 'Generating...' : 'Generate Sample Data'}
              </button>
              <button
                onClick={handleDeleteAndRegenerate}
                disabled={seeding || deleting}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {(deleting || seeding) ? 'Processing...' : 'Delete & Regenerate'}
              </button>
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
        <div className="bg-black/50 border border-white/10 rounded-lg p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">Sales Over Time</h2>
            <p className="text-sm text-neutral-400">Revenue and order trends for the selected period</p>
          </div>
          {salesData.length === 0 ? (
            <div className="h-96 flex items-center justify-center text-neutral-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No sales data available for this period</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={450}>
              <LineChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#ffffff40"
                  tickFormatter={formatDate}
                  tick={{ fill: '#ffffff60', fontSize: 12 }}
                  axisLine={{ stroke: '#ffffff20' }}
                  tickLine={{ stroke: '#ffffff20' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#10b981"
                  tickFormatter={(value) => {
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                    return value.toString();
                  }}
                  tick={{ fill: '#10b981', fontSize: 12 }}
                  axisLine={{ stroke: '#10b98140' }}
                  tickLine={{ stroke: '#10b98140' }}
                  label={{ value: 'Revenue (SEK)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#10b981', fontSize: 12 } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#3b82f6"
                  tick={{ fill: '#3b82f6', fontSize: 12 }}
                  axisLine={{ stroke: '#3b82f640' }}
                  tickLine={{ stroke: '#3b82f640' }}
                  label={{ value: 'Orders', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#3b82f6', fontSize: 12 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') {
                      return [formatCurrency(value), 'Revenue'];
                    }
                    if (name === 'orders') {
                      return [value, 'Orders'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => formatDate(label)}
                  cursor={{ stroke: '#ffffff30', strokeWidth: 1 }}
                />
                <Legend
                  wrapperStyle={{ color: '#ffffff', paddingTop: '20px' }}
                  iconType="line"
                  iconSize={16}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#000000' }}
                  activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2 }}
                  name="Revenue"
                  fill="url(#revenueGradient)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#000000' }}
                  activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
                  name="Orders"
                  fill="url(#ordersGradient)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products Chart */}
        <div className="bg-black/50 border border-white/10 rounded-lg p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">Top Products</h2>
            <p className="text-sm text-neutral-400">Best performing products by units sold and revenue</p>
          </div>
          {topProducts.length === 0 ? (
            <div className="h-96 flex items-center justify-center text-neutral-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p>No product sales data available</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={450}>
              <BarChart data={topProducts} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <defs>
                  <linearGradient id="quantityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  </linearGradient>
                  <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis
                  dataKey="product_name"
                  stroke="#ffffff40"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: '#ffffff60', fontSize: 11 }}
                  axisLine={{ stroke: '#ffffff20' }}
                  tickLine={{ stroke: '#ffffff20' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#3b82f6"
                  tick={{ fill: '#3b82f6', fontSize: 12 }}
                  axisLine={{ stroke: '#3b82f640' }}
                  tickLine={{ stroke: '#3b82f640' }}
                  label={{ value: 'Units Sold', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3b82f6', fontSize: 12 } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#10b981"
                  tickFormatter={(value) => {
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                    return value.toString();
                  }}
                  tick={{ fill: '#10b981', fontSize: 12 }}
                  axisLine={{ stroke: '#10b98140' }}
                  tickLine={{ stroke: '#10b98140' }}
                  label={{ value: 'Revenue (SEK)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#10b981', fontSize: 12 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '12px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
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
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Legend
                  wrapperStyle={{ color: '#ffffff', paddingTop: '20px' }}
                  iconSize={16}
                />
                <Bar
                  yAxisId="left"
                  dataKey="total_quantity"
                  fill="url(#quantityGradient)"
                  name="Units Sold"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="total_revenue"
                  fill="url(#revenueBarGradient)"
                  name="Revenue"
                  radius={[4, 4, 0, 0]}
                />
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

