'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { Message } from '@/types/database';

export default function AdminMessagesPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | Message['status']>('all');
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

      const data = await response.json() as { user?: { is_admin?: boolean } };
      if (!data.user || !data.user.is_admin) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      fetchMessages();
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      // Fetch all messages without search - we'll filter client-side
      const url = `/api/admin/messages${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json() as { messages?: Message[] };
      setAllMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  useEffect(() => {
    if (!isAdmin) return;

    let filtered = [...allMessages];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(message => {
        const name = message.name?.toLowerCase() || '';
        const email = message.email?.toLowerCase() || '';
        const subject = message.subject?.toLowerCase() || '';
        const messageText = message.message?.toLowerCase() || '';
        return name.includes(query) || 
               email.includes(query) || 
               subject.includes(query) || 
               messageText.includes(query);
      });
    }

    setMessages(filtered);
  }, [allMessages, searchQuery, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchMessages();
    }
     
  }, [statusFilter, isAdmin]);

  const handleStatusChange = async (messageId: string, newStatus: Message['status']) => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        alert('Failed to update message status');
        return;
      }

      // Refresh messages list
      await fetchMessages();
    } catch (error) {
      console.error('Error updating message status:', error);
      alert('An error occurred while updating the message status.');
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
          <h1 className="text-2xl sm:text-4xl font-semibold text-white mb-1 sm:mb-2">{t('messages')}</h1>
          <p className="text-sm sm:text-base text-neutral-400">{t('contactFormMessages')}</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder={t('searchMessagesPlaceholder')}
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
              {(['all', 'unread', 'read', 'replied', 'archived'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                    statusFilter === status
                      ? 'bg-white text-black'
                      : 'bg-black/50 text-neutral-300 hover:bg-black/70 border border-white/10'
                  }`}
                >
                  {status === 'all' ? t('all') : status === 'unread' ? t('unread') : status === 'read' ? t('read') : status === 'replied' ? t('replied') : t('archived')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {messages.length === 0 && !loading ? (
          <div className="bg-black/50 border border-white/10 rounded-lg p-8 sm:p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <svg className="w-12 sm:w-16 h-12 sm:h-16 text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-neutral-400 text-base sm:text-lg font-medium mb-2">{t('noMessagesFound')}</p>
              <p className="text-neutral-500 text-xs sm:text-sm">
                {searchQuery || statusFilter !== 'all' 
                  ? t('tryAdjustingSearchOrFilters')
                  : t('messagesWillAppear')
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-black/50 border border-white/10 rounded-lg overflow-visible">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-black/70">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                      {t('from')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden sm:table-cell">
                      {t('subject')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                      {t('status')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider hidden md:table-cell">
                      {t('date')}
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {messages.map((message) => {
                    const getStatusColor = (status: Message['status']) => {
                      switch (status) {
                        case 'unread':
                          return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                        case 'read':
                          return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
                        case 'replied':
                          return 'bg-green-500/20 text-green-300 border-green-500/30';
                        case 'archived':
                          return 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30';
                        default:
                          return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
                      }
                    };

                    return (
                      <tr
                        key={message.id}
                        className={`hover:bg-black/30 transition-colors ${
                          message.status === 'unread' ? 'bg-blue-500/5' : ''
                        }`}
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {message.status === 'unread' && (
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-white truncate">{message.name}</div>
                              <div className="text-xs sm:text-sm text-neutral-400 truncate">{message.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                          <div className="text-sm text-white font-medium">{message.subject || t('noSubject')}</div>
                          <div className="text-xs text-neutral-500 mt-1 line-clamp-1">
                            {message.message.substring(0, 60)}...
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(message.status)}`}
                          >
                            {message.status === 'unread' ? t('unread') : message.status === 'read' ? t('read') : message.status === 'replied' ? t('replied') : t('archived')}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm text-neutral-400">
                            {new Date(message.created_at * 1000).toLocaleDateString('sv-SE', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/messages/${message.id}`}
                            className="text-white hover:text-neutral-300 text-xs sm:text-sm"
                          >
                            {t('view')}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

