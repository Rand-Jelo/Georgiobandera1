'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

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
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 py-8 border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-light tracking-tight text-neutral-900">
                {t('title') || 'Contact Us'}
              </h2>
            </div>
            <p className="text-center text-sm text-neutral-500">
              {t('subtitle') || 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.'}
            </p>
          </div>

          {/* Form */}
          <form className="px-8 py-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-red-50/50 border border-red-200/50 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm text-red-800">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green-50/50 border border-green-200/50 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('success') || 'Your message has been sent successfully! We will get back to you soon.'}
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-3 tracking-wide">
                  {t('name') || 'Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-5 py-3 border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm"
                  placeholder={t('namePlaceholder') || 'Your name'}
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-3 tracking-wide">
                  {t('email') || 'Email'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none relative block w-full px-5 py-3 border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm"
                  placeholder={t('emailPlaceholder') || 'your.email@example.com'}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 mb-3 tracking-wide">
                  {t('subject') || 'Subject'}
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  className="appearance-none relative block w-full px-5 py-3 border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm"
                  placeholder={t('subjectPlaceholder') || 'What is this regarding?'}
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-3 tracking-wide">
                  {t('message') || 'Message'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  className="appearance-none relative block w-full px-5 py-3 border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-sm resize-none"
                  placeholder={t('messagePlaceholder') || 'Your message...'}
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex items-center justify-center gap-2 py-3.5 px-6 border border-transparent text-sm font-medium rounded-full text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('sending') || 'Sending...'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {t('send') || 'Send Message'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

