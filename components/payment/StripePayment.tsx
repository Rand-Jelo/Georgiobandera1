'use client';

import * as React from 'react';

import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface StripePaymentProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  shippingDetails: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      postal_code: string;
      country: string;
    };
    phone?: string;
  };
  disabled?: boolean;
}

import { useTranslations } from 'next-intl';

export default function StripePayment({ clientSecret, onSuccess, onError, disabled, shippingDetails }: StripePaymentProps) {
  const t = useTranslations('checkout');
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || t('unexpectedError'));
      setProcessing(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/orders/success`,
        shipping: {
          name: shippingDetails.name,
          address: {
            line1: shippingDetails.address.line1,
            line2: shippingDetails.address.line2 || undefined,
            city: shippingDetails.address.city,
            postal_code: shippingDetails.address.postal_code,
            country: shippingDetails.address.country,
          },
          phone: shippingDetails.phone || undefined,
        },
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || t('paymentFailed'));
      onError(confirmError.message || t('paymentFailed'));
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setError(t('paymentProcessingFailed'));
      onError(t('paymentProcessingFailed'));
      setProcessing(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
        <p className="mt-4 text-sm text-neutral-500">{t('loadingPaymentForm')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <PaymentElement />
      </div>

      {error && (
        <div className="rounded-xl bg-red-50/50 border border-red-200/50 p-4">
          <div className="flex items-center gap-2 text-sm text-red-800">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={processing || disabled}
        className="w-full py-4 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('processingPayment')}
          </span>
        ) : (
          t('payNow')
        )}
      </button>
    </form>
  );
}
