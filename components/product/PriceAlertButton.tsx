'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface PriceAlertButtonProps {
  productId: string;
  currentPrice: number;
  className?: string;
}

export default function PriceAlertButton({
  productId,
  currentPrice,
  className = '',
}: PriceAlertButtonProps) {
  const t = useTranslations('product');
  const router = useRouter();
  const [hasAlert, setHasAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    checkAlertStatus();
  }, [productId]);

  const checkAlertStatus = async () => {
    try {
      const response = await fetch(`/api/price-alerts/${productId}`);
      if (response.ok) {
        const data = await response.json() as { hasAlert: boolean };
        setHasAlert(data.hasAlert);
      }
    } catch (error) {
      console.error('Error checking price alert status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    const userResponse = await fetch('/api/auth/me');
    if (!userResponse.ok) {
      router.push('/login');
      return;
    }

    setToggling(true);
    try {
      if (hasAlert) {
        // Remove alert
        const response = await fetch(`/api/price-alerts/${productId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setHasAlert(false);
        }
      } else {
        // Create alert
        const response = await fetch(`/api/price-alerts/${productId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ targetPrice: currentPrice }),
        });
        if (response.ok) {
          setHasAlert(true);
        }
      }
    } catch (error) {
      console.error('Error toggling price alert:', error);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
        hasAlert
          ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={hasAlert ? t('removePriceAlert') || 'Remove price alert' : t('notifyPriceDrop') || 'Notify me when price drops'}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {hasAlert ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        )}
      </svg>
      {toggling ? (
        <span>{t('loading') || 'Loading...'}</span>
      ) : hasAlert ? (
        <span>{t('priceAlertActive') || 'Price Alert Active'}</span>
      ) : (
        <span>{t('notifyPriceDrop') || 'Notify Me'}</span>
      )}
    </button>
  );
}

