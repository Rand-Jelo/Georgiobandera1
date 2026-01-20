'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';

export default function VerifyEmailRequiredPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    checkAuth();
    
    // Check periodically if email has been verified
    const interval = setInterval(() => {
      checkAuth();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json() as { user?: { email?: string; email_verified?: boolean } };
        if (data.user) {
          // If already verified, redirect to profile
          if (data.user.email_verified) {
            router.push('/profile');
            return;
          }
          setEmail(data.user.email || null);
        } else {
          // Not logged in, redirect to login
          router.push('/login');
          return;
        }
      } else {
        // Not logged in, redirect to login
        router.push('/login');
        return;
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      router.push('/login');
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    
    setResending(true);
    setResendError('');
    setResendSuccess(false);

    try {
      const locale = window.location.pathname.split('/')[1] || 'sv';
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, locale }),
      });

      const data = await response.json() as { success?: boolean; error?: string; message?: string };

      if (response.ok && data.success) {
        setResendSuccess(true);
      } else {
        setResendError(data.error || t('errorOccurred'));
      }
    } catch (err) {
      setResendError(t('errorOccurred'));
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-neutral-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-sm text-neutral-500">{t('pleaseWait')}</p>
        </div>
      </div>
    );
  }

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
              {t('verificationRequired') || 'Email Verification Required'}
            </h1>

            {/* Description */}
            <p className="text-sm font-light tracking-wide text-neutral-400 sm:text-base">
              {t('verificationRequiredDescription') || 'Please verify your email address to continue.'}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white border border-neutral-200/50 overflow-hidden">
            <div className="px-8 py-10 space-y-6">
              {/* Info Box */}
              <div className="bg-amber-50/50 border border-amber-200/50 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-amber-900 mb-2">
                      {t('verificationRequiredTitle') || 'Check Your Email'}
                    </h3>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      {t('verificationRequiredMessage') || 'We\'ve sent a verification link to your email address. Please check your inbox and click the link to verify your account.'}
                    </p>
                    {email && (
                      <p className="text-sm font-medium text-amber-900 mt-3">
                        {t('sentTo') || 'Sent to:'} <span className="font-normal">{email}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Resend Section */}
              <div className="space-y-4">
                <p className="text-sm text-neutral-600">
                  {t('didntReceiveEmail') || 'Didn\'t receive the email?'}
                </p>

                {resendSuccess && (
                  <div className="bg-green-50/50 border border-green-200/50 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-sm text-green-800">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('verificationEmailResent') || 'Verification email has been resent. Please check your inbox.'}
                    </div>
                  </div>
                )}

                {resendError && (
                  <div className="bg-red-50/50 border border-red-200/50 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-sm text-red-800">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {resendError}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleResendVerification}
                  disabled={resending || !email}
                  className="w-full py-3 px-6 border border-neutral-200/50 bg-white/80 backdrop-blur-sm text-neutral-900 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-light uppercase tracking-wider"
                >
                  {resending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('sending') || 'Sending...'}
                    </span>
                  ) : (
                    t('resendVerificationEmail') || 'Resend Verification Email'
                  )}
                </button>
              </div>

              {/* Help Text */}
              <div className="pt-6 border-t border-neutral-200/50">
                <p className="text-xs text-neutral-500 text-center leading-relaxed">
                  {t('verificationHelpText') || 'Make sure to check your spam folder if you don\'t see the email. The verification link will expire in 24 hours.'}
                </p>
              </div>

              {/* Logout Option */}
              <div className="pt-4 text-center">
                <Link
                  href="/login"
                  className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                  }}
                >
                  {t('logout') || 'Logout'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

