'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CheckoutHeader from '@/components/layout/CheckoutHeader';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isCheckout = pathname?.includes('/checkout');

    if (isCheckout) {
        return (
            <>
                <CheckoutHeader />
                <main className="flex-1 pt-16">
                    {children}
                </main>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="flex-1">
                {children}
            </div>
            <Footer />
        </>
    );
}
