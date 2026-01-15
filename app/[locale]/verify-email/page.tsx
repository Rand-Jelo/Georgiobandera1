'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('auth');
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('noVerificationToken'));
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json() as { error?: string; message?: string };

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || t('emailVerifiedSuccess'));
          
          // Redirect to account page after 3 seconds
          setTimeout(() => {
            router.push('/account');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || t('verificationFailed'));
        }
      } catch {
        setStatus('error');
        setMessage(t('errorOccurred'));
      }
    };

    verifyEmail();
  }, [token, t, router]);

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
                {t('emailVerification')}
              </p>
              <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent mx-auto" />
            </div>

            {/* Main heading */}
            <h1 className="text-4xl font-extralight tracking-wide sm:text-5xl lg:text-6xl">
              {status === 'loading' && t('verifyingEmail')}
              {status === 'success' && t('emailVerified')}
              {status === 'error' && t('verificationFailedTitle')}
            </h1>

            {/* Description */}
            {status === 'loading' && (
              <p className="text-sm font-light tracking-wide text-neutral-400 sm:text-base">
                {t('verifyingEmailDescription')}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto">
          {/* Card Container */}
          <div className="bg-white border border-neutral-200/50 overflow-hidden">
            <div className="px-8 py-10 text-center">
              {status === 'loading' && (
                <>
                  <div className="w-16 h-16 border-4 border-neutral-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-6" />
                  <p className="text-neutral-600 text-sm font-light">{t('pleaseWait')}</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="w-16 h-16 bg-green-50 border border-green-200/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-neutral-700 mb-4 text-sm font-light">{message}</p>
                  <p className="text-xs text-neutral-500 font-light">
                    {t('redirectingToAccount')}
                  </p>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="w-16 h-16 bg-red-50 border border-red-200/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-neutral-700 mb-6 text-sm font-light">{message}</p>
                  <div className="space-y-3">
                    <Link
                      href="/account"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 border border-neutral-900 text-neutral-900 text-sm font-light uppercase tracking-wider hover:bg-neutral-900 hover:text-white transition-all"
                    >
                      {t('goToAccount')}
                    </Link>
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 border border-neutral-200 text-neutral-700 text-sm font-light uppercase tracking-wider hover:bg-neutral-50 transition-all"
                    >
                      {t('backToHome')}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
