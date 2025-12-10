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

