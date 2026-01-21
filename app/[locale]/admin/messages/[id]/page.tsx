'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { Message } from '@/types/database';

export default function AdminMessageDetailsPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const params = useParams();
  const messageId = params.id as string;
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, [messageId]);

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
      fetchMessage();
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchMessage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/messages/${messageId}`);
      if (!response.ok) {
        alert('Message not found');
        router.push('/admin/messages');
        return;
      }

      const data = await response.json() as { message?: Message };
      if (data.message) {
        setMessage(data.message);
        // Auto-mark as read when viewing
        if (data.message.status === 'unread') {
          await updateStatus('read');
        }
        // Pre-fill reply subject
        setReplySubject(data.message.subject ? `Re: ${data.message.subject}` : 'Re: Your inquiry');
      }
    } catch (error) {
      console.error('Error fetching message:', error);
      alert('Failed to load message');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: Message['status']) => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json() as { message?: Message };
      if (data.message) {
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const handleStatusChange = async (newStatus: Message['status']) => {
    setUpdating(true);
    await updateStatus(newStatus);
    setUpdating(false);
  };

  const handleReply = async () => {
    if (!message || !replyMessage.trim()) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/messages/${messageId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replyText: replyMessage,
          locale: 'sv', // You can make this dynamic based on user preference
        }),
      });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        alert(error.error || 'Failed to send reply');
        return;
      }

      // Clear reply fields
      setReplyMessage('');
      setReplySubject(message.subject ? `Re: ${message.subject}` : 'Re: Your inquiry');
      
      // Refresh message to get updated status
      await fetchMessage();
      
      alert('Reply sent successfully!');
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
      </div>
    );
  }

  if (!message) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950 py-6 sm:py-12 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-6 sm:mb-8">
          <Link
            href="/admin/messages"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            {t('backToMessages')}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-semibold text-white mb-1 sm:mb-2">
                {message.subject || t('noSubject')}
              </h1>
              <p className="text-sm sm:text-base text-neutral-400">{t('contactFormMessage')}</p>
            </div>
            <span
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full border self-start sm:self-auto ${getStatusColor(message.status)}`}
            >
              {message.status === 'unread' ? t('unread') : message.status === 'read' ? t('read') : message.status === 'replied' ? t('replied') : t('archived')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Message Details */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-1">{t('from')}</h3>
                  <p className="text-white font-medium">{message.name}</p>
                  <a
                    href={`mailto:${message.email}`}
                    className="text-blue-400 hover:text-blue-300 text-sm break-all"
                  >
                    {message.email}
                  </a>
                </div>

                {message.subject && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-400 mb-1">{t('subject')}</h3>
                    <p className="text-white">{message.subject}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-1">{t('date')}</h3>
                  <p className="text-white">{formatDate(message.created_at)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-1">{t('message')}</h3>
                  <div className="mt-2 p-4 bg-black/30 rounded-lg border border-white/10">
                    <p className="text-white whitespace-pre-wrap text-sm sm:text-base">{message.message}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reply Section */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">{t('reply')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    {t('subject')}
                  </label>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-neutral-500"
                    placeholder="Re: Your inquiry"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    {t('yourReply')}
                  </label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-neutral-500"
                    placeholder={t('typeReplyPlaceholder')}
                  />
                </div>
                <button
                  onClick={handleReply}
                  disabled={!replyMessage.trim() || updating}
                  className="w-full px-4 py-3 bg-white text-black rounded-lg hover:bg-neutral-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? t('sending') : t('sendReply')}
                </button>
                <p className="text-xs text-neutral-500">
                  {t('replyWillBeSent')}
                </p>
              </div>
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">{t('actions')}</h2>
              <div className="space-y-2">
                <button
                  onClick={() => handleStatusChange(message.status === 'unread' ? 'read' : 'unread')}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 border border-blue-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {message.status === 'unread' ? t('markAsRead') : t('markAsUnread')}
                </button>
                <button
                  onClick={() => handleStatusChange('replied')}
                  disabled={updating || message.status === 'replied'}
                  className="w-full px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 border border-green-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {t('markAsReplied')}
                </button>
                <button
                  onClick={() => handleStatusChange('archived')}
                  disabled={updating || message.status === 'archived'}
                  className="w-full px-4 py-2 bg-neutral-500/20 text-neutral-300 rounded-lg hover:bg-neutral-500/30 border border-neutral-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {t('archive')}
                </button>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">{t('quickInfo')}</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-neutral-400">{t('received')}:</span>
                  <p className="text-white">{formatDate(message.created_at)}</p>
                </div>
                <div>
                  <span className="text-neutral-400">{t('lastUpdated')}:</span>
                  <p className="text-white">{formatDate(message.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

