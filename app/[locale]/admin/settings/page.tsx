'use client';

import * as React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import type { ShippingRegion } from '@/types/database';

// ISO 3166-1 alpha-2 country codes
const COUNTRY_CODES = [
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IS', name: 'Iceland' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ES', name: 'Spain' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'RU', name: 'Russia' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'CH', name: 'Switzerland' },
];

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
  const t = useTranslations('admin');
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
    countries: [] as string[],
    shipping_thresholds: [] as Array<{ min_order_amount: string; shipping_price: string }>,
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
        countries: regionForm.countries,
        shipping_thresholds: regionForm.shipping_thresholds
          .filter(t => t.min_order_amount && t.shipping_price !== '')
          .map(t => ({
            min_order_amount: parseFloat(t.min_order_amount),
            shipping_price: parseFloat(t.shipping_price),
          }))
          .sort((a, b) => a.min_order_amount - b.min_order_amount),
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
        countries: [],
        shipping_thresholds: [],
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
      countries: region.countries || [],
      shipping_thresholds: (region.shipping_thresholds || []).map(t => ({
        min_order_amount: t.min_order_amount.toString(),
        shipping_price: t.shipping_price.toString(),
      })),
    });
    setShowRegionForm(true);
  };

  const handleDeleteRegion = async (id: string) => {
    if (!confirm(t('confirmDeleteShippingRegion'))) {
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
          <h1 className="text-2xl sm:text-4xl font-semibold text-white mb-1 sm:mb-2">{t('settings')}</h1>
          <p className="text-sm sm:text-base text-neutral-400">{t('manageStoreSettings')}</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-white/10 overflow-x-auto">
          <div className="flex gap-2 sm:gap-4 min-w-max">
            {(['store', 'shipping', 'general'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab
                  ? 'text-white border-b-2 border-white'
                  : 'text-neutral-400 hover:text-white'
                  }`}
              >
                {tab === 'store' ? t('storeInfo') : tab === 'shipping' ? t('shippingRegions') : t('generalSettings')}
              </button>
            ))}
          </div>
        </div>

        {/* Store Information Tab */}
        {activeTab === 'store' && (
          <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">{t('storeInformation')}</h2>
            <form onSubmit={handleSaveStoreSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    {t('storeName')} *
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
                    {t('storeEmail')} *
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
                    {t('storePhone')}
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
                    {t('currency')} *
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
                    {t('taxRate')} (%)
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
                    {t('address')}
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
                    {t('city')}
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
                    {t('postalCode')}
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
                    {t('country')}
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
                  {savingStore ? t('saving') : t('saveStoreSettings')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Shipping Regions Tab */}
        {activeTab === 'shipping' && (
          <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">{t('shippingRegions')}</h2>
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
                    countries: [],
                    shipping_thresholds: [],
                  });
                  setShowRegionForm(true);
                }}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-100 font-medium transition-colors text-sm self-start sm:self-auto"
              >
                + {t('addShippingRegion')}
              </button>
            </div>

            {showRegionForm && (
              <div className="mb-6 p-4 sm:p-6 bg-black/30 border border-white/10 rounded-lg">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                  {editingRegion ? t('editShippingRegion') : t('newShippingRegion')}
                </h3>
                <form onSubmit={handleSaveRegion} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        {t('nameEn')} *
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
                        {t('nameSv')} *
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
                        {t('regionCode')} *
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
                        {t('basePrice')} (SEK) *
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
                        {t('shippingThresholds') || 'Shipping Price Thresholds'}
                      </label>
                      <p className="text-xs text-neutral-500 mb-3">
                        {t('shippingThresholdsHelpText') || 'Define shipping costs based on order total. Below the lowest threshold, the base price is used.'}
                      </p>
                      <div className="space-y-2">
                        {regionForm.shipping_thresholds.map((threshold, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="flex-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder={t('orderMinimum') || 'Order minimum (SEK)'}
                                value={threshold.min_order_amount}
                                onChange={(e) => {
                                  const updated = [...regionForm.shipping_thresholds];
                                  updated[index] = { ...updated[index], min_order_amount: e.target.value };
                                  setRegionForm({ ...regionForm, shipping_thresholds: updated });
                                }}
                                className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                              />
                            </div>
                            <span className="text-neutral-500 text-sm">→</span>
                            <div className="flex-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder={t('shippingCost') || 'Shipping cost (SEK)'}
                                value={threshold.shipping_price}
                                onChange={(e) => {
                                  const updated = [...regionForm.shipping_thresholds];
                                  updated[index] = { ...updated[index], shipping_price: e.target.value };
                                  setRegionForm({ ...regionForm, shipping_thresholds: updated });
                                }}
                                className="w-full px-3 py-2 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setRegionForm({
                                  ...regionForm,
                                  shipping_thresholds: regionForm.shipping_thresholds.filter((_, i) => i !== index),
                                });
                              }}
                              className="px-2 py-2 text-red-400 hover:text-red-300 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRegionForm({
                            ...regionForm,
                            shipping_thresholds: [
                              ...regionForm.shipping_thresholds,
                              { min_order_amount: '', shipping_price: '' },
                            ],
                          });
                        }}
                        className="mt-2 px-3 py-1.5 text-xs text-neutral-300 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        + {t('addThreshold') || 'Add Threshold'}
                      </button>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={regionForm.active}
                          onChange={(e) => setRegionForm({ ...regionForm, active: e.target.checked })}
                          className="w-5 h-5 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30"
                        />
                        <span className="text-sm text-neutral-300">{t('active')}</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      {t('countriesIso')} *
                      <span className="text-xs text-neutral-500 ml-2 block sm:inline">
                        {t('selectCountriesHint')}
                      </span>
                    </label>
                    <div className="border border-white/20 bg-black/50 rounded-lg p-3 max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {COUNTRY_CODES.map((country) => (
                          <label
                            key={country.code}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-white/5 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={regionForm.countries.includes(country.code)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRegionForm({
                                    ...regionForm,
                                    countries: [...regionForm.countries, country.code],
                                  });
                                } else {
                                  setRegionForm({
                                    ...regionForm,
                                    countries: regionForm.countries.filter((c) => c !== country.code),
                                  });
                                }
                              }}
                              className="w-4 h-4 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30"
                            />
                            <span className="text-xs sm:text-sm text-neutral-300">
                              {country.code} - {country.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {regionForm.countries.length > 0 && (
                      <p className="mt-2 text-xs text-neutral-400">
                        {t('selected')}: {regionForm.countries.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRegionForm(false);
                        setEditingRegion(null);
                      }}
                      className="px-4 py-2 text-neutral-300 hover:text-white transition-colors"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-100 font-medium transition-colors"
                    >
                      {editingRegion ? t('updateRegion') : t('createRegion')}
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
              <div className="text-center py-8 text-neutral-400 text-sm">
                {t('noShippingRegionsFound')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-black/70">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        {t('name')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        {t('code')}
                      </th>
                      <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        {t('countries')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        {t('basePrice')}
                      </th>
                      <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        {t('freeShipping')}
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
                    {shippingRegions.map((region) => (
                      <tr key={region.id} className="hover:bg-black/30 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{region.name_en}</div>
                          <div className="text-xs text-neutral-400">{region.name_sv}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-300">{region.code}</div>
                        </td>
                        <td className="hidden md:table-cell px-4 sm:px-6 py-4">
                          <div className="text-sm text-neutral-300">
                            {region.countries && region.countries.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {region.countries.slice(0, 5).map((country) => (
                                  <span
                                    key={country}
                                    className="px-2 py-1 bg-white/10 rounded text-xs"
                                  >
                                    {country}
                                  </span>
                                ))}
                                {region.countries.length > 5 && (
                                  <span className="px-2 py-1 bg-white/10 rounded text-xs">
                                    +{region.countries.length - 5} {t('more')}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-neutral-500 italic">{t('allOtherCountries')}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{region.base_price} SEK</div>
                        </td>
                        <td className="hidden sm:table-cell px-4 sm:px-6 py-4">
                          <div className="text-sm text-neutral-300">
                            {region.shipping_thresholds && region.shipping_thresholds.length > 0 ? (
                              <div className="space-y-1">
                                {[...region.shipping_thresholds]
                                  .sort((a, b) => a.min_order_amount - b.min_order_amount)
                                  .map((t, i) => (
                                    <div key={i} className="text-xs">
                                      <span className="text-neutral-400">≥ {t.min_order_amount} SEK</span>{' → '}
                                      <span className="text-white">{t.shipping_price === 0 ? 'Free' : `${t.shipping_price} SEK`}</span>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              region.free_shipping_threshold ? `${region.free_shipping_threshold} SEK` : '-'
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${region.active
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                              }`}
                          >
                            {region.active ? t('active') : t('inactive')}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditRegion(region)}
                            className="text-white hover:text-neutral-300 mr-2 sm:mr-4"
                          >
                            {t('edit')}
                          </button>
                          <button
                            onClick={() => handleDeleteRegion(region.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            {t('delete')}
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
          <div className="bg-black/50 border border-white/10 rounded-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">{t('generalSettings')}</h2>
            <form onSubmit={handleSaveGeneralSettings} className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generalSettings.maintenance_mode}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, maintenance_mode: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-white">{t('maintenanceMode')}</span>
                    <p className="text-xs text-neutral-400">{t('maintenanceModeHint')}</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generalSettings.allow_registrations}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, allow_registrations: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-black/50 text-white focus:ring-2 focus:ring-white/30 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-white">{t('allowUserRegistrations')}</span>
                    <p className="text-xs text-neutral-400">{t('allowUserRegistrationsHint')}</p>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    {t('defaultLanguage')} *
                  </label>
                  <select
                    value={generalSettings.default_language}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, default_language: e.target.value })}
                    className="w-full px-4 py-3 border border-white/20 bg-black/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    <option value="en">{t('english')}</option>
                    <option value="sv">{t('swedish')}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingGeneral}
                  className="px-6 py-3 bg-white text-black rounded-lg hover:bg-neutral-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {savingGeneral ? t('saving') : t('saveGeneralSettings')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div >
  );
}

