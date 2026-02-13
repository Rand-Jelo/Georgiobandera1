'use client';

import * as React from 'react';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ProductTabsProps {
  description?: string | null;
  instructions?: string | null;
  sku?: string | null;
  stockQuantity: number;
  trackInventory: boolean;
  size?: string | null;
  reviewsContent: React.ReactNode;
  shippingContent?: React.ReactNode;
}

export default function ProductTabs({
  description,
  instructions,
  sku,
  stockQuantity,
  trackInventory,
  size,
  reviewsContent,
  shippingContent,
}: ProductTabsProps) {
  const t = useTranslations('product');
  const [activeTab, setActiveTab] = useState<'description' | 'instructions' | 'specs' | 'reviews' | 'shipping'>('description');

  const tabs = [
    { id: 'description' as const, label: t('description') || 'Description' },
    ...(instructions ? [{ id: 'instructions' as const, label: t('instructions') || 'Instructions' }] : []),
    { id: 'specs' as const, label: t('specifications') || 'Specifications' },
    { id: 'reviews' as const, label: t('reviews') || 'Reviews' },
    { id: 'shipping' as const, label: t('shipping') || 'Shipping' },
  ];

  return (
    <div className="border-t border-neutral-200/50 pt-12 mt-12">
      {/* Tab Navigation */}
      <div className="border-b border-neutral-200/50 mb-10">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 text-xs font-light uppercase tracking-[0.2em] transition-colors duration-300
                ${activeTab === tab.id
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600 hover:border-neutral-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'description' && (
          <div className="prose prose-sm max-w-none text-neutral-600 leading-relaxed font-light">
            {description ? (
              <div dangerouslySetInnerHTML={{ __html: description }} />
            ) : (
              <p className="text-neutral-400 italic font-light">No description available.</p>
            )}
          </div>
        )}

        {activeTab === 'instructions' && instructions && (
          <div className="space-y-6">
            {instructions
              .replace(/<[^>]*>/g, '')
              .split(/\n\s*\n/)
              .map(block => block.trim())
              .filter(block => block.length > 0)
              .map((step, index) => (
                <div key={index} className="flex gap-5 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-light">
                    {index + 1}
                  </div>
                  <div className="text-neutral-600 font-light leading-relaxed pt-1">
                    {step.split('\n').map((line, i) => (
                      <span key={i}>
                        {line.trim()}
                        {i < step.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="space-y-6">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              {sku && (
                <>
                  <dt className="text-xs font-light uppercase tracking-[0.3em] text-neutral-500">SKU</dt>
                  <dd className="text-sm text-neutral-900 font-light">{sku}</dd>
                </>
              )}
              {size && (
                <>
                  <dt className="text-xs font-light uppercase tracking-[0.3em] text-neutral-500">
                    {t('size') || 'Size'}
                  </dt>
                  <dd className="text-sm text-neutral-900 font-light">{size}</dd>
                </>
              )}
              <dt className="text-xs font-light uppercase tracking-[0.3em] text-neutral-500">
                {t('stockStatus') || 'Stock Status'}
              </dt>
              <dd className="text-sm text-neutral-900">
                {trackInventory ? (
                  stockQuantity > 0 ? (
                    <span className="text-green-600 font-light">
                      {t('inStock') || 'In Stock'} ({stockQuantity} {t('available') || 'available'})
                    </span>
                  ) : (
                    <span className="text-red-600 font-light">
                      {t('outOfStock') || 'Out of Stock'}
                    </span>
                  )
                ) : (
                  <span className="text-green-600 font-light">
                    {t('inStock') || 'In Stock'}
                  </span>
                )}
              </dd>
            </dl>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>{reviewsContent}</div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-6">
            {shippingContent || (
              <div className="text-neutral-600 font-light">
                <p className="mb-6 leading-relaxed">
                  {t('shippingInfo') || 'Shipping information will be calculated at checkout based on your location.'}
                </p>
                <ul className="list-disc list-inside space-y-3 text-sm font-light">
                  <li>{t('freeShippingOver') || 'Free shipping over 500 SEK'}</li>
                  <li>{t('standardShipping') || 'Standard shipping: 2-5 business days'}</li>
                  <li>{t('expressShipping') || 'Express shipping available'}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

