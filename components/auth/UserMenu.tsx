'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';

interface User {
  id: string;
  email: string;
  name: string | null;
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.5c1.5-3 3.8-4.5 6.5-4.5s5 1.5 6.5 4.5" />
    </svg>
  );
}

interface UserMenuProps {
  trigger?: ReactNode;
}

export default function UserMenu({ trigger }: UserMenuProps = {}) {
  const t = useTranslations('common');
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();

    // Listen for login/logout events
    const handleUserUpdate = () => checkAuth();
    window.addEventListener('user-updated', handleUserUpdate);

    // Re-check when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) checkAuth();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('user-updated', handleUserUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const checkAuth = async () => {
    try {
      // Add timestamp to prevent caching
      const response = await fetch(`/api/auth/me?t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json() as { user?: User };
        if (data.user) {
          setUser(data.user);
        }
      } else {
        // Not authenticated - clear any stale user state
        setUser(null);
      }
    } catch (err) {
      // Not authenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);

    // Trigger updates to clear state across components
    window.dispatchEvent(new Event('user-updated'));
    window.dispatchEvent(new Event('cart-updated'));

    // Hard refresh to home page to clear all client state and give visual feedback
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative">
        {trigger ? (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="cursor-pointer"
          >
            {trigger}
          </div>
        ) : (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
          >
            <span>{user.name || user.email}</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-black/95 border border-white/10 rounded-xl shadow-xl py-1 z-20">
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {t('profile')}
              </Link>
              <Link
                href="/wishlist"
                className="block px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {t('wishlist')}
              </Link>
              <Link
                href="/orders"
                className="block px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {t('orders')}
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // If trigger provided but not logged in, wrap it in a link
  if (trigger) {
    return (
      <Link
        href="/login"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 hover:bg-white hover:text-black transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
        aria-label="My account"
      >
        <UserIcon className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <Link href="/login" className="text-gray-700 hover:text-gray-900">
        {t('login')}
      </Link>
      <Link
        href="/register"
        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
      >
        {t('register')}
      </Link>
    </div>
  );
}

