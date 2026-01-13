'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const isSwedish = locale === 'sv';

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(isSwedish ? 'Ingen verifieringstoken hittades' : 'No verification token found');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, locale }),
        });

        const data = await response.json() as { error?: string };

        if (response.ok) {
          setStatus('success');
          setMessage(isSwedish 
            ? 'Din e-post har verifierats! Du kan nu använda alla funktioner.'
            : 'Your email has been verified! You can now use all features.');
          
          // Redirect to account page after 3 seconds
          setTimeout(() => {
            router.push(`/${locale}/account`);
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || (isSwedish 
            ? 'Verifieringen misslyckades. Länken kan vara ogiltig eller ha gått ut.'
            : 'Verification failed. The link may be invalid or expired.'));
        }
      } catch {
        setStatus('error');
        setMessage(isSwedish 
          ? 'Ett fel uppstod. Försök igen senare.'
          : 'An error occurred. Please try again later.');
      }
    };

    verifyEmail();
  }, [token, locale, isSwedish, router]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-neutral-900 rounded-lg p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 border-4 border-neutral-700 border-t-white rounded-full animate-spin mx-auto mb-6" />
              <h1 className="text-xl font-semibold text-white mb-2">
                {isSwedish ? 'Verifierar din e-post...' : 'Verifying your email...'}
              </h1>
              <p className="text-neutral-400">
                {isSwedish ? 'Vänta medan vi bekräftar din e-postadress.' : 'Please wait while we confirm your email address.'}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white mb-2">
                {isSwedish ? 'E-post verifierad!' : 'Email Verified!'}
              </h1>
              <p className="text-neutral-400 mb-6">{message}</p>
              <p className="text-sm text-neutral-500">
                {isSwedish ? 'Omdirigerar till ditt konto...' : 'Redirecting to your account...'}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white mb-2">
                {isSwedish ? 'Verifiering misslyckades' : 'Verification Failed'}
              </h1>
              <p className="text-neutral-400 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  href={`/${locale}/account`}
                  className="block w-full py-3 px-4 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  {isSwedish ? 'Gå till mitt konto' : 'Go to My Account'}
                </Link>
                <Link
                  href={`/${locale}`}
                  className="block w-full py-3 px-4 border border-neutral-700 text-white font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  {isSwedish ? 'Tillbaka till startsidan' : 'Back to Home'}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

