'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const isSwedish = locale === 'sv';
  
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });

      const data = await response.json() as { error?: string };

      if (response.ok) {
        setStatus('success');
        setMessage(isSwedish 
          ? 'Om ett konto finns med denna e-post har en återställningslänk skickats.'
          : 'If an account exists with this email, a reset link has been sent.');
      } else {
        setStatus('error');
        setMessage(data.error || (isSwedish 
          ? 'Ett fel uppstod. Försök igen.'
          : 'An error occurred. Please try again.'));
      }
    } catch {
      setStatus('error');
      setMessage(isSwedish 
        ? 'Ett fel uppstod. Försök igen senare.'
        : 'An error occurred. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-neutral-900 rounded-lg p-8">
          <h1 className="text-2xl font-semibold text-white mb-2 text-center">
            {isSwedish ? 'Glömt lösenord' : 'Forgot Password'}
          </h1>
          <p className="text-neutral-400 text-center mb-8">
            {isSwedish 
              ? 'Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.'
              : "Enter your email address and we'll send you a link to reset your password."}
          </p>

          {status === 'success' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-neutral-300 mb-6">{message}</p>
              <Link
                href={`/${locale}/login`}
                className="text-white hover:underline"
              >
                {isSwedish ? 'Tillbaka till inloggning' : 'Back to Login'}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                  {isSwedish ? 'E-postadress' : 'Email Address'}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
                  placeholder={isSwedish ? 'din@email.se' : 'your@email.com'}
                />
              </div>

              {status === 'error' && (
                <p className="text-red-400 text-sm">{message}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 px-4 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' 
                  ? (isSwedish ? 'Skickar...' : 'Sending...') 
                  : (isSwedish ? 'Skicka återställningslänk' : 'Send Reset Link')}
              </button>

              <p className="text-center text-neutral-400 text-sm">
                {isSwedish ? 'Kommer du ihåg lösenordet?' : 'Remember your password?'}{' '}
                <Link href={`/${locale}/login`} className="text-white hover:underline">
                  {isSwedish ? 'Logga in' : 'Log in'}
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

