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

      const data = await response.json() as { user?: any };
      if (!data.user) {
        router.push('/login');
        return;
      }

      // TODO: Check if user is admin (you'll need to add an admin field to users table)
      // For now, we'll allow any logged-in user (you should restrict this)
      setIsAdmin(true);
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
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

