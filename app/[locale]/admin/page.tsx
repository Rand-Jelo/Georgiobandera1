'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';

export default function AdminDashboard() {
  const t = useTranslations('common');
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState<{
    migrated: boolean;
    loading: boolean;
    message: string;
  }>({ migrated: true, loading: false, message: '' });
  const [stats, setStats] = useState<{
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    totalCategories: number;
    totalUsers: number;
    lowStockProducts: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

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
      if (!data.user) {
        router.push('/login');
        return;
      }

      if (!data.user.is_admin) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      checkMigrationStatus();
      fetchStats();
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const checkMigrationStatus = async () => {
    try {
      setMigrationStatus((prev) => ({ ...prev, loading: true }));
      const response = await fetch('/api/admin/migrations');
      const data = await response.json() as {
        migrated?: boolean;
        message?: string;
        error?: string;
      };
      setMigrationStatus({
        migrated: data.migrated ?? true,
        loading: false,
        message: data.message || data.error || '',
      });
    } catch (error) {
      console.error('Migration status check failed:', error);
      setMigrationStatus({
        migrated: true,
        loading: false,
        message: 'Failed to check migration status',
      });
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json() as { stats?: typeof stats };
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const runMigrations = async () => {
    if (!confirm('Are you sure you want to run migrations? This will create/update database tables.')) {
      return;
    }

    try {
      setMigrationStatus((prev) => ({ ...prev, loading: true }));
      const response = await fetch('/api/admin/migrations', {
        method: 'POST',
      });
      const data = await response.json() as {
        success?: boolean;
        message?: string;
        error?: string;
      };

      if (data.success) {
        alert('Migrations completed successfully!\n\n' + data.message);
        await checkMigrationStatus();
      } else {
        alert('Migration failed: ' + (data.error || data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Run migrations failed:', error);
      alert('Failed to run migrations. Please check the console for details.');
    } finally {
      setMigrationStatus((prev) => ({ ...prev, loading: false }));
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-12 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-white mb-2">Admin Dashboard</h1>
          <p className="text-neutral-400">Manage your e-commerce store</p>
        </div>

        {/* Migration Status Alert */}
        {!migrationStatus.migrated && (
          <div className="mb-6 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-yellow-300 mb-1">
                  Database Migration Required
                </h3>
                <p className="text-yellow-200/80 text-sm">
                  {migrationStatus.message || 'The database needs to be migrated. Your login credentials may not work until migrations are run.'}
                </p>
              </div>
              <button
                onClick={runMigrations}
                disabled={migrationStatus.loading}
                className="px-4 py-2 text-sm font-medium rounded-lg text-black bg-yellow-400 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-yellow-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {migrationStatus.loading ? 'Running...' : 'Run Migrations'}
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {statsLoading ? (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-6 rounded-lg border border-white/10 bg-black/50 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-24 mb-4"></div>
                <div className="h-8 bg-white/10 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue */}
            <div className="p-6 rounded-lg border border-white/10 bg-gradient-to-br from-green-500/10 to-green-600/5 hover:border-green-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">Total Revenue</h3>
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-neutral-500 mt-1">From {stats.totalOrders} orders</p>
            </div>

            {/* Total Products */}
            <Link
              href="/admin/products"
              className="p-6 rounded-lg border border-white/10 bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:border-blue-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">Products</h3>
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalProducts}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {stats.activeProducts} active
                {stats.lowStockProducts > 0 && (
                  <span className="text-yellow-400 ml-1">• {stats.lowStockProducts} low stock</span>
                )}
              </p>
            </Link>

            {/* Orders */}
            <Link
              href="/admin/orders"
              className="p-6 rounded-lg border border-white/10 bg-gradient-to-br from-purple-500/10 to-purple-600/5 hover:border-purple-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">Orders</h3>
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalOrders}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {stats.pendingOrders > 0 ? (
                  <span className="text-yellow-400">{stats.pendingOrders} pending</span>
                ) : (
                  'All processed'
                )}
              </p>
            </Link>

            {/* Categories & Users */}
            <div className="p-6 rounded-lg border border-white/10 bg-gradient-to-br from-orange-500/10 to-orange-600/5 hover:border-orange-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">Store Info</h3>
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalCategories}</p>
                  <p className="text-xs text-neutral-500">Categories</p>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                  <p className="text-xs text-neutral-500">Users</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/admin/products"
            className="block p-6 rounded-lg border border-white/10 bg-black/50 hover:bg-black/70 hover:border-white/20 transition-all"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Products</h3>
            <p className="text-neutral-400 text-sm">Manage products, variants, and images</p>
          </Link>

          <Link
            href="/admin/categories"
            className="block p-6 rounded-lg border border-white/10 bg-black/50 hover:bg-black/70 hover:border-white/20 transition-all"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Categories</h3>
            <p className="text-neutral-400 text-sm">Organize product categories</p>
          </Link>

          <Link
            href="/admin/orders"
            className="block p-6 rounded-lg border border-white/10 bg-black/50 hover:bg-black/70 hover:border-white/20 transition-all"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Orders</h3>
            <p className="text-neutral-400 text-sm">View and manage orders</p>
          </Link>

          <Link
            href="/admin/messages"
            className="block p-6 rounded-lg border border-white/10 bg-black/50 hover:bg-black/70 hover:border-white/20 transition-all"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Messages</h3>
            <p className="text-neutral-400 text-sm">Contact form messages</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

