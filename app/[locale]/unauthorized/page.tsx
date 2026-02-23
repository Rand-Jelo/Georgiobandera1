'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function UnauthorizedPage() {
    const t = useTranslations('errors.unauthorized');

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
            {/* User/lock icon */}
            <div className="mb-6 opacity-30">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 20v-1a6 6 0 0 1 12 0v1" />
                    <line x1="18" y1="3" x2="22" y2="7" />
                    <line x1="22" y1="3" x2="18" y2="7" />
                </svg>
            </div>

            {/* Error number */}
            <div
                className="select-none mb-2"
                style={{
                    fontSize: 'clamp(80px, 16vw, 140px)',
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(255,255,255,0.04) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}
            >
                401
            </div>

            {/* Gold divider */}
            <div className="w-10 h-px my-6" style={{ background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)' }} />

            <h1 className="text-2xl md:text-3xl font-light tracking-widest uppercase text-white mb-4">
                {t('title')}
            </h1>

            <p className="text-sm md:text-base text-white/45 max-w-md leading-relaxed mb-10 font-light">
                {t('description')}
            </p>

            <div className="flex gap-3 flex-wrap justify-center">
                <Link
                    href="/login"
                    className="bg-white text-black px-7 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-amber-400 transition-colors duration-300"
                >
                    {t('signIn')}
                </Link>
                <Link
                    href="/"
                    className="border border-white/20 text-white/70 px-7 py-3 text-xs font-light tracking-widest uppercase hover:border-amber-400 hover:text-amber-400 transition-all duration-300"
                >
                    {t('backHome')}
                </Link>
            </div>
        </div>
    );
}
