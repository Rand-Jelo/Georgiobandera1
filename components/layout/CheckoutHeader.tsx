'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function CheckoutHeader() {
    const t = useTranslations('common');

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 z-50 flex items-center justify-center px-4">
            <Link href="/" className="group flex items-center gap-2" aria-label={t('navigation.home')}>
                <div className="relative flex flex-col items-center">
                    <span className="text-xl font-light tracking-[0.15em] text-neutral-900 group-hover:text-neutral-700 transition-colors">
                        GEORGIO BANDERA
                    </span>
                    <span className="text-[8px] uppercase tracking-[0.3em] text-neutral-500 group-hover:text-neutral-400 transition-colors mt-0.5">
                        Stockholm
                    </span>
                </div>
            </Link>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-2 text-neutral-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-xs font-light tracking-wide uppercase">Secure Checkout</span>
            </div>
        </header>
    );
}
