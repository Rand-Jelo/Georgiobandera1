'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function WishlistButton({
  productId,
  className = '',
  size = 'md',
}: WishlistButtonProps) {
  const t = useTranslations('product');
  const router = useRouter();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    checkWishlistStatus();
  }, [productId]);

  const checkWishlistStatus = async () => {
    try {
      const response = await fetch(`/api/wishlist/${productId}`);
      if (response.ok) {
        const data = await response.json() as { inWishlist: boolean };
        setIsInWishlist(data.inWishlist);
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error);
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
      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch(`/api/wishlist/${productId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setIsInWishlist(false);
        }
      } else {
        // Add to wishlist
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        });
        if (response.ok) {
          setIsInWishlist(true);
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className={`${className} opacity-50 cursor-not-allowed`}
        aria-label="Loading wishlist status"
      >
        <svg
          className={`${size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} animate-spin`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    );
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className={`${sizeClasses[size]} flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
        isInWishlist
          ? 'text-neutral-900 hover:text-amber-500'
          : 'text-white hover:text-amber-400'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      title={isInWishlist ? t('removeFromWishlist') || 'Remove from wishlist' : t('addToWishlist') || 'Add to wishlist'}
    >
      {toggling ? (
        <svg
          className={`${iconSizes[size]} animate-spin`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ) : (
        <svg
          className={iconSizes[size]}
          fill={isInWishlist ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
    </button>
  );
}

