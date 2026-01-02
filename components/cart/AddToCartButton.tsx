'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCart } from '@/lib/hooks/useCart';

interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
}

export default function AddToCartButton({
  productId,
  variantId,
  quantity = 1,
  disabled = false,
  className = '',
}: AddToCartButtonProps) {
  const t = useTranslations('product');
  const { addToCart, adding } = useCart();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleAddToCart = async () => {
    setError('');
    setSuccess(false);

    try {
      await addToCart(productId, variantId, quantity);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
    }
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={handleAddToCart}
        disabled={disabled || adding}
        className={`inline-flex items-center justify-center px-8 py-3.5 bg-neutral-900 text-white text-xs font-light uppercase tracking-[0.2em] hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${className}`}
      >
        {adding ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Adding...
          </>
        ) : success ? (
          'Added'
        ) : (
          t('addToCart')
        )}
      </button>
      {error && (
        <p className="mt-2 text-xs font-light text-red-600">{error}</p>
      )}
    </div>
  );
}

