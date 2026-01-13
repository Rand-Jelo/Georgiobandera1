'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const token = searchParams.get('token');
  const isSwedish = locale === 'sv';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(isSwedish 
        ? 'Ingen återställningstoken hittades. Begär en ny återställningslänk.'
        : 'No reset token found. Please request a new reset link.');
    }
  }, [token, isSwedish]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage(isSwedish ? 'Lösenorden matchar inte' : 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setStatus('error');
      setMessage(isSwedish 
        ? 'Lösenordet måste vara minst 8 tecken'
        : 'Password must be at least 8 characters');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json() as { error?: string };

      if (response.ok) {
        setStatus('success');
        setMessage(isSwedish 
          ? 'Ditt lösenord har återställts! Du kan nu logga in.'
          : 'Your password has been reset! You can now log in.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || (isSwedish 
          ? 'Återställningen misslyckades. Länken kan vara ogiltig eller ha gått ut.'
          : 'Reset failed. The link may be invalid or expired.'));
      }
    } catch {
      setStatus('error');
      setMessage(isSwedish 
        ? 'Ett fel uppstod. Försök igen senare.'
        : 'An error occurred. Please try again later.');
    }
  };

  if (!token && status === 'error') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-neutral-900 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">
              {isSwedish ? 'Ogiltig länk' : 'Invalid Link'}
            </h1>
            <p className="text-neutral-400 mb-6">{message}</p>
            <Link
              href={`/${locale}/forgot-password`}
              className="inline-block py-3 px-6 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
            >
              {isSwedish ? 'Begär ny länk' : 'Request New Link'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-neutral-900 rounded-lg p-8">
          <h1 className="text-2xl font-semibold text-white mb-2 text-center">
            {isSwedish ? 'Skapa nytt lösenord' : 'Create New Password'}
          </h1>
          <p className="text-neutral-400 text-center mb-8">
            {isSwedish 
              ? 'Ange ditt nya lösenord nedan.'
              : 'Enter your new password below.'}
          </p>

          {status === 'success' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-neutral-300 mb-4">{message}</p>
              <p className="text-sm text-neutral-500">
                {isSwedish ? 'Omdirigerar till inloggning...' : 'Redirecting to login...'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
                  {isSwedish ? 'Nytt lösenord' : 'New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors pr-12"
                    placeholder={isSwedish ? 'Minst 8 tecken' : 'At least 8 characters'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-300 mb-2">
                  {isSwedish ? 'Bekräfta lösenord' : 'Confirm Password'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
                  placeholder={isSwedish ? 'Skriv lösenordet igen' : 'Type password again'}
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
                  ? (isSwedish ? 'Återställer...' : 'Resetting...') 
                  : (isSwedish ? 'Återställ lösenord' : 'Reset Password')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

