'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function OrderSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('checkout');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const paymentIntentId = searchParams.get('payment_intent');
        const clientSecret = searchParams.get('payment_intent_client_secret');

        if (!paymentIntentId || !clientSecret) {
            setStatus('error');
            setMessage(t('invalidPaymentSession') || 'Invalid payment session');
            return;
        }

        const confirmPayment = async () => {
            try {
                const response = await fetch('/api/checkout/confirm-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentIntentId }),
                });

                const data = await response.json() as { orderNumber?: string; error?: string };

                if (response.ok && data.orderNumber) {
                    setStatus('success');
                    // Redirect to the order confirmation page
                    router.push(`/orders/${data.orderNumber}`);
                } else {
                    setStatus('error');
                    setMessage(data.error || t('paymentConfirmationFailed') || 'Payment confirmation failed');
                }
            } catch (err) {
                console.error('Error confirming payment:', err);
                setStatus('error');
                setMessage(t('paymentConfirmationFailed') || 'Payment confirmation failed');
            }
        };

        confirmPayment();
    }, [router, searchParams, t]);

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white p-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-light mb-4 text-neutral-900">{t('somethingWentWrong') || 'Something went wrong'}</h1>
                    <p className="text-neutral-500 font-light mb-8">
                        {message}
                    </p>
                    <button
                        onClick={() => router.push('/checkout')}
                        className="w-full py-4 px-6 bg-neutral-900 text-white text-sm font-light uppercase tracking-wider hover:bg-neutral-800 transition-all duration-300"
                    >
                        {t('returnToCheckout') || 'Return to Checkout'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-200 border-t-neutral-900 mx-auto mb-6"></div>
                <h1 className="text-xl font-light text-neutral-900 mb-2">{t('processingOrder') || 'Processing your order...'}</h1>
                <p className="text-sm text-neutral-500 font-light">
                    {t('pleaseWaitDoNotClose') || 'Please wait, do not close this window.'}
                </p>
            </div>
        </div>
    );
}
