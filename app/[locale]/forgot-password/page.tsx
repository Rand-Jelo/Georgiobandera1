'use client';

import * as React from 'react';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json() as { error?: string; message?: string };

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || t('resetLinkSent'));
      } else {
        setStatus('error');
        setMessage(data.error || t('errorOccurred'));
      }
    } catch {
      setStatus('error');
      setMessage(t('errorOccurred'));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Dark Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-950 via-black to-neutral-950 text-white">
        {/* Elegant background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,_transparent,_transparent_2px,_rgba(255,255,255,0.02)_2px,_rgba(255,255,255,0.02)_4px)]" />
        </div>

        {/* Subtle gold accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            {/* Subtitle */}
            <div className="inline-block">
              <p className="text-[10px] font-light uppercase tracking-[0.4em] text-amber-400/80">
                {t('passwordReset')}
              </p>
              <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent mx-auto" />
            </div>

            {/* Main heading */}
            <h1 className="text-4xl font-extralight tracking-wide sm:text-5xl lg:text-6xl">
              {t('forgotPasswordTitle')}
            </h1>

            {/* Description */}
            <p className="text-sm font-light tracking-wide text-neutral-400 sm:text-base">
              {t('forgotPasswordDescription')}{' '}
              <Link href="/login" className="text-amber-400 hover:text-amber-300 transition-colors hover:gold-glow">
                {t('backToLogin')}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto">
          {/* Card Container */}
          <div className="bg-white border border-neutral-200/50 overflow-hidden">
            {status === 'success' ? (
              <div className="px-8 py-10 space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-50 border border-green-200/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-neutral-700 mb-6 text-sm font-light">{message}</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-light text-amber-600 hover:text-amber-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {t('backToLogin')}
                  </Link>
                </div>
              </div>
            ) : (
              <form className="px-8 py-10 space-y-6" onSubmit={handleSubmit}>
                {status === 'error' && (
                  <div className="bg-red-50/50 border border-red-200/50 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-sm text-red-800">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {message}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-xs font-light uppercase tracking-wider text-neutral-700 mb-3">
                    {t('email')}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none relative block w-full px-5 py-3.5 border border-neutral-200/50 bg-white/80 backdrop-blur-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all text-sm font-light"
                    placeholder={t('email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="mt-2 text-xs font-light text-neutral-500">
                    {t('forgotPasswordHint')}
                  </p>
                </div>

                <div className="pt-6 border-t border-neutral-200/50">
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="group relative w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent text-sm font-light uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {status === 'loading' ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('sending')}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {t('sendResetLink')}
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-neutral-500 text-xs font-light">
                  {t('rememberPassword')}{' '}
                  <Link href="/login" className="text-amber-600 hover:text-amber-500 transition-colors">
                    {t('login')}
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

