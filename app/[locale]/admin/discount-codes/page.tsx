'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { DiscountCode } from '@/types/database';

export default function AdminDiscountCodesPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [allCodes, setAllCodes] = useState<DiscountCode[]>([]);
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

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
      fetchCodes();
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeFilter !== 'all') {
        params.append('active', activeFilter === 'active' ? 'true' : 'false');
      }
      // Fetch all codes without search - we'll filter client-side
      const url = `/api/admin/discount-codes${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json() as { codes?: DiscountCode[]; error?: string; needsMigration?: boolean };
      
      if (!response.ok && data.needsMigration) {
        // Show migration message
        return;
      }
      
      if (!response.ok) {
        console.error('Error fetching discount codes:', data.error);
        return;
      }
      
      setAllCodes(data.codes || []);
    } catch (error) {
      console.error('Error fetching discount codes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  useEffect(() => {
    if (!isAdmin) return;

    let filtered = [...allCodes];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(code => {
        const codeStr = code.code?.toLowerCase() || '';
        const description = code.description?.toLowerCase() || '';
        return codeStr.includes(query) || description.includes(query);
      });
    }

    setCodes(filtered);
  }, [allCodes, searchQuery, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchCodes();
    }
     
  }, [activeFilter, isAdmin]);

  const handleDelete = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/discount-codes/${codeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert('Failed to delete discount code');
        return;
      }

      fetchCodes();
    } catch (error) {
      console.error('Error deleting discount code:', error);
      alert('Failed to delete discount code');
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return t('noExpiry');
    return new Date(timestamp * 1000).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDiscount = (code: DiscountCode) => {
    if (code.discount_type === 'percentage') {
      return `${code.discount_value}%`;
    }
    return `${code.discount_value} SEK`;
  };

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
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
            >
              {t('backToDashboard')}
            </Link>
            <h1 className="text-2xl sm:text-4xl font-semibold text-white mb-1 sm:mb-2">{t('discountCodes')}</h1>
            <p className="text-sm sm:text-base text-neutral-400">{t('manageDiscountCodes')}</p>
          </div>
          <Link
            href="/admin/discount-codes/new"
            className="rounded-lg bg-white px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-black hover:bg-neutral-100 transition-colors self-start sm:self-auto"
          >
            {t('createDiscountCode')}
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder={t('searchDiscountCodesPlaceholder')}
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
            <span className="text-sm text-neutral-400">{t('filterByStatus')}:</span>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'active', 'inactive'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveFilter(status)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                    activeFilter === status
                      ? 'bg-white text-black'
                      : 'bg-black/50 text-neutral-300 hover:bg-black/70 border border-white/10'
                  }`}
                >
                  {status === 'all' ? t('all') : status === 'active' ? t('active') : t('inactive')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 rounded-lg overflow-hidden">
          {codes.length === 0 && !loading ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <svg className="w-12 sm:w-16 h-12 sm:h-16 text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-neutral-400 text-base sm:text-lg font-medium mb-2">{t('noDiscountCodesFound')}</p>
                <p className="text-neutral-500 text-xs sm:text-sm mb-4">
                  {searchQuery || activeFilter !== 'all' 
                    ? t('tryAdjustingSearchOrFilters')
                    : t('createDiscountCodesDesc')
                  }
                </p>
                {!searchQuery && activeFilter === 'all' && (
                  <Link
                    href="/admin/discount-codes/new"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white text-black hover:bg-neutral-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('createFirstDiscountCode')}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-black/70">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    {t('code')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    {t('discount')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden sm:table-cell">
                    {t('usage')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden md:table-cell">
                    {t('validUntil')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-black/30 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-white">{code.code}</div>
                      {code.description && (
                        <div className="text-xs sm:text-sm text-neutral-400">{code.description}</div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-white">{formatDiscount(code)}</div>
                      {code.minimum_purchase > 0 && (
                        <div className="text-xs text-neutral-400">
                          Min: {code.minimum_purchase} SEK
                        </div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm text-neutral-400">
                        {code.usage_count}
                        {code.usage_limit !== null ? ` / ${code.usage_limit}` : ' / ∞'}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-neutral-400">
                        {formatDate(code.valid_until)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          code.active
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}
                      >
                        {code.active ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block">
                        <button
                          ref={(el) => {
                            if (el && openMenuId === code.id && !menuPosition) {
                              const rect = el.getBoundingClientRect();
                              setMenuPosition({
                                top: rect.bottom + 8,
                                right: window.innerWidth - rect.right,
                              });
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openMenuId === code.id) {
                              setOpenMenuId(null);
                              setMenuPosition(null);
                            } else {
                              setOpenMenuId(code.id);
                              setMenuPosition(null); // Reset to trigger ref callback
                            }
                          }}
                          className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          aria-label="Discount code actions"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Dropdown menu - rendered outside table to avoid clipping */}
        {openMenuId && menuPosition && (() => {
          const code = codes.find(c => c.id === openMenuId);
          if (!code) return null;
          return (
            <>
              {/* Backdrop to close menu */}
              <div
                className="fixed inset-0 z-[100]"
                onClick={() => {
                  setOpenMenuId(null);
                  setMenuPosition(null);
                }}
              />
              {/* Dropdown menu */}
              <div
                className="fixed w-48 rounded-lg border border-white/10 bg-black/95 backdrop-blur-sm shadow-xl z-[101]"
                style={{
                  top: `${menuPosition.top}px`,
                  right: `${menuPosition.right}px`,
                }}
              >
                <div className="py-1">
                  <Link
                    href={`/admin/discount-codes/${code.id}/edit`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      setMenuPosition(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors block"
                  >
                    {t('edit')}
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      setMenuPosition(null);
                      handleDelete(code.id);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

