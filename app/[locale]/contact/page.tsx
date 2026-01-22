'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { StoreSettings } from '@/lib/db/queries/settings';

export default function ContactPage() {
  const t = useTranslations('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loadingStore, setLoadingStore] = useState(true);

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  const fetchStoreSettings = async () => {
    try {
      const response = await fetch('/api/settings/store');
      if (response.ok) {
        const data = await response.json() as { settings?: StoreSettings };
        setStoreSettings(data.settings || null);
      }
    } catch (error) {
      console.error('Error fetching store settings:', error);
    } finally {
      setLoadingStore(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json() as { error?: string; success?: boolean; message?: string; details?: any };

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((detail: any) => detail.message).join(', ');
          setError(errorMessages || data.error || 'Failed to send message');
        } else {
          setError(data.error || 'Failed to send message');
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(t('errorOccurred') || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = () => {
    if (!storeSettings) return null;
    const parts = [];
    if (storeSettings.store_address) parts.push(storeSettings.store_address);
    if (storeSettings.store_postal_code && storeSettings.store_city) {
      parts.push(`${storeSettings.store_postal_code} ${storeSettings.store_city}`);
    } else if (storeSettings.store_city) {
      parts.push(storeSettings.store_city);
    } else if (storeSettings.store_postal_code) {
      parts.push(storeSettings.store_postal_code);
    }
    if (storeSettings.store_country) parts.push(storeSettings.store_country);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Matching Homepage */}
      <section className="relative bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white py-20 lg:py-24 overflow-hidden">
        {/* Elegant background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,_transparent,_transparent_2px,_rgba(255,255,255,0.02)_2px,_rgba(255,255,255,0.02)_4px)]" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <div className="relative max-w-[1600px] mx-auto px-6">
          <div className="max-w-4xl">
            {/* Elegant subtitle */}
            <div className="inline-block mb-6">
              <p className="text-[10px] font-light uppercase tracking-[0.4em] text-amber-400/80">
                {t('subtitleLabel') || 'Get in Touch'}
              </p>
              <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent" />
            </div>
            
            {/* Main heading */}
            <h1 className="text-5xl font-extralight tracking-[0.02em] leading-[1.1] mb-4 sm:text-6xl lg:text-7xl">
              {t('title') || 'Contact Us'}
            </h1>
            
            {/* Description */}
            <p className="max-w-2xl text-base leading-relaxed text-neutral-300 sm:text-lg lg:text-xl">
              {t('subtitle') || 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Contact Form */}
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-light tracking-wide text-neutral-900 mb-2">
                {t('sendMessageTitle')}
              </h2>
              <p className="text-sm text-neutral-500 font-light">
                {t('sendMessageDescription')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50/50 border border-red-200/50 rounded-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm text-red-800">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50/50 border border-green-200/50 rounded-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('success') || 'Your message has been sent successfully! We will get back to you soon.'}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-light text-neutral-700 mb-2 tracking-wide">
                  {t('name') || 'Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 rounded-sm focus:outline-none focus:border-neutral-900 transition-all text-sm font-light"
                  placeholder={t('namePlaceholder') || 'Your name'}
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-light text-neutral-700 mb-2 tracking-wide">
                  {t('email') || 'Email'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 rounded-sm focus:outline-none focus:border-neutral-900 transition-all text-sm font-light"
                  placeholder={t('emailPlaceholder') || 'your.email@example.com'}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-light text-neutral-700 mb-2 tracking-wide">
                  {t('subject') || 'Subject'}
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  className="w-full px-4 py-3 border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 rounded-sm focus:outline-none focus:border-neutral-900 transition-all text-sm font-light"
                  placeholder={t('subjectPlaceholder') || 'What is this regarding?'}
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-light text-neutral-700 mb-2 tracking-wide">
                  {t('message') || 'Message'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 rounded-sm focus:outline-none focus:border-neutral-900 transition-all text-sm font-light resize-none"
                  placeholder={t('messagePlaceholder') || 'Your message...'}
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative overflow-hidden rounded-sm bg-neutral-900 px-8 py-3.5 text-sm font-medium tracking-wider text-white transition-all duration-300 hover:bg-neutral-800 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('sending') || 'Sending...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      {t('send') || 'Send Message'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Store Information */}
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-light tracking-wide text-neutral-900 mb-2">
                {t('storeInformationTitle')}
              </h2>
              <p className="text-sm text-neutral-500 font-light">
                {t('storeInformationDescription')}
              </p>
            </div>

            {loadingStore ? (
              <div className="flex items-center gap-2 text-neutral-400">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">{t('loading') || 'Loading...'}</span>
              </div>
            ) : storeSettings ? (
              <div className="space-y-6">
                {/* Store Name */}
                {storeSettings.store_name && (
                  <div>
                    <p className="text-xs font-light uppercase tracking-[0.2em] text-neutral-500 mb-2">
                      {t('storeName')}
                    </p>
                    <p className="text-base font-light text-neutral-900">
                      {storeSettings.store_name}
                    </p>
                  </div>
                )}

                {/* Address */}
                {formatAddress() && (
                  <div>
                    <p className="text-xs font-light uppercase tracking-[0.2em] text-neutral-500 mb-2">
                      {t('address')}
                    </p>
                    <p className="text-base font-light text-neutral-900 leading-relaxed">
                      {formatAddress()}
                    </p>
                  </div>
                )}

                {/* Phone */}
                {storeSettings.store_phone && (
                  <div>
                    <p className="text-xs font-light uppercase tracking-[0.2em] text-neutral-500 mb-2">
                      {t('phone')}
                    </p>
                    <a
                      href={`tel:${storeSettings.store_phone}`}
                      className="text-base font-light text-neutral-900 hover:text-amber-600 transition-colors duration-300"
                    >
                      {storeSettings.store_phone}
                    </a>
                  </div>
                )}

                {/* Email */}
                {storeSettings.store_email && (
                  <div>
                    <p className="text-xs font-light uppercase tracking-[0.2em] text-neutral-500 mb-2">
                      {t('email')}
                    </p>
                    <a
                      href={`mailto:${storeSettings.store_email}`}
                      className="text-base font-light text-neutral-900 hover:text-amber-600 transition-colors duration-300"
                    >
                      {storeSettings.store_email}
                    </a>
                  </div>
                )}

                {/* Divider */}
                {(formatAddress() || storeSettings.store_phone || storeSettings.store_email) && (
                  <div className="pt-6 border-t border-neutral-200">
                    <p className="text-xs font-light text-neutral-400 leading-relaxed">
                      {t('helpText')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-neutral-400 font-light">
                {t('storeInformationNotConfigured')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
