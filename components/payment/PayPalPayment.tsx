'use client';

import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';

interface PayPalPaymentProps {
  orderId: string | null;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  total: number;
}

export default function PayPalPayment({ orderId, onSuccess, onError, disabled, total }: PayPalPaymentProps) {
  const [{ isPending }] = usePayPalScriptReducer();

  if (!orderId) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
        <p className="mt-4 text-sm text-neutral-500">Initializing PayPal...</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto"></div>
        <p className="mt-4 text-sm text-neutral-500">Loading PayPal...</p>
      </div>
    );
  }

  return (
    <PayPalButtons
      disabled={disabled}
      createOrder={(data, actions) => {
        return Promise.resolve(orderId);
      }}
      onApprove={async (data, actions) => {
        try {
          const response = await fetch('/api/payments/paypal/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID }),
          });

          const result = await response.json() as { success?: boolean; error?: string };

          if (!response.ok || !result.success) {
            onError(result.error || 'Payment capture failed');
            return;
          }

          onSuccess(data.orderID);
        } catch (err) {
          onError('Failed to process payment');
        }
      }}
      onError={(err) => {
        const errorMessage = (err as { message?: string })?.message || 'PayPal payment failed';
        onError(errorMessage);
      }}
      onCancel={() => {
        onError('Payment cancelled');
      }}
      style={{
        layout: 'vertical',
        color: 'black',
        shape: 'pill',
        label: 'paypal',
      }}
    />
  );
}

