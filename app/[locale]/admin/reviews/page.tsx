'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { ProductReview } from '@/types/database';

export default function AdminReviewsPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [allReviews, setAllReviews] = useState<ProductReview[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
      fetchReviews();
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      // Fetch all reviews without search - we'll filter client-side
      const url = `/api/admin/reviews${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json() as { reviews?: ProductReview[] };
      setAllReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  useEffect(() => {
    if (!isAdmin) return;

    let filtered = [...allReviews];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(review => {
        const name = review.name?.toLowerCase() || '';
        const email = review.email?.toLowerCase() || '';
        const title = review.title?.toLowerCase() || '';
        const text = review.review_text?.toLowerCase() || '';
        return name.includes(query) || 
               email.includes(query) || 
               title.includes(query) || 
               text.includes(query);
      });
    }

    setReviews(filtered);
  }, [allReviews, searchQuery, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, isAdmin]);

  const handleStatusChange = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        alert('Failed to update review status');
        return;
      }

      fetchReviews();
    } catch (error) {
      console.error('Error updating review status:', error);
      alert('Failed to update review status');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert('Failed to delete review');
        return;
      }

      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
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
        <div className="mb-6 sm:mb-8">
          <Link
            href="/admin"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            {t('backToDashboard')}
          </Link>
          <h1 className="text-2xl sm:text-4xl font-semibold text-white mb-1 sm:mb-2">{t('productReviews')}</h1>
          <p className="text-sm sm:text-base text-neutral-400">{t('manageReviews')}</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder={t('searchReviewsPlaceholder')}
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
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                    statusFilter === status
                      ? 'bg-white text-black'
                      : 'bg-black/50 text-neutral-300 hover:bg-black/70 border border-white/10'
                  }`}
                >
                  {status === 'all' ? t('all') : status === 'pending' ? t('pending') : status === 'approved' ? t('approved') : t('rejected')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 rounded-lg overflow-hidden">
          {reviews.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <svg className="w-12 sm:w-16 h-12 sm:h-16 text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <p className="text-neutral-400 text-base sm:text-lg font-medium mb-2">{t('noReviewsFound')}</p>
                <p className="text-neutral-500 text-xs sm:text-sm">
                  {searchQuery || statusFilter !== 'all' 
                    ? t('tryAdjustingSearchOrFilters')
                    : t('reviewsWillAppear')
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 sm:p-6 hover:bg-black/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
                        <div className="min-w-0">
                          <p className="text-white font-medium text-sm sm:text-base truncate">{review.name}</p>
                          <p className="text-xs sm:text-sm text-neutral-400 truncate">{review.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-xs sm:text-sm text-neutral-400">({review.rating}/5)</span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            review.status === 'approved'
                              ? 'bg-green-500/20 text-green-300'
                              : review.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {review.status === 'pending' ? t('pending') : review.status === 'approved' ? t('approved') : t('rejected')}
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="text-base sm:text-lg font-semibold text-white mb-2">{review.title}</h4>
                      )}
                      <p className="text-sm sm:text-base text-neutral-300 mb-2">{review.review_text}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-400">
                        <span>{t('productId')}: {review.product_id}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Date(review.created_at * 1000).toLocaleDateString('sv-SE')}</span>
                        {review.helpful_count > 0 && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span>{review.helpful_count} {t('helpful')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="relative ml-4">
                      <button
                        ref={(el) => {
                          if (el && openMenuId === review.id && !menuPosition) {
                            const rect = el.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + 8,
                              right: window.innerWidth - rect.right,
                            });
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openMenuId === review.id) {
                            setOpenMenuId(null);
                            setMenuPosition(null);
                          } else {
                            setOpenMenuId(review.id);
                            setMenuPosition(null); // Reset to trigger ref callback
                          }
                        }}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        aria-label="Review actions"
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dropdown menu - rendered outside to avoid clipping */}
        {openMenuId && menuPosition && (() => {
          const review = reviews.find(r => r.id === openMenuId);
          if (!review) return null;
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
                  {review.status === 'pending' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          setMenuPosition(null);
                          handleStatusChange(review.id, 'approved');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-green-400/10 transition-colors"
                      >
                        {t('approve')}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          setMenuPosition(null);
                          handleStatusChange(review.id, 'rejected');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                      >
                        {t('reject')}
                      </button>
                    </>
                  )}
                  {review.status === 'approved' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        setMenuPosition(null);
                        handleStatusChange(review.id, 'rejected');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                    >
                      {t('reject')}
                    </button>
                  )}
                  {review.status === 'rejected' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        setMenuPosition(null);
                        handleStatusChange(review.id, 'approved');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-green-400/10 transition-colors"
                    >
                      {t('approve')}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      setMenuPosition(null);
                      handleDelete(review.id);
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

