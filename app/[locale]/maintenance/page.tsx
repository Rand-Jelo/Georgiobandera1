'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function MaintenancePage() {
    const t = useTranslations('errors.maintenance');

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
            {/* Wrench icon */}
            <div className="mb-6 opacity-30">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
            </div>

            {/* Gold divider */}
            <div className="w-14 h-px mb-10" style={{ background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)' }} />

            <h1 className="text-2xl md:text-4xl font-light tracking-widest uppercase text-white mb-4">
                {t('title')}
            </h1>

            <p className="text-sm md:text-base text-white/45 max-w-md leading-relaxed mb-2 font-light">
                {t('description')}
            </p>

            <p className="text-xs mb-10" style={{ color: 'rgba(251,191,36,0.6)', letterSpacing: '0.05em' }}>
                {t('thankYou')}
            </p>

            <Link
                href="mailto:info@georgiobandera.se"
                className="border border-white/15 text-white/50 px-7 py-3 text-xs font-light tracking-widest uppercase hover:border-amber-400 hover:text-amber-400 transition-all duration-300"
            >
                {t('contact')}
            </Link>
        </div>
    );
}
