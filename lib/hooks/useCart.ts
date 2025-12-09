'use client';

import { useState, useCallback } from 'react';

export function useCart() {
  const [adding, setAdding] = useState(false);

  const addToCart = useCallback(
    async (productId: string, variantId?: string, quantity: number = 1) => {
      setAdding(true);
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            variantId,
            quantity,
          }),
        });

        if (!response.ok) {
          const data = await response.json() as { error?: string };
          throw new Error(data.error || 'Failed to add to cart');
        }

        // Trigger cart count refresh
        window.dispatchEvent(new Event('cart-updated'));
        
        return true;
      } catch (error) {
        console.error('Add to cart error:', error);
        throw error;
      } finally {
        setAdding(false);
      }
    },
    []
  );

  return { addToCart, adding };
}

