'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface CheckoutSummaryProps {
    cartItems: any[];
    subtotal: number;
    shippingCost: number | null;
    discountAmount: number;
    total: number;
    discountCode: string;
    isApplyingDiscount: boolean;
    onApplyDiscount: (code: string) => void;
    onRemoveDiscount: () => void;
    currency: string;
    locale: string;
    discountError?: string;
}

export default function CheckoutSummary({
    cartItems,
    subtotal,
    shippingCost,
    discountAmount,
    total,
    discountCode,
    isApplyingDiscount,
    onApplyDiscount,
    onRemoveDiscount,
    currency,
    locale,
    discountError
}: CheckoutSummaryProps) {
    const t = useTranslations('checkout');
    const [code, setCode] = useState('');
    const [expanded, setExpanded] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(locale === 'sv' ? 'sv-SE' : 'en-US', {
            style: 'currency',
            currency: currency,
        }).format(price);
    };

    const handleApply = () => {
        if (code.trim()) {
            onApplyDiscount(code);
            setCode('');
        }
    };

    // Mobile Toggle Header
    const MobileHeader = () => (
        <button
            onClick={() => setExpanded(!expanded)}
            className="lg:hidden w-full flex items-center justify-between py-4 px-4 bg-gray-50 border-b border-gray-200"
        >
            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                <svg
                    className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>
                    {expanded ? 'Hide order summary' : 'Show order summary'}
                    <svg className="w-4 h-4 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </span>
            </div>
            <div className="font-medium text-lg">
                {formatPrice(total)}
            </div>
        </button>
    );

    return (
        <div className="w-full">
            <MobileHeader />

            <div className={`
        ${expanded ? 'block' : 'hidden'} 
        lg:block lg:h-screen lg:sticky lg:top-0 
        bg-gray-50 border-l border-gray-200
        p-6 lg:p-10
      `}>
                {/* Product List */}
                <div className="space-y-4 mb-8">
                    {cartItems.map((item, index) => {
                        const price = item.variant?.price ?? item.product?.price ?? 0;
                        const name = locale === 'sv'
                            ? item.product?.name_sv || item.product?.name_en || ''
                            : item.product?.name_en || '';
                        const variantName = locale === 'sv'
                            ? item.variant?.name_sv || item.variant?.name_en
                            : item.variant?.name_en;

                        return (
                            <div key={`${item.product_id}-${item.variant_id}-${index}`} className="flex gap-4 items-center">
                                <div className="relative w-16 h-16 border border-gray-200 rounded-lg bg-white flex-shrink-0">
                                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 rounded-full text-white text-xs flex items-center justify-center font-medium z-10">
                                        {item.quantity}
                                    </div>
                                    {item.product?.images?.[0]?.url && (
                                        <Image
                                            src={item.product.images[0].url}
                                            alt={name}
                                            fill
                                            className="object-cover rounded-md p-1"
                                        />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-gray-900 truncate">{name}</h3>
                                    {variantName && <p className="text-xs text-gray-500">{variantName}</p>}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                    {formatPrice(price * item.quantity)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <hr className="border-gray-200 my-6" />

                {/* Discount Code */}
                <div className="mb-6">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder={t('discountCode')}
                                className={`w-full h-12 px-5 rounded-lg border-gray-300 focus:ring-black focus:border-black shadow-sm ${discountError ? 'border-red-500' : ''}`}
                                disabled={!!discountCode}
                            />
                        </div>
                        <button
                            onClick={discountCode ? onRemoveDiscount : handleApply}
                            disabled={isApplyingDiscount || (!code && !discountCode)}
                            className={`
                  h-12 px-6 rounded-lg font-medium text-sm transition-colors
                  ${discountCode
                                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                    : 'bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed'
                                }
                `}
                        >
                            {isApplyingDiscount ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </span>
                            ) : discountCode ? t('remove') : t('apply')}
                        </button>
                    </div>
                    {discountError && (
                        <p className="text-red-500 text-xs mt-1">{discountError}</p>
                    )}
                </div>

                {discountCode && (
                    <div className="mb-6 flex items-center justify-between bg-gray-100 p-2 rounded text-sm text-green-700">
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {discountCode}
                        </span>
                    </div>
                )}

                <hr className="border-gray-200 my-6" />

                {/* Totals */}
                <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                        <span>{t('subtotal')}</span>
                        <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>{t('shipping')}</span>
                        <span className="font-medium text-gray-900">
                            {shippingCost === null ? (
                                <span className="text-gray-500 text-xs">{t('enterAddressToCalculate')}</span>
                            ) : shippingCost === 0 ? (
                                t('free')
                            ) : (
                                formatPrice(shippingCost)
                            )}
                        </span>
                    </div>

                    {discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>{t('discount')}</span>
                            <span>-{formatPrice(discountAmount)}</span>
                        </div>
                    )}
                </div>

                <hr className="border-gray-200 my-6" />

                <div className="flex justify-between items-center text-lg font-medium text-gray-900">
                    <span>{t('total')}</span>
                    <span className="text-2xl">{formatPrice(total)}</span>
                </div>
            </div>
        </div>
    );
}
