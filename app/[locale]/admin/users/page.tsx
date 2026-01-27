'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { User } from '@/types/database';

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

      const data = await response.json() as { user?: { id?: string; is_admin?: boolean } };
      if (!data.user || !data.user.is_admin) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      setCurrentUserId(data.user.id || null);
      fetchUsers();
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch all users without search - we'll filter client-side
      const url = `/api/admin/users`;
      const response = await fetch(url);
      const data = await response.json() as { users?: User[] };
      setAllUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  useEffect(() => {
    if (!isAdmin) return;

    let filtered = [...allUsers];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => {
        const email = user.email?.toLowerCase() || '';
        const name = user.name?.toLowerCase() || '';
        const phone = user.phone?.toLowerCase() || '';
        return email.includes(query) || 
               name.includes(query) || 
               phone.includes(query);
      });
    }

    setUsers(filtered);
  }, [allUsers, searchQuery, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
     
  }, [isAdmin]);

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    if (!confirm(`Are you sure you want to ${currentIsAdmin ? 'remove admin status from' : 'make'} this user?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_admin: !currentIsAdmin }),
      });

      const data = await response.json() as { error?: string; user?: User };

      if (!response.ok) {
        alert(data.error || 'Failed to update user');
        return;
      }

      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error('Error toggling admin status:', error);
      alert('An error occurred while updating the user.');
    }
  };

  const handleDelete = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json() as { error?: string; success?: boolean };

      if (!response.ok) {
        alert(data.error || 'Failed to delete user');
        return;
      }

      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('An error occurred while deleting the user.');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
          <h1 className="text-2xl sm:text-4xl font-semibold text-white mb-1 sm:mb-2">{t('users')}</h1>
          <p className="text-sm sm:text-base text-neutral-400">{t('manageUserAccounts')}</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder={t('searchUsersPlaceholder')}
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

        <div className="bg-black/50 border border-white/10 rounded-lg overflow-visible">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-black/70">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  {t('email')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden sm:table-cell">
                  {t('name')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden lg:table-cell">
                  {t('phone')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  {t('role')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden md:table-cell">
                  {t('created')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 sm:w-16 h-12 sm:h-16 text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-neutral-400 text-base sm:text-lg font-medium mb-2">{t('noUsersFound')}</p>
                      <p className="text-neutral-500 text-xs sm:text-sm">
                        {searchQuery 
                          ? t('tryAdjustingSearch')
                          : t('usersWillAppear')
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isCurrentUser = user.id === currentUserId;
                  return (
                    <tr key={user.id} className="hover:bg-black/30 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-white break-all">{user.email}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm text-neutral-400">{user.name || '-'}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm text-neutral-400">{user.phone || '-'}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.is_admin
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-neutral-500/20 text-neutral-300'
                          }`}
                        >
                          {user.is_admin ? t('admin') : t('user')}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-neutral-400">{formatDate(user.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block">
                          <button
                            ref={(el) => {
                              if (el && openMenuId === user.id && !menuPosition) {
                                const rect = el.getBoundingClientRect();
                                setMenuPosition({
                                  top: rect.bottom + 8,
                                  right: window.innerWidth - rect.right,
                                });
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMenuId === user.id) {
                                setOpenMenuId(null);
                                setMenuPosition(null);
                              } else {
                                setOpenMenuId(user.id);
                                setMenuPosition(null); // Reset to trigger ref callback
                              }
                            }}
                            className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            aria-label="User actions"
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
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Dropdown menu - rendered outside table to avoid clipping */}
        {openMenuId && menuPosition && (() => {
          const user = users.find(u => u.id === openMenuId);
          if (!user) return null;
          const isCurrentUser = user.id === currentUserId;
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      setMenuPosition(null);
                      handleToggleAdmin(user.id, user.is_admin);
                    }}
                    disabled={isCurrentUser}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      user.is_admin
                        ? 'text-yellow-400 hover:bg-yellow-400/10'
                        : 'text-purple-400 hover:bg-purple-400/10'
                    } ${
                      isCurrentUser
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {user.is_admin ? t('removeAdmin') : t('makeAdmin')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      setMenuPosition(null);
                      handleDelete(user.id, user.email);
                    }}
                    disabled={isCurrentUser}
                    className={`w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors ${
                      isCurrentUser
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
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

