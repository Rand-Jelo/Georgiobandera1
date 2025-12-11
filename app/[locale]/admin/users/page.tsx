'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import type { User } from '@/types/database';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
      const response = await fetch('/api/admin/users');
      const data = await response.json() as { users?: User[] };
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

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
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
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
    <div className="min-h-screen bg-neutral-950 py-12 relative">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#ffffff08,_transparent_60%),repeating-linear-gradient(120deg,_#ffffff05,_#ffffff05_1px,_transparent_1px,_transparent_8px)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-neutral-400 hover:text-white mb-4 inline-block text-sm"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-semibold text-white mb-2">Users</h1>
          <p className="text-neutral-400">Manage user accounts</p>
        </div>

        <div className="bg-black/50 border border-white/10 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-black/70">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-neutral-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isCurrentUser = user.id === currentUserId;
                  return (
                    <tr key={user.id} className="hover:bg-black/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-400">{user.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-400">{user.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.is_admin
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-neutral-500/20 text-neutral-300'
                          }`}
                        >
                          {user.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-400">{formatDate(user.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                          disabled={isCurrentUser}
                          className={`mr-4 ${
                            user.is_admin
                              ? 'text-yellow-400 hover:text-yellow-300'
                              : 'text-purple-400 hover:text-purple-300'
                          } ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isCurrentUser ? 'Cannot modify your own admin status' : user.is_admin ? 'Remove admin status' : 'Make admin'}
                        >
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
                          disabled={isCurrentUser}
                          className={`text-red-400 hover:text-red-300 ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isCurrentUser ? 'Cannot delete your own account' : 'Delete user'}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

