'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface CheckoutStepsProps {
    currentStep: 'information' | 'shipping' | 'payment';
}

export default function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
    const t = useTranslations('checkout');

    const steps = [
        { id: 'cart', label: t('orderSummary'), href: '/cart' }, // Reusing translation for now
        { id: 'information', label: t('contactInformation') },
        { id: 'shipping', label: t('shipping') },
        { id: 'payment', label: t('payment') },
    ];

    // Helper to determine status
    const getStatus = (stepId: string) => {
        const order = ['cart', 'information', 'shipping', 'payment'];
        const currentIndex = order.indexOf(currentStep);
        const stepIndex = order.indexOf(stepId);

        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'current';
        return 'upcoming';
    };

    return (
        <nav className="flex items-center text-xs md:text-sm font-medium mb-8" aria-label="Checkout Progress">
            <ol className="flex items-center space-x-2">
                {steps.map((step, index) => {
                    const status = getStatus(step.id);
                    const isLast = index === steps.length - 1;

                    return (
                        <li key={step.id} className="flex items-center">
                            <span
                                className={`
                  ${status === 'completed' ? 'text-blue-600' : ''}
                  ${status === 'current' ? 'text-gray-900 font-bold' : ''}
                  ${status === 'upcoming' ? 'text-gray-500' : ''}
                `}
                            >
                                {step.id === 'cart' ? (
                                    <a href="/cart" className="hover:underline">Cart</a>
                                ) : (
                                    status === 'completed' ? step.label : step.label
                                )}
                            </span>
                            {!isLast && (
                                <svg
                                    className="w-3 h-3 text-gray-400 mx-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
