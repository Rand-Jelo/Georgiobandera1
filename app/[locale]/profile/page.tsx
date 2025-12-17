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
      const data = await response.json() as { user?: User };
      if (data.user) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-semibold text-neutral-900">{t('title')}</h1>
          {user.is_admin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin Panel
            </Link>
          )}
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm">
          <div className="px-6 py-5 border-b border-neutral-200">
            <h2 className="text-lg font-medium text-neutral-900">{t('personalInfo')}</h2>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 border border-green-200 p-4">
                <div className="text-sm text-green-800">{t('updated')}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={user.email}
                disabled
                className="block w-full rounded-lg border border-neutral-300 bg-neutral-50 text-neutral-500 px-4 py-2 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="submit"
                disabled={updating}
                className="inline-flex justify-center py-2 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? t('updating') : t('updateProfile')}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex justify-center py-2 px-6 border border-neutral-300 text-sm font-medium rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors"
              >
                {tCommon('logout')}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="mt-8 bg-white border border-neutral-200 rounded-lg shadow-sm">
          <div className="px-6 py-5 border-b border-neutral-200">
            <h2 className="text-lg font-medium text-neutral-900">{t('changePassword') || 'Change Password'}</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="px-6 py-5 space-y-6">
            {passwordError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <div className="text-sm text-red-800">{passwordError}</div>
              </div>
            )}

            {passwordSuccess && (
              <div className="rounded-md bg-green-50 border border-green-200 p-4">
                <div className="text-sm text-green-800">{t('passwordChanged') || 'Password changed successfully'}</div>
              </div>
            )}

            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('currentPassword') || 'Current Password'}
              </label>
              <input
                type="password"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('newPassword') || 'New Password'}
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                minLength={8}
                required
              />
              <p className="mt-1 text-xs text-neutral-500">{t('passwordMinLength') || 'Password must be at least 8 characters'}</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('confirmPassword') || 'Confirm New Password'}
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex justify-center py-2 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {changingPassword ? (t('changing') || 'Changing...') : (t('changePassword') || 'Change Password')}
            </button>
          </form>
        </div>

        {/* Saved Addresses Section */}
        <div className="mt-8 bg-white border border-neutral-200 rounded-lg shadow-sm">
          <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-neutral-900">{t('savedAddresses') || 'Saved Addresses'}</h2>
            <button
              onClick={handleNewAddress}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('addAddress') || 'Add Address'}
            </button>
          </div>

          {showAddressForm && (
            <div className="px-6 py-5 border-b border-neutral-200 bg-neutral-50">
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                {addressError && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-4">
                    <div className="text-sm text-red-800">{addressError}</div>
                  </div>
                )}

                {addressSuccess && (
                  <div className="rounded-md bg-green-50 border border-green-200 p-4">
                    <div className="text-sm text-green-800">{t('addressSaved') || 'Address saved successfully'}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('addressLabel') || 'Label'} ({t('optional') || 'Optional'})
                    </label>
                    <input
                      type="text"
                      value={addressFormData.label}
                      onChange={(e) => setAddressFormData({ ...addressFormData, label: e.target.value })}
                      placeholder={t('addressLabelPlaceholder') || 'e.g., Home, Work'}
                      className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addressFormData.is_default}
                        onChange={(e) => setAddressFormData({ ...addressFormData, is_default: e.target.checked })}
                        className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900"
                      />
                      <span className="text-sm text-neutral-700">{t('setAsDefault') || 'Set as default address'}</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('firstName') || 'First Name'} *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.first_name}
                      onChange={(e) => setAddressFormData({ ...addressFormData, first_name: e.target.value })}
                      className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('lastName') || 'Last Name'} *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.last_name}
                      onChange={(e) => setAddressFormData({ ...addressFormData, last_name: e.target.value })}
                      className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('company') || 'Company'} ({t('optional') || 'Optional'})
                  </label>
                  <input
                    type="text"
                    value={addressFormData.company}
                    onChange={(e) => setAddressFormData({ ...addressFormData, company: e.target.value })}
                    className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('addressLine1') || 'Address Line 1'} *
                  </label>
                  <input
                    type="text"
                    value={addressFormData.address_line1}
                    onChange={(e) => setAddressFormData({ ...addressFormData, address_line1: e.target.value })}
                    className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('addressLine2') || 'Address Line 2'} ({t('optional') || 'Optional'})
                  </label>
                  <input
                    type="text"
                    value={addressFormData.address_line2}
                    onChange={(e) => setAddressFormData({ ...addressFormData, address_line2: e.target.value })}
                    className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('city') || 'City'} *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.city}
                      onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                      className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('stateProvince') || 'State/Province'} ({t('optional') || 'Optional'})
                    </label>
                    <input
                      type="text"
                      value={addressFormData.state_province}
                      onChange={(e) => setAddressFormData({ ...addressFormData, state_province: e.target.value })}
                      className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('postalCode') || 'Postal Code'} *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.postal_code}
                      onChange={(e) => setAddressFormData({ ...addressFormData, postal_code: e.target.value })}
                      className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('country') || 'Country'} *
                    </label>
                    <select
                      value={addressFormData.country}
                      onChange={(e) => setAddressFormData({ ...addressFormData, country: e.target.value })}
                      className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
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
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {t('phone') || 'Phone'} ({t('optional') || 'Optional'})
                    </label>
                    <input
                      type="tel"
                      value={addressFormData.phone}
                      onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                      className="block w-full rounded-lg border border-neutral-300 bg-white text-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="inline-flex justify-center py-2 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingAddress ? (t('saving') || 'Saving...') : (editingAddress ? (t('updateAddress') || 'Update Address') : (t('saveAddress') || 'Save Address'))}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                      resetAddressForm();
                    }}
                    className="inline-flex justify-center py-2 px-6 border border-neutral-300 text-sm font-medium rounded-lg text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors"
                  >
                    {t('cancel') || 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="px-6 py-5">
            {loadingAddresses ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
                <p className="mt-4 text-sm text-neutral-600">{t('loading') || 'Loading addresses...'}</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-600 mb-4">{t('noAddresses') || 'No saved addresses yet.'}</p>
                <button
                  onClick={handleNewAddress}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('addFirstAddress') || 'Add Your First Address'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-neutral-900">
                            {address.label || `${address.first_name} ${address.last_name}`}
                          </h3>
                          {address.is_default === 1 && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-neutral-900 text-white rounded">
                              {t('default') || 'Default'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600">
                          {address.first_name} {address.last_name}
                          {address.company && `, ${address.company}`}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {address.address_line1}
                          {address.address_line2 && `, ${address.address_line2}`}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {address.postal_code} {address.city}
                          {address.state_province && `, ${address.state_province}`}
                        </p>
                        <p className="text-sm text-neutral-600">{address.country}</p>
                        {address.phone && (
                          <p className="text-sm text-neutral-600 mt-1">{address.phone}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                          aria-label={t('edit') || 'Edit'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label={t('delete') || 'Delete'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 text-neutral-900 hover:text-neutral-600 font-medium transition-colors"
            >
              {tCommon('orders')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          <div>
            <Link
              href="/wishlist"
              className="inline-flex items-center gap-2 text-neutral-900 hover:text-neutral-600 font-medium transition-colors"
            >
              {tCommon('wishlist')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

