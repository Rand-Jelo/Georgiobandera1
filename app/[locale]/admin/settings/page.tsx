'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link } from '@/lib/i18n/routing';
import type { ShippingRegion } from '@/types/database';

interface StoreSettings {
  store_name: string;
  store_email: string;
  store_phone: string | null;
  store_address: string | null;
  store_city: string | null;
  store_postal_code: string | null;
  store_country: string | null;
  currency: string;
  tax_rate: number;
}

interface GeneralSettings {
  maintenance_mode: boolean;
  allow_registrations: boolean;
  default_language: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'store' | 'shipping' | 'general'>('store');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Store settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    store_name: '',
    store_email: '',
    store_phone: null,
    store_address: null,
    store_city: null,
    store_postal_code: null,
    store_country: null,
    currency: 'SEK',
    tax_rate: 0,
  });
  const [savingStore, setSavingStore] = useState(false);

  // General settings
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    maintenance_mode: false,
    allow_registrations: true,
    default_language: 'en',
  });
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Shipping regions
  const [shippingRegions, setShippingRegions] = useState<ShippingRegion[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [editingRegion, setEditingRegion] = useState<ShippingRegion | null>(null);
  const [showRegionForm, setShowRegionForm] = useState(false);
  const [regionForm, setRegionForm] = useState({
    name_en: '',
    name_sv: '',
    code: '',
    base_price: '',
    free_shipping_threshold: '',
    active: true,
  });

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
      await Promise.all([fetchStoreSettings(), fetchGeneralSettings(), fetchShippingRegions()]);
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/store');
      if (response.ok) {
        const data = await response.json() as { settings?: StoreSettings };
        if (data.settings) {
          setStoreSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching store settings:', error);
    }
  };

  const fetchGeneralSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/general');
      if (response.ok) {
        const data = await response.json() as { settings?: GeneralSettings };
        if (data.settings) {
          setGeneralSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching general settings:', error);
    }
  };

  const fetchShippingRegions = async () => {
    try {
      setLoadingRegions(true);
      const response = await fetch('/api/admin/shipping-regions');
      if (response.ok) {
        const data = await response.json() as { regions?: ShippingRegion[] };
        setShippingRegions(data.regions || []);
      }
    } catch (error) {
      console.error('Error fetching shipping regions:', error);
    } finally {
      setLoadingRegions(false);
    }
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStore(true);
    try {
      const response = await fetch('/api/admin/settings/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeSettings),
      });

      if (!response.ok) {
        alert('Failed to save store settings');
        return;
      }

      alert('Store settings saved successfully!');
    } catch (error) {
      console.error('Error saving store settings:', error);
      alert('An error occurred while saving store settings.');
    } finally {
      setSavingStore(false);
    }
  };

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      const response = await fetch('/api/admin/settings/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generalSettings),
      });

      if (!response.ok) {
        alert('Failed to save general settings');
        return;
      }

      alert('General settings saved successfully!');
    } catch (error) {
      console.error('Error saving general settings:', error);
      alert('An error occurred while saving general settings.');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const regionData = {
        name_en: regionForm.name_en,
        name_sv: regionForm.name_sv,
        code: regionForm.code,
        base_price: parseFloat(regionForm.base_price),
        free_shipping_threshold: regionForm.free_shipping_threshold ? parseFloat(regionForm.free_shipping_threshold) : null,
        active: regionForm.active,
      };

      let response;
      if (editingRegion) {
        response = await fetch(`/api/admin/shipping-regions/${editingRegion.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(regionData),
        });
      } else {
        response = await fetch('/api/admin/shipping-regions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(regionData),
        });
      }

      if (!response.ok) {
        alert('Failed to save shipping region');
        return;
      }

      await fetchShippingRegions();
      setShowRegionForm(false);
      setEditingRegion(null);
      setRegionForm({
        name_en: '',
        name_sv: '',
        code: '',
        base_price: '',
        free_shipping_threshold: '',
        active: true,
      });
    } catch (error) {
      console.error('Error saving shipping region:', error);
      alert('An error occurred while saving the shipping region.');
    }
  };

  const handleEditRegion = (region: ShippingRegion) => {
    setEditingRegion(region);
    setRegionForm({
      name_en: region.name_en,
      name_sv: region.name_sv,
      code: region.code,
      base_price: region.base_price.toString(),
      free_shipping_threshold: region.free_shipping_threshold?.toString() || '',
      active: region.active,
    });
    setShowRegionForm(true);
  };

  const handleDeleteRegion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shipping region?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/shipping-regions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert('Failed to delete shipping region');
        return;
      }

      await fetchShippingRegions();
    } catch (error) {
      console.error('Error deleting shipping region:', error);
      alert('An error occurred while deleting the shipping region.');
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
          <h1 className="text-4xl font-semibold text-white mb-2">Settings</h1>
          <p className="text-neutral-400">Manage store settings and configuration</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-white/10">
          <div className="flex gap-4">
            {(['store', 'shipping', 'general'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab === 'store' ? 'Store Information' : tab === 'shipping' ? 'Shipping Regions' : 'General Settings'}
              </button>
            ))}
          </div>
        </div>

        {/* Store Information Tab */}
        {activeTab === 'store' && (
          <div className="bg-black/50 border border-white/10 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Store Information</h2>
            <form onSubmit={handleSaveStoreSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeSettings.store_name}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_name: e.target.value })}
                    className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Store Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={storeSettings.store_email}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_email: e.target.value })}
                    className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Store Phone
                  </label>
                  <input
                    type="tel"
                    value={storeSettings.store_phone || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_phone: e.target.value || null })}
                    className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Currency *
                  </label>
                  <select
                    value={storeSettings.currency}
                    onChange={(e) => setStoreSettings({ ...storeSettings, currency: e.target.value })}
                    className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    <option value="SEK">SEK (Swedish Krona)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={storeSettings.tax_rate}
                    onChange={(e) => setStoreSettings({ ...storeSettings, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={storeSettings.store_address || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_address: e.target.value || null })}
                    className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={storeSettings.store_city || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_city: e.target.value || null })}
                    className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={storeSettings.store_postal_code || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_postal_code: e.target.value || null })}
                    className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={storeSettings.store_country || ''}
                    onChange={(e) => setStoreSettings({ ...storeSettings, store_country: e.target.value || null })}
                    className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingStore}
                  className="px-6 py-3 bg-white text-black rounded-lg hover:bg-neutral-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {savingStore ? 'Saving...' : 'Save Store Settings'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Shipping Regions Tab */}
        {activeTab === 'shipping' && (
          <div className="bg-black/50 border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Shipping Regions</h2>
              <button
                onClick={() => {
                  setEditingRegion(null);
                  setRegionForm({
                    name_en: '',
                    name_sv: '',
                    code: '',
                    base_price: '',
                    free_shipping_threshold: '',
                    active: true,
                  });
                  setShowRegionForm(true);
                }}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-100 font-medium transition-colors"
              >
                + Add Shipping Region
              </button>
            </div>

            {showRegionForm && (
              <div className="mb-6 p-6 bg-black/30 border border-white/10 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {editingRegion ? 'Edit Shipping Region' : 'New Shipping Region'}
                </h3>
                <form onSubmit={handleSaveRegion} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Name (English) *
                      </label>
                      <input
                        type="text"
                        required
                        value={regionForm.name_en}
                        onChange={(e) => setRegionForm({ ...regionForm, name_en: e.target.value })}
                        className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Name (Swedish) *
                      </label>
                      <input
                        type="text"
                        required
                        value={regionForm.name_sv}
                        onChange={(e) => setRegionForm({ ...regionForm, name_sv: e.target.value })}
                        className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Code (e.g., SE, EU, WORLD) *
                      </label>
                      <input
                        type="text"
                        required
                        value={regionForm.code}
                        onChange={(e) => setRegionForm({ ...regionForm, code: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Base Price (SEK) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={regionForm.base_price}
                        onChange={(e) => setRegionForm({ ...regionForm, base_price: e.target.value })}
                        className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Free Shipping Threshold (SEK)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={regionForm.free_shipping_threshold}
                        onChange={(e) => setRegionForm({ ...regionForm, free_shipping_threshold: e.target.value })}
                        className="w-full px-4 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="Leave empty for no free shipping"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={regionForm.active}
                          onChange={(e) => setRegionForm({ ...regionForm, active: e.target.checked })}
                          className="w-5 h-5 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30"
                        />
                        <span className="text-sm text-neutral-300">Active</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRegionForm(false);
                        setEditingRegion(null);
                      }}
                      className="px-4 py-2 text-neutral-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-100 font-medium transition-colors"
                    >
                      {editingRegion ? 'Update' : 'Create'} Region
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingRegions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30 mx-auto"></div>
              </div>
            ) : shippingRegions.length === 0 ? (
              <div className="text-center py-8 text-neutral-400">
                No shipping regions found. Click "Add Shipping Region" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-black/70">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        Base Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        Free Shipping
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {shippingRegions.map((region) => (
                      <tr key={region.id} className="hover:bg-black/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{region.name_en}</div>
                          <div className="text-xs text-neutral-400">{region.name_sv}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-300">{region.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{region.base_price} SEK</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-300">
                            {region.free_shipping_threshold ? `${region.free_shipping_threshold} SEK` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              region.active
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                            }`}
                          >
                            {region.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditRegion(region)}
                            className="text-white hover:text-neutral-300 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRegion(region.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="bg-black/50 border border-white/10 rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">General Settings</h2>
            <form onSubmit={handleSaveGeneralSettings} className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generalSettings.maintenance_mode}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, maintenance_mode: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30"
                  />
                  <div>
                    <span className="text-sm font-medium text-white">Maintenance Mode</span>
                    <p className="text-xs text-neutral-400">Enable to put the store in maintenance mode</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generalSettings.allow_registrations}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, allow_registrations: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30"
                  />
                  <div>
                    <span className="text-sm font-medium text-white">Allow User Registrations</span>
                    <p className="text-xs text-neutral-400">Allow new users to register accounts</p>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Default Language *
                  </label>
                  <select
                    value={generalSettings.default_language}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, default_language: e.target.value })}
                    className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    <option value="en">English</option>
                    <option value="sv">Swedish</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingGeneral}
                  className="px-6 py-3 bg-white text-black rounded-lg hover:bg-neutral-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {savingGeneral ? 'Saving...' : 'Save General Settings'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

