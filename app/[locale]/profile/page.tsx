'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  is_admin?: boolean;
}

interface SavedAddress {
  id: string;
  user_id: string;
  label: string | null;
  first_name: string;
  last_name: string;
  company: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: number;
  created_at: number;
  updated_at: number;
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [addressFormData, setAddressFormData] = useState({
    label: '',
    first_name: '',
    last_name: '',
    company: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'SE', // Default to Sweden
    phone: '',
    is_default: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchAddresses();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      const data = await response.json() as { user?: User & { email_verified?: boolean } };
      if (data.user) {
        // Check if email is verified
        if (!data.user.email_verified) {
          router.push('/verify-email-required');
          return;
        }
        setUser(data.user);
        setFormData({
          name: data.user.name || '',
          phone: data.user.phone || '',
        });
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json() as { error?: string; user?: User };

      if (!response.ok) {
        setError(data.error || 'Update failed');
        setUpdating(false);
        return;
      }

      if (data.user) {
        setUser(data.user);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const response = await fetch('/api/addresses');
      if (response.ok) {
        const data = await response.json() as { addresses?: SavedAddress[] };
        setAddresses(data.addresses || []);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      setChangingPassword(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json() as { error?: string; success?: boolean };

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to change password');
        setChangingPassword(false);
        return;
      }

      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError('An error occurred. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    setAddressError('');
    setAddressSuccess(false);

    try {
      const url = editingAddress ? `/api/addresses/${editingAddress.id}` : '/api/addresses';
      const method = editingAddress ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressFormData),
      });

      const data = await response.json() as { error?: string; address?: SavedAddress };

      if (!response.ok) {
        setAddressError(data.error || 'Failed to save address');
        setSavingAddress(false);
        return;
      }

      setAddressSuccess(true);
      setShowAddressForm(false);
      setEditingAddress(null);
      resetAddressForm();
      fetchAddresses();
      setTimeout(() => setAddressSuccess(false), 3000);
    } catch (err) {
      setAddressError('An error occurred. Please try again.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleEditAddress = (address: SavedAddress) => {
    setEditingAddress(address);
    setAddressFormData({
      label: address.label || '',
      first_name: address.first_name,
      last_name: address.last_name,
      company: address.company || '',
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state_province: address.state_province || '',
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone || '',
      is_default: address.is_default === 1,
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert('Failed to delete address');
        return;
      }

      fetchAddresses();
    } catch (err) {
      alert('An error occurred. Please try again.');
    }
  };

  const resetAddressForm = () => {
    setAddressFormData({
      label: '',
      first_name: '',
      last_name: '',
      company: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state_province: '',
      postal_code: '',
      country: 'SE',
      phone: '',
      is_default: false,
    });
  };

  const handleNewAddress = () => {
    resetAddressForm();
    setEditingAddress(null);
    setShowAddressForm(true);
  };

  const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'addresses'>('profile');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-neutral-200 border-t-amber-500"></div>
          <p className="mt-6 text-neutral-500 font-light tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Matching Homepage */}
      <section className="relative bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white py-16 lg:py-20 overflow-hidden">
        {/* Elegant background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,_transparent,_transparent_2px,_rgba(255,255,255,0.02)_2px,_rgba(255,255,255,0.02)_4px)]" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <div className="relative max-w-[1600px] mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
            <div>
              {/* Elegant subtitle */}
              <div className="inline-block mb-4">
                <p className="text-[10px] font-light uppercase tracking-[0.4em] text-amber-400/80">
                  My Account
                </p>
                <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent" />
              </div>
              <h1 className="text-4xl font-extralight tracking-[0.02em] leading-[1.1] mb-2 sm:text-5xl lg:text-6xl">{t('title')}</h1>
              <p className="text-sm font-light text-neutral-300 tracking-wide mt-2">{user.email}</p>
            </div>
            {user.is_admin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-light uppercase tracking-[0.2em] hover:bg-white/20 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Panel
              </Link>
            )}
          </div>
          
          {/* Quick Links */}
          <div className="flex items-center gap-8 pt-6 border-t border-white/10">
            <Link
              href="/orders"
              className="group inline-flex items-center gap-2 text-xs font-light uppercase tracking-[0.2em] text-neutral-300 hover:text-amber-400 transition-colors duration-300"
            >
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {tCommon('orders')}
            </Link>
            <Link
              href="/wishlist"
              className="group inline-flex items-center gap-2 text-xs font-light uppercase tracking-[0.2em] text-neutral-300 hover:text-amber-400 transition-colors duration-300"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {tCommon('wishlist')}
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-6 py-12 lg:py-16">

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="sticky top-8 space-y-2">
              <button
                onClick={() => setActiveSection('profile')}
                className={`w-full text-left px-4 py-3 text-xs font-light uppercase tracking-[0.2em] transition-all duration-300 ${
                  activeSection === 'profile'
                    ? 'text-neutral-900 border-l-2 border-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {t('personalInfo')}
              </button>
              <button
                onClick={() => setActiveSection('password')}
                className={`w-full text-left px-4 py-3 text-xs font-light uppercase tracking-[0.2em] transition-all duration-300 ${
                  activeSection === 'password'
                    ? 'text-neutral-900 border-l-2 border-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {t('changePassword') || 'Change Password'}
              </button>
              <button
                onClick={() => setActiveSection('addresses')}
                className={`w-full text-left px-4 py-3 text-xs font-light uppercase tracking-[0.2em] transition-all duration-300 ${
                  activeSection === 'addresses'
                    ? 'text-neutral-900 border-l-2 border-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {t('savedAddresses') || 'Saved Addresses'}
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="space-y-12">
              {/* Personal Information Section */}
              {activeSection === 'profile' && (
                <div>
                  <div className="mb-8 pb-6 border-b border-neutral-200/50">
                    <h2 className="text-2xl font-extralight tracking-wide text-neutral-900 mb-2">{t('personalInfo')}</h2>
                    <p className="text-sm font-light text-neutral-500">Update your personal information</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    {error && (
                      <div className="bg-red-50/50 border border-red-200/50 p-4">
                        <div className="flex items-center gap-2 text-sm font-light text-red-800">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {error}
                        </div>
                      </div>
                    )}

                    {success && (
                      <div className="bg-green-50/50 border border-green-200/50 p-4">
                        <div className="flex items-center gap-2 text-sm font-light text-green-800">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {t('updated')}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label htmlFor="email" className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={user.email}
                          disabled
                          className="block w-full border border-neutral-200/50 bg-neutral-50/50 text-neutral-400 px-5 py-3 text-sm font-light focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="name" className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                          {t('name') || 'Name'}
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                          placeholder="Your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                        {t('phone') || 'Phone'}
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                        placeholder="+46 123 456 789"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-8 border-t border-neutral-200/50">
                      <button
                        type="submit"
                        disabled={updating}
                        className="inline-flex items-center justify-center gap-2 py-3.5 px-8 bg-neutral-900 text-white text-xs font-light uppercase tracking-[0.2em] hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        {updating ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('updating')}
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                            </svg>
                            {t('updateProfile')}
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 py-3 px-6 border border-neutral-200/50 text-xs font-light uppercase tracking-[0.2em] text-neutral-600 bg-white/50 backdrop-blur-sm hover:bg-white hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {tCommon('logout')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Change Password Section */}
              {activeSection === 'password' && (
                <div>
                  <div className="mb-8 pb-6 border-b border-neutral-200/50">
                    <h2 className="text-2xl font-extralight tracking-wide text-neutral-900 mb-2">{t('changePassword') || 'Change Password'}</h2>
                    <p className="text-sm font-light text-neutral-500">Update your account password</p>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-8">
                    {passwordError && (
                      <div className="bg-red-50/50 border border-red-200/50 p-4">
                        <div className="flex items-center gap-2 text-sm font-light text-red-800">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {passwordError}
                        </div>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="bg-green-50/50 border border-green-200/50 p-4">
                        <div className="flex items-center gap-2 text-sm font-light text-green-800">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {t('passwordChanged') || 'Password changed successfully'}
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="currentPassword" className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                        {t('currentPassword') || 'Current Password'}
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                        {t('newPassword') || 'New Password'}
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                        minLength={8}
                        required
                      />
                      <p className="mt-2 text-xs text-neutral-400 font-light">{t('passwordMinLength') || 'Password must be at least 8 characters'}</p>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                        {t('confirmPassword') || 'Confirm New Password'}
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                        minLength={8}
                        required
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={changingPassword}
                        className="inline-flex items-center justify-center gap-2 py-3.5 px-8 bg-neutral-900 text-white text-xs font-light uppercase tracking-[0.2em] hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        {changingPassword ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('changing') || 'Changing...'}
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                            </svg>
                            {t('changePassword') || 'Change Password'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Saved Addresses Section */}
              {activeSection === 'addresses' && (
                <div>
                  <div className="mb-8 pb-6 border-b border-neutral-200/50 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-extralight tracking-wide text-neutral-900 mb-2">{t('savedAddresses') || 'Saved Addresses'}</h2>
                      <p className="text-sm font-light text-neutral-500">Manage your saved shipping addresses</p>
                    </div>
                    <button
                      onClick={handleNewAddress}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-xs font-light uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all duration-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      {t('addAddress') || 'Add Address'}
                    </button>
                  </div>

                  {showAddressForm && (
                    <div className="mb-12 p-10 bg-white border border-neutral-200/50">
                      <form onSubmit={handleAddressSubmit} className="space-y-8">
                        {addressError && (
                          <div className="bg-red-50/50 border border-red-200/50 p-4">
                            <div className="flex items-center gap-2 text-sm font-light text-red-800">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {addressError}
                            </div>
                          </div>
                        )}

                        {addressSuccess && (
                          <div className="bg-green-50/50 border border-green-200/50 p-4">
                            <div className="flex items-center gap-2 text-sm font-light text-green-800">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {t('addressSaved') || 'Address saved successfully'}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                              {t('addressLabel') || 'Label'} <span className="text-neutral-400 font-normal normal-case">({t('optional') || 'Optional'})</span>
                            </label>
                            <input
                              type="text"
                              value={addressFormData.label}
                              onChange={(e) => setAddressFormData({ ...addressFormData, label: e.target.value })}
                              placeholder={t('addressLabelPlaceholder') || 'e.g., Home, Work'}
                              className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={addressFormData.is_default}
                                onChange={(e) => setAddressFormData({ ...addressFormData, is_default: e.target.checked })}
                                className="w-4 h-4 text-amber-500 border-neutral-300 focus:ring-amber-500/30 focus:ring-2 transition-all"
                              />
                              <span className="text-sm text-neutral-600 font-light group-hover:text-neutral-900 transition-colors duration-300">{t('setAsDefault') || 'Set as default address'}</span>
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                              {t('firstName') || 'First Name'} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={addressFormData.first_name}
                              onChange={(e) => setAddressFormData({ ...addressFormData, first_name: e.target.value })}
                              className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                              {t('lastName') || 'Last Name'} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={addressFormData.last_name}
                              onChange={(e) => setAddressFormData({ ...addressFormData, last_name: e.target.value })}
                              className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                            {t('company') || 'Company'} <span className="text-neutral-400 font-normal normal-case">({t('optional') || 'Optional'})</span>
                          </label>
                          <input
                            type="text"
                            value={addressFormData.company}
                            onChange={(e) => setAddressFormData({ ...addressFormData, company: e.target.value })}
                            className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                            {t('addressLine1') || 'Address Line 1'} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={addressFormData.address_line1}
                            onChange={(e) => setAddressFormData({ ...addressFormData, address_line1: e.target.value })}
                            className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                            {t('addressLine2') || 'Address Line 2'} <span className="text-neutral-400 font-normal normal-case">({t('optional') || 'Optional'})</span>
                          </label>
                          <input
                            type="text"
                            value={addressFormData.address_line2}
                            onChange={(e) => setAddressFormData({ ...addressFormData, address_line2: e.target.value })}
                            className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div>
                            <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                              {t('city') || 'City'} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={addressFormData.city}
                              onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                              className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                              {t('stateProvince') || 'State/Province'} <span className="text-neutral-400 font-normal normal-case">({t('optional') || 'Optional'})</span>
                            </label>
                            <input
                              type="text"
                              value={addressFormData.state_province}
                              onChange={(e) => setAddressFormData({ ...addressFormData, state_province: e.target.value })}
                              className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                              {t('postalCode') || 'Postal Code'} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={addressFormData.postal_code}
                              onChange={(e) => setAddressFormData({ ...addressFormData, postal_code: e.target.value })}
                              className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                              {t('country') || 'Country'} <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={addressFormData.country}
                              onChange={(e) => setAddressFormData({ ...addressFormData, country: e.target.value })}
                              className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                              required
                            >
                              <option value="SE">Sweden</option>
                              <option value="NO">Norway</option>
                              <option value="DK">Denmark</option>
                              <option value="FI">Finland</option>
                              <option value="DE">Germany</option>
                              <option value="GB">United Kingdom</option>
                              <option value="US">United States</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                              {t('phone') || 'Phone'} <span className="text-neutral-400 font-normal normal-case">({t('optional') || 'Optional'})</span>
                            </label>
                            <input
                              type="tel"
                              value={addressFormData.phone}
                              onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                              className="block w-full border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 px-5 py-3 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-8 border-t border-neutral-200/50">
                          <button
                            type="submit"
                            disabled={savingAddress}
                            className="inline-flex items-center justify-center gap-2 py-3.5 px-8 bg-neutral-900 text-white text-xs font-light uppercase tracking-[0.2em] hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                          >
                            {savingAddress ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t('saving') || 'Saving...'}
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                                </svg>
                                {editingAddress ? (t('updateAddress') || 'Update Address') : (t('saveAddress') || 'Save Address')}
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddress(null);
                              resetAddressForm();
                            }}
                            className="inline-flex items-center justify-center gap-2 py-3 px-6 border border-neutral-200/50 text-xs font-light uppercase tracking-[0.2em] text-neutral-600 bg-white/50 backdrop-blur-sm hover:bg-white hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-300"
                          >
                            {t('cancel') || 'Cancel'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {loadingAddresses ? (
                    <div className="text-center py-16">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-neutral-200 border-t-amber-500"></div>
                      <p className="mt-6 text-sm text-neutral-500 font-light">{t('loading') || 'Loading addresses...'}</p>
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-neutral-500 mb-8 font-light">{t('noAddresses') || 'No saved addresses yet.'}</p>
                      <button
                        onClick={handleNewAddress}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-xs font-light uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all duration-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                        {t('addFirstAddress') || 'Add Your First Address'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className="group relative border border-neutral-200/50 p-8 hover:border-neutral-300 transition-all duration-300 bg-white"
                        >
                          {address.is_default === 1 && (
                            <div className="absolute top-6 right-6">
                              <span className="px-3 py-1 text-[9px] font-light uppercase tracking-[0.3em] bg-neutral-900 text-white">
                                {t('default') || 'Default'}
                              </span>
                            </div>
                          )}
                          <div className="pr-20">
                            {address.label && (
                              <h3 className="font-light text-neutral-900 mb-4 text-lg tracking-wide">
                                {address.label}
                              </h3>
                            )}
                            <div className="space-y-2 text-sm text-neutral-600 font-light">
                              <p className="font-light text-neutral-900">
                                {address.first_name} {address.last_name}
                              </p>
                              {address.company && (
                                <p className="text-neutral-400">{address.company}</p>
                              )}
                              <p className="pt-2">
                                {address.address_line1}
                                {address.address_line2 && (
                                  <><br />{address.address_line2}</>
                                )}
                              </p>
                              <p>
                                {address.postal_code} {address.city}
                                {address.state_province && `, ${address.state_province}`}
                              </p>
                              <p className="font-light">{address.country}</p>
                              {address.phone && (
                                <p className="pt-2 text-neutral-400">{address.phone}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-8 pt-8 border-t border-neutral-200/50">
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-light uppercase tracking-[0.2em] text-neutral-600 bg-white/50 backdrop-blur-sm border border-neutral-200/50 hover:bg-white hover:text-neutral-900 transition-all duration-300"
                              aria-label={t('edit') || 'Edit'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              {t('edit') || 'Edit'}
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="inline-flex items-center justify-center p-2.5 text-xs font-light uppercase tracking-[0.2em] text-red-600 bg-white/50 backdrop-blur-sm border border-red-200/50 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                              aria-label={t('delete') || 'Delete'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

