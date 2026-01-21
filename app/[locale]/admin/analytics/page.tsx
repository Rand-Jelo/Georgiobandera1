'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

type TabType = 'overview' | 'sales' | 'products' | 'settings';

export default function AdminAnalyticsPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Date range state
  const [dateRangeType, setDateRangeType] = useState<'preset' | 'custom'>('preset');
  const [presetDays, setPresetDays] = useState(30);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [revenueByStatus, setRevenueByStatus] = useState<RevenueByStatus>({
    paid: 0,
    pending: 0,
    refunded: 0,
  });
  const [seeding, setSeeding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [salesChartView, setSalesChartView] = useState<'both' | 'revenue' | 'orders'>('both');

  // Calculate days based on date range type
  const days = useMemo(() => {
    if (dateRangeType === 'preset') {
      return presetDays;
    }
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return 30;
  }, [dateRangeType, presetDays, customStartDate, customEndDate]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalRevenue = revenueByStatus.paid + revenueByStatus.pending;
    const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate growth (compare first half vs second half of period)
    const midpoint = Math.floor(salesData.length / 2);
    const firstHalf = salesData.slice(0, midpoint);
    const secondHalf = salesData.slice(midpoint);
    
    const firstHalfRevenue = firstHalf.reduce((sum, d) => sum + d.revenue, 0);
    const secondHalfRevenue = secondHalf.reduce((sum, d) => sum + d.revenue, 0);
    
    const revenueGrowth = firstHalfRevenue > 0 
      ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 
      : 0;

    const firstHalfOrders = firstHalf.reduce((sum, d) => sum + d.orders, 0);
    const secondHalfOrders = secondHalf.reduce((sum, d) => sum + d.orders, 0);
    
    const orderGrowth = firstHalfOrders > 0 
      ? ((secondHalfOrders - firstHalfOrders) / firstHalfOrders) * 100 
      : 0;

    // Best day
    const bestDay = salesData.reduce((best, current) => 
      current.revenue > (best?.revenue || 0) ? current : best, salesData[0]);

    // Average daily revenue
    const avgDailyRevenue = salesData.length > 0 
      ? totalRevenue / salesData.length 
      : 0;

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      revenueGrowth,
      orderGrowth,
      bestDay,
      avgDailyRevenue,
      refundRate: totalRevenue > 0 ? (revenueByStatus.refunded / (totalRevenue + revenueByStatus.refunded)) * 100 : 0,
    };
  }, [salesData, revenueByStatus]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, isAdmin]);

  // Set default custom dates
  useEffect(() => {
    if (!customEndDate) {
      const today = new Date();
      setCustomEndDate(today.toISOString().split('T')[0]);
    }
    if (!customStartDate) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      setCustomStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    }
  }, [customStartDate, customEndDate]);

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

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
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
      await fetchAnalytics();
    } catch (error) {
      console.error('Error deleting sample sales:', error);
      alert('An error occurred while deleting sample sales data.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSeedSales = async () => {
    if (!confirm('This will create 100 random orders for testing. Continue?')) {
      return;
    }

    setSeeding(true);
    try {
      const response = await fetch('/api/admin/seed-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 100 }),
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
      await fetchAnalytics();
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
      const deleteResponse = await fetch('/api/admin/seed-sales', { method: 'DELETE' });
      const deleteData = await deleteResponse.json() as { error?: string; message?: string };

      if (!deleteResponse.ok) {
        alert(deleteData.error || 'Failed to delete sample sales data');
        setDeleting(false);
        return;
      }

      setSeeding(true);
      const seedResponse = await fetch('/api/admin/seed-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 100 }),
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
      await fetchAnalytics();
    } catch (error) {
      console.error('Error deleting and regenerating sales:', error);
      alert('An error occurred while processing sales data.');
    } finally {
      setDeleting(false);
      setSeeding(false);
    }
  };

  // Pie chart data for revenue status
  const pieChartData = [
    { name: 'Paid', value: revenueByStatus.paid, color: '#10b981' },
    { name: 'Pending', value: revenueByStatus.pending, color: '#f59e0b' },
    { name: 'Refunded', value: revenueByStatus.refunded, color: '#ef4444' },
  ].filter(d => d.value > 0);

  if (!isAdmin || (loading && salesData.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'overview',
      label: t('overview'),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: 'sales',
      label: t('sales'),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'products',
      label: t('products'),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: t('settings'),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 py-6 sm:py-12 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/admin"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            {t('backToDashboard')}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-semibold text-white mb-1 sm:mb-2">{t('analytics')}</h1>
              <p className="text-sm sm:text-base text-neutral-400">{t('salesPerformance')}</p>
            </div>
            
            {/* Date Range Picker */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDateRangeType('preset')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus:outline-none ${
                    dateRangeType === 'preset'
                      ? 'bg-white text-black'
                      : 'bg-black/50 text-neutral-400 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {t('preset')}
                </button>
                <button
                  onClick={() => setDateRangeType('custom')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus:outline-none ${
                    dateRangeType === 'custom'
                      ? 'bg-white text-black'
                      : 'bg-black/50 text-neutral-400 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {t('custom')}
                </button>
              </div>
              
              {dateRangeType === 'preset' ? (
                <select
                  value={presetDays}
                  onChange={(e) => setPresetDays(parseInt(e.target.value, 10))}
                  className="px-3 py-2 text-sm border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <option value="7">{t('last7Days')}</option>
                  <option value="30">{t('last30Days')}</option>
                  <option value="90">{t('last90Days')}</option>
                  <option value="180">{t('last6Months')}</option>
                  <option value="365">{t('lastYear')}</option>
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <span className="text-neutral-400 text-sm">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-white/10 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap focus:outline-none ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-neutral-400 hover:text-white hover:border-white/30'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards - Top Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="group relative p-4 sm:p-6 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-xs font-medium text-emerald-400/80 uppercase tracking-wider">
                      {t('totalRevenue')}
                    </h3>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{formatCurrency(kpis.totalRevenue)}</p>
                  <p className={`text-xs mt-2 ${kpis.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatPercent(kpis.revenueGrowth)} {t('vsPrevPeriod')}
                  </p>
                </div>
              </div>
              
              <div className="group relative p-4 sm:p-6 rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <h3 className="text-xs font-medium text-blue-400/80 uppercase tracking-wider">
                      {t('orders')}
                    </h3>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{kpis.totalOrders}</p>
                  <p className={`text-xs mt-2 ${kpis.orderGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatPercent(kpis.orderGrowth)} {t('vsPrevPeriod')}
                  </p>
                </div>
              </div>
              
              <div className="group relative p-4 sm:p-6 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-transparent overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <h3 className="text-xs font-medium text-purple-400/80 uppercase tracking-wider">
                      {t('averageOrderValue')}
                    </h3>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{formatCurrency(kpis.avgOrderValue)}</p>
                  <p className="text-xs text-neutral-500 mt-2">{t('perTransaction')}</p>
                </div>
              </div>
              
              <div className="group relative p-4 sm:p-6 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <h3 className="text-xs font-medium text-amber-400/80 uppercase tracking-wider">
                      {t('average')}
                    </h3>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{formatCurrency(kpis.avgDailyRevenue)}</p>
                  <p className="text-xs text-neutral-500 mt-2">{t('revenuePerDay')}</p>
                </div>
              </div>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="group p-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent hover:from-amber-500/10 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <h3 className="text-xs font-medium text-amber-400/80 uppercase tracking-wider">
                        {t('pendingRevenue')}
                      </h3>
                    </div>
                    <p className="text-xl font-bold text-white">{formatCurrency(revenueByStatus.pending)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="group p-4 rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent hover:from-rose-500/10 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <h3 className="text-xs font-medium text-rose-400/80 uppercase tracking-wider">
                        {t('refundRate')}
                      </h3>
                    </div>
                    <p className="text-xl font-bold text-white">{kpis.refundRate.toFixed(1)}%</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="group p-4 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent hover:from-emerald-500/10 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <h3 className="text-xs font-medium text-emerald-400/80 uppercase tracking-wider">
                        {t('bestDay')}
                      </h3>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {kpis.bestDay ? formatCurrency(kpis.bestDay.revenue) : '-'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {kpis.bestDay ? formatDate(kpis.bestDay.date) : ''}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Trend - Takes 2 columns */}
              <div className="lg:col-span-2 bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">{t('revenueTrend')}</h2>
                    <p className="text-xs text-neutral-500 mt-1">{t('dailyRevenueOverPeriod')}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('sales')}
                    className="text-xs text-neutral-400 hover:text-white transition-colors focus:outline-none px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
                  >
                    {t('viewDetails')} →
                  </button>
                </div>
                {salesData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-neutral-400">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                        <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-sm">{t('noSalesData')}</p>
                    </div>
                  </div>
                ) : (
                  <div tabIndex={-1} style={{ outline: 'none' }} onFocus={(e) => e.target.blur()}>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradientOverview" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="50%" stopColor="#10b981" stopOpacity={0.15}/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#ffffff20"
                        tickFormatter={formatDate}
                        tick={{ fill: '#ffffff50', fontSize: 11 }}
                        axisLine={{ stroke: '#ffffff10' }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#ffffff20"
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                        tick={{ fill: '#ffffff50', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: '#ffffff',
                          padding: '12px',
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        itemStyle={{ color: '#ffffff' }}
                        labelStyle={{ color: '#ffffff', marginBottom: '4px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#revenueGradientOverview)"
                        dot={false}
                        activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#000' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Revenue Distribution Pie Chart */}
              <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-1">{t('revenueStatus')}</h2>
                <p className="text-xs text-neutral-500 mb-4">{t('paymentDistribution')}</p>
                {pieChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-neutral-400">
                    <p className="text-sm">{t('noDataAvailable')}</p>
                  </div>
                ) : (
                  <div>
                    <div tabIndex={-1} style={{ outline: 'none' }} onFocus={(e) => e.target.blur()}>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            color: '#ffffff',
                            padding: '12px',
                          }}
                          itemStyle={{ color: '#ffffff' }}
                          labelStyle={{ color: '#ffffff' }}
                          formatter={(value: number) => [formatCurrency(value), '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                      {pieChartData.map((entry) => {
                        const total = pieChartData.reduce((sum, e) => sum + e.value, 0);
                        const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
                        return (
                          <div key={entry.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-sm text-neutral-400">{entry.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-medium text-white">{formatCurrency(entry.value)}</span>
                              <span className="text-xs text-neutral-500 ml-2">({percent}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Products Quick View */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">{t('topProducts')}</h2>
                  <p className="text-xs text-neutral-500 mt-1">{t('bestPerformingProducts')}</p>
                </div>
                <button
                  onClick={() => setActiveTab('products')}
                  className="text-xs text-neutral-400 hover:text-white transition-colors focus:outline-none px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
                >
                  {t('viewAll')} →
                </button>
              </div>
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                    <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-sm">{t('noProductSalesData')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {topProducts.slice(0, 5).map((product, index) => {
                    const maxRevenue = Math.max(...topProducts.slice(0, 5).map(p => p.total_revenue));
                    const percent = (product.total_revenue / maxRevenue) * 100;
                    return (
                      <div key={product.product_id} className="group p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-amber-500/20 text-amber-400' :
                              index === 1 ? 'bg-neutral-400/20 text-neutral-300' :
                              index === 2 ? 'bg-amber-700/20 text-amber-600' :
                              'bg-white/10 text-neutral-500'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="text-sm text-white font-medium truncate max-w-[200px]">{product.product_name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-400">{formatCurrency(product.total_revenue)}</p>
                            <p className="text-xs text-neutral-500">{product.total_quantity} {t('units')}</p>
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* Revenue Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="group relative p-4 sm:p-6 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-xs sm:text-sm font-medium text-emerald-400/80 uppercase tracking-wider">
                      {t('paidRevenue')}
                    </h3>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{formatCurrency(revenueByStatus.paid)}</p>
                  <p className="text-xs text-neutral-500 mt-2">{t('completedTransactions')}</p>
                </div>
              </div>
              <div className="group relative p-4 sm:p-6 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <h3 className="text-xs sm:text-sm font-medium text-amber-400/80 uppercase tracking-wider">
                      {t('pending')}
                    </h3>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{formatCurrency(revenueByStatus.pending)}</p>
                  <p className="text-xs text-neutral-500 mt-2">{t('awaitingPayment')}</p>
                </div>
              </div>
              <div className="group relative p-4 sm:p-6 rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-rose-600/5 to-transparent overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <h3 className="text-xs sm:text-sm font-medium text-rose-400/80 uppercase tracking-wider">
                      {t('refunded')}
                    </h3>
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{formatCurrency(revenueByStatus.refunded)}</p>
                  <p className="text-xs text-neutral-500 mt-2">{t('moneyReturned')}</p>
                </div>
              </div>
            </div>

            {/* Sales Chart */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-8">
              {/* Chart Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{t('salesPerformance')}</h2>
                  <p className="text-sm text-neutral-400">
                    {salesData.length > 0 && (
                      <>
                        {formatDate(salesData[0]?.date)} — {formatDate(salesData[salesData.length - 1]?.date)}
                      </>
                    )}
                  </p>
                </div>
                
                {/* View Toggle */}
                <div className="flex items-center gap-1 p-1 bg-black/40 rounded-lg border border-white/10">
                  <button
                    onClick={() => setSalesChartView('both')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all focus:outline-none ${
                      salesChartView === 'both'
                        ? 'bg-white/10 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {t('all')}
                  </button>
                  <button
                    onClick={() => setSalesChartView('revenue')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all focus:outline-none flex items-center gap-1.5 ${
                      salesChartView === 'revenue'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-neutral-400 hover:text-emerald-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {t('revenue')}
                  </button>
                  <button
                    onClick={() => setSalesChartView('orders')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all focus:outline-none flex items-center gap-1.5 ${
                      salesChartView === 'orders'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-neutral-400 hover:text-blue-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    {t('orders')}
                  </button>
                </div>
              </div>

              {/* Quick Stats Row */}
              {salesData.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-xs text-neutral-500 mb-1">{t('totalRevenue')}</p>
                      <p className="text-lg font-semibold text-white">
                        {formatCurrency(salesData.reduce((sum, d) => sum + d.revenue, 0))}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-xs text-neutral-500 mb-1">{t('orders')}</p>
                      <p className="text-lg font-semibold text-white">
                        {salesData.reduce((sum, d) => sum + d.orders, 0)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-xs text-neutral-500 mb-1">{t('average')}</p>
                      <p className="text-lg font-semibold text-white">
                        {formatCurrency(salesData.reduce((sum, d) => sum + d.revenue, 0) / salesData.length)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-xs text-neutral-500 mb-1">{t('averageOrderValue')}</p>
                    <p className="text-lg font-semibold text-white">
                      {formatCurrency(
                        salesData.reduce((sum, d) => sum + d.orders, 0) > 0
                          ? salesData.reduce((sum, d) => sum + d.revenue, 0) / salesData.reduce((sum, d) => sum + d.orders, 0)
                          : 0
                      )}
                    </p>
                  </div>
                </div>
              )}

              {salesData.length === 0 ? (
                <div className="h-64 sm:h-96 flex items-center justify-center text-neutral-400">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-sm">{t('noSalesData')}</p>
                  </div>
                </div>
              ) : (
                <div tabIndex={-1} style={{ outline: 'none' }} onFocus={(e) => e.target.blur()}>
                <ResponsiveContainer width="100%" height={420}>
                  <ComposedChart data={salesData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="50%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="ordersAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#ffffff08" 
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#ffffff20"
                      tickFormatter={formatDate}
                      tick={{ fill: '#ffffff50', fontSize: 11 }}
                      axisLine={{ stroke: '#ffffff10' }}
                      tickLine={false}
                      dy={10}
                    />
                    {(salesChartView === 'both' || salesChartView === 'revenue') && (
                      <YAxis
                        yAxisId="revenue"
                        stroke="#10b98150"
                        tickFormatter={(value) => {
                          if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                          return value.toString();
                        }}
                        tick={{ fill: '#10b981', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={50}
                      />
                    )}
                    {(salesChartView === 'both' || salesChartView === 'orders') && (
                      <YAxis
                        yAxisId="orders"
                        orientation={salesChartView === 'orders' ? 'left' : 'right'}
                        stroke="#3b82f650"
                        tick={{ fill: '#3b82f6', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                    )}
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#ffffff',
                        padding: '16px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'Revenue') {
                          return [formatCurrency(value), 'Revenue'];
                        }
                        if (name === 'Orders') {
                          return [`${value} orders`, 'Orders'];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => (
                        new Date(label).toLocaleDateString('sv-SE', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      )}
                      cursor={{ stroke: '#ffffff20', strokeWidth: 1, strokeDasharray: '5 5' }}
                      itemStyle={{ color: '#ffffff', padding: '4px 0' }}
                      labelStyle={{ color: '#ffffff', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    {(salesChartView === 'both' || salesChartView === 'revenue') && (
                      <>
                        <Area
                          yAxisId="revenue"
                          type="monotone"
                          dataKey="revenue"
                          stroke="transparent"
                          fill="url(#revenueAreaGradient)"
                          animationDuration={1000}
                          animationEasing="ease-out"
                          legendType="none"
                          tooltipType="none"
                        />
                        <Line
                          yAxisId="revenue"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ 
                            r: 6, 
                            stroke: '#10b981', 
                            strokeWidth: 2,
                            fill: '#000',
                          }}
                          name="Revenue"
                          animationDuration={1000}
                          animationEasing="ease-out"
                        />
                      </>
                    )}
                    {(salesChartView === 'both' || salesChartView === 'orders') && (
                      <>
                        <Area
                          yAxisId="orders"
                          type="monotone"
                          dataKey="orders"
                          stroke="transparent"
                          fill="url(#ordersAreaGradient)"
                          animationDuration={1200}
                          animationEasing="ease-out"
                          legendType="none"
                          tooltipType="none"
                        />
                        <Line
                          yAxisId="orders"
                          type="monotone"
                          dataKey="orders"
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ 
                            r: 6, 
                            stroke: '#3b82f6', 
                            strokeWidth: 2,
                            fill: '#000',
                          }}
                          name="Orders"
                          animationDuration={1200}
                          animationEasing="ease-out"
                        />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
                </div>
              )}
              
              {/* Chart Legend */}
              {salesData.length > 0 && (
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/5">
                  {(salesChartView === 'both' || salesChartView === 'revenue') && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm text-neutral-400">{t('chartLegendRevenue')}</span>
                    </div>
                  )}
                  {(salesChartView === 'both' || salesChartView === 'orders') && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-neutral-400">{t('chartLegendOrders')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Product Stats Cards */}
            {topProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <h3 className="text-xs font-medium text-blue-400/80 uppercase tracking-wider">{t('totalUnits')}</h3>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {topProducts.reduce((sum, p) => sum + p.total_quantity, 0)}
                  </p>
                </div>
                <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h3 className="text-xs font-medium text-emerald-400/80 uppercase tracking-wider">{t('totalRevenue')}</h3>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {formatCurrency(topProducts.reduce((sum, p) => sum + p.total_revenue, 0))}
                  </p>
                </div>
                <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <h3 className="text-xs font-medium text-purple-400/80 uppercase tracking-wider">{t('bestSeller')}</h3>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-white truncate">
                    {topProducts[0]?.product_name || '-'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">{topProducts[0]?.total_quantity || 0} {t('unitsSold')}</p>
                </div>
                <div className="p-4 sm:p-5 rounded-xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <h3 className="text-xs font-medium text-amber-400/80 uppercase tracking-wider">{t('avgPrice')}</h3>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {formatCurrency(
                      topProducts.reduce((sum, p) => sum + p.total_quantity, 0) > 0
                        ? topProducts.reduce((sum, p) => sum + p.total_revenue, 0) / topProducts.reduce((sum, p) => sum + p.total_quantity, 0)
                        : 0
                    )}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">{t('perUnit')}</p>
                </div>
              </div>
            )}

            {/* Top Products Chart */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{t('productPerformance')}</h2>
                  <p className="text-sm text-neutral-400">{t('topProductsBySales', { count: topProducts.length })}</p>
                </div>
              </div>
              
              {topProducts.length === 0 ? (
                <div className="h-64 sm:h-96 flex items-center justify-center text-neutral-400">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-sm">{t('noProductSalesData')}</p>
                    <p className="text-xs text-neutral-500 mt-1">{t('productsWillAppear')}</p>
                  </div>
                </div>
              ) : (
                <div tabIndex={-1} style={{ outline: 'none' }} onFocus={(e) => e.target.blur()}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topProducts} margin={{ top: 20, right: 20, left: 0, bottom: 80 }}>
                    <defs>
                      <linearGradient id="quantityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      </linearGradient>
                      <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.4}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis
                      dataKey="product_name"
                      stroke="#ffffff20"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fill: '#ffffff50', fontSize: 10 }}
                      axisLine={{ stroke: '#ffffff10' }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#3b82f650"
                      tick={{ fill: '#3b82f6', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#10b98150"
                      tickFormatter={(value) => {
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                        return value.toString();
                      }}
                      tick={{ fill: '#10b981', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#ffffff',
                        padding: '16px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'Revenue') {
                          return [formatCurrency(value), 'Revenue'];
                        }
                        if (name === 'Units Sold') {
                          return [`${value} units`, 'Units Sold'];
                        }
                        return [value, name];
                      }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                      itemStyle={{ color: '#ffffff', padding: '4px 0' }}
                      labelStyle={{ color: '#ffffff', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
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
                </div>
              )}
              
              {/* Chart Legend */}
              {topProducts.length > 0 && (
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-blue-500" />
                      <span className="text-sm text-neutral-400">{t('unitsSold')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                      <span className="text-sm text-neutral-400">{t('chartLegendRevenue')}</span>
                    </div>
                </div>
              )}
            </div>

            {/* Top Products Table */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">{t('productRankings')}</h2>
                <span className="text-xs text-neutral-500 bg-white/5 px-3 py-1 rounded-full">
                  {topProducts.length} {t('products')}
                </span>
              </div>
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  {t('noProductSalesData')}
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((product, index) => {
                    const maxRevenue = Math.max(...topProducts.map(p => p.total_revenue));
                    const maxUnits = Math.max(...topProducts.map(p => p.total_quantity));
                    const revenuePercent = (product.total_revenue / maxRevenue) * 100;
                    const unitsPercent = (product.total_quantity / maxUnits) * 100;
                    
                    return (
                      <div 
                        key={product.product_id} 
                        className="group p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all"
                      >
                        <div className="flex items-start gap-4">
                          {/* Rank Badge */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-amber-500/20 text-amber-400' :
                            index === 1 ? 'bg-neutral-400/20 text-neutral-300' :
                            index === 2 ? 'bg-amber-700/20 text-amber-600' :
                            'bg-white/5 text-neutral-500'
                          }`}>
                            {index + 1}
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4 mb-3">
                              <h3 className="font-medium text-white truncate">{product.product_name}</h3>
                              <span className="text-lg font-bold text-emerald-400 flex-shrink-0">
                                {formatCurrency(product.total_revenue)}
                              </span>
                            </div>
                            
                            {/* Progress Bars */}
                            <div className="space-y-2">
                              {/* Revenue Bar */}
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-neutral-500 w-16">{t('revenue')}</span>
                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                                    style={{ width: `${revenuePercent}%` }}
                                  />
                                </div>
                              </div>
                              {/* Units Bar */}
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-neutral-500 w-16">{t('units')}</span>
                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                                    style={{ width: `${unitsPercent}%` }}
                                  />
                                </div>
                                <span className="text-xs text-neutral-400 w-12 text-right">{product.total_quantity}</span>
                              </div>
                            </div>
                            
                            {/* Stats Row */}
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-neutral-500">{t('ordersLabel')}:</span>
                                <span className="text-xs font-medium text-neutral-300">{product.order_count}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-neutral-500">{t('avgPerOrder')}:</span>
                                <span className="text-xs font-medium text-neutral-300">
                                  {formatCurrency(product.total_revenue / product.order_count)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-neutral-500">{t('avgPerUnit')}:</span>
                                <span className="text-xs font-medium text-neutral-300">
                                  {formatCurrency(product.total_revenue / product.total_quantity)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Developer Tools */}
            <div className="bg-black/50 border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowDevTools(!showDevTools)}
                className="w-full p-4 sm:p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors focus:outline-none"
              >
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white">{t('developerTools')}</h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1">{t('generateManageSampleData')}</p>
                </div>
                <svg
                  className={`w-5 h-5 text-neutral-400 transition-transform ${showDevTools ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDevTools && (
                <div className="p-4 sm:p-6 border-t border-white/10 bg-amber-500/5">
                  <div className="flex items-start gap-3 mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm text-amber-200 font-medium">{t('developmentOnly')}</p>
                      <p className="text-xs text-amber-200/70 mt-1">
                        {t('devToolsWarning')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={handleSeedSales}
                      disabled={seeding || deleting}
                      className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-sm font-medium text-blue-300">
                          {seeding ? t('generating') : t('generateData')}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 text-left">{t('createTestOrders')}</p>
                    </button>

                    <button
                      onClick={handleDeleteSampleData}
                      disabled={deleting || seeding}
                      className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-sm font-medium text-red-300">
                          {deleting ? t('deleting') : t('deleteSampleData')}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 text-left">{t('removeTestOrders')}</p>
                    </button>

                    <button
                      onClick={handleDeleteAndRegenerate}
                      disabled={seeding || deleting}
                      className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-sm font-medium text-green-300">
                          {(deleting || seeding) ? t('processing') : t('regenerateAll')}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 text-left">{t('deleteAndCreateFresh')}</p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Data Info */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">{t('dataInformation')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/5">
                  <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">{t('currentPeriod')}</p>
                  <p className="text-sm text-white font-medium">{days} {t('days')}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5">
                  <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">{t('dataPoints')}</p>
                  <p className="text-sm text-white font-medium">{salesData.length} {t('daysOfData')}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5">
                  <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">{t('productsTracked')}</p>
                  <p className="text-sm text-white font-medium">{topProducts.length} {t('products')}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5">
                  <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">{t('lastUpdated')}</p>
                  <p className="text-sm text-white font-medium">{new Date().toLocaleString('sv-SE')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
