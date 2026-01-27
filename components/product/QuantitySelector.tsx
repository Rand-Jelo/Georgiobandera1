'use client';

import * as React from 'react';

import { useState, useEffect } from 'react';

interface QuantitySelectorProps {
  value: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 999,
  disabled = false,
  className = '',
}: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(value);

  useEffect(() => {
    setQuantity(value);
  }, [value]);

  const handleDecrease = () => {
    if (!disabled && quantity > min) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      onChange(newQuantity);
    }
  };

  const handleIncrease = () => {
    if (!disabled && quantity < max) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      onChange(newQuantity);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input while typing
    if (inputValue === '') {
      setQuantity(min);
      return;
    }

    const numValue = parseInt(inputValue, 10);
    
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      setQuantity(clampedValue);
      onChange(clampedValue);
    }
  };

  const handleBlur = () => {
    // Ensure value is within bounds on blur
    if (quantity < min) {
      setQuantity(min);
      onChange(min);
    } else if (quantity > max) {
      setQuantity(max);
      onChange(max);
    }
  };

  return (
    <div className={`flex items-center border border-neutral-200/50 overflow-hidden bg-white/50 backdrop-blur-sm ${className}`}>
      <button
        type="button"
        onClick={handleDecrease}
        disabled={disabled || quantity <= min}
        className="px-4 py-3 text-neutral-500 hover:text-neutral-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none"
        aria-label="Decrease quantity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
        </svg>
      </button>
      
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        disabled={disabled}
        className="w-16 text-center border-0 border-x border-neutral-200/50 focus:outline-none focus:ring-0 py-3 text-neutral-900 text-sm font-light disabled:opacity-30 disabled:cursor-not-allowed bg-white"
        aria-label="Quantity"
      />
      
      <button
        type="button"
        onClick={handleIncrease}
        disabled={disabled || quantity >= max}
        className="px-4 py-3 text-neutral-500 hover:text-neutral-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none"
        aria-label="Increase quantity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

