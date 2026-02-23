'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function NotFound() {
    const t = useTranslations('errors.notFound');

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
            {/* Decorative number */}
            <div
                className="select-none mb-2"
                style={{
                    fontSize: 'clamp(100px, 20vw, 180px)',
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: '-0.04em',
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(255,255,255,0.04) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                }}
            >
                404
            </div>

            {/* Gold divider */}
            <div
                className="w-10 h-px my-8"
                style={{ background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)' }}
            />

            <h1 className="text-2xl md:text-3xl font-light tracking-widest uppercase text-white mb-4">
                {t('title')}
            </h1>

            <p className="text-sm md:text-base text-white/45 max-w-md leading-relaxed mb-10 font-light">
                {t('description')}
            </p>

            <div className="flex gap-3 flex-wrap justify-center">
                <Link
                    href="/"
                    className="bg-white text-black px-7 py-3 text-xs font-semibold tracking-widest uppercase hover:bg-amber-400 transition-colors duration-300"
                >
                    {t('backHome')}
                </Link>
                <Link
                    href="/shop"
                    className="border border-white/20 text-white/70 px-7 py-3 text-xs font-light tracking-widest uppercase hover:border-amber-400 hover:text-amber-400 transition-all duration-300"
                >
                    {t('shopAll')}
                </Link>
            </div>
        </div>
    );
}
