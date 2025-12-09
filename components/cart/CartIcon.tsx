'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CartIconProps extends React.SVGProps<SVGSVGElement> {
  showCount?: boolean;
}

function CartIconSVG(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
      <path d="M4 5h2l1.2 8.5a1.5 1.5 0 0 0 1.5 1.3H17a1.5 1.5 0 0 0 1.5-1.2L19 9H8" />
    </svg>
  );
}

export default function CartIcon({ showCount = true, ...props }: CartIconProps) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCount();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCount();
    };
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const fetchCount = async () => {
    try {
      const response = await fetch('/api/cart/count');
      const data = await response.json() as { count?: number };
      setCount(data.count || 0);
    } catch (err) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <CartIconSVG {...props} />
      {showCount && !loading && count > 0 && (
        <span className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
}
