'use client';

import * as React from 'react';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface ShippingRegionDisplay {
  name_en: string;
  name_sv: string;
  code: string;
  base_price: number;
  shipping_thresholds: Array<{ min_order_amount: number; shipping_price: number }>;
}

interface ProductTabsProps {
  description?: string | null;
  instructions?: string | null;
  ingredients?: string | null;
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
  ingredients,
  sku,
  stockQuantity,
  trackInventory,
  size,
  reviewsContent,
  shippingContent,
}: ProductTabsProps) {
  const t = useTranslations('product');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<'description' | 'instructions' | 'ingredients' | 'specs' | 'reviews' | 'shipping'>('description');
  const [shippingRegions, setShippingRegions] = useState<ShippingRegionDisplay[]>([]);

  useEffect(() => {
    fetch('/api/shipping/regions')
      .then(res => res.json() as Promise<{ regions?: ShippingRegionDisplay[] }>)
      .then((data) => {
        setShippingRegions(data.regions || []);
      })
      .catch(() => { });
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'sv' ? 'sv-SE' : 'en-SE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price) + ' SEK';
  };

  const tabs = [
    { id: 'description' as const, label: t('description') || 'Description' },
    ...(ingredients ? [{ id: 'ingredients' as const, label: t('ingredients') || 'Ingredients' }] : []),
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

        {activeTab === 'ingredients' && ingredients && (
          <div className="space-y-4">
            {ingredients
              .replace(/<[^>]*>/g, '')
              .split(/\n\s*\n/)
              .map(block => block.trim())
              .filter(block => block.length > 0)
              .map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-neutral-400 mt-2.5" />
                  <div className="text-neutral-600 font-light leading-relaxed">
                    {item.split('\n').map((line, i) => (
                      <span key={i}>
                        {line.trim()}
                        {i < item.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
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

                {shippingRegions.length > 0 ? (
                  <div className="space-y-5">
                    {shippingRegions.map((region) => {
                      const regionName = locale === 'sv' ? region.name_sv : region.name_en;
                      const thresholds = [...(region.shipping_thresholds || [])].sort(
                        (a, b) => a.min_order_amount - b.min_order_amount
                      );

                      return (
                        <div key={region.code} className="border border-neutral-200/60 rounded-lg p-4">
                          <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-800 mb-3">
                            {regionName}
                          </h4>
                          <ul className="space-y-1.5 text-sm font-light">
                            <li className="flex justify-between">
                              <span className="text-neutral-500">
                                {locale === 'sv' ? 'Standardfrakt' : 'Standard shipping'}
                              </span>
                              <span className="text-neutral-800 font-normal">
                                {formatPrice(region.base_price)}
                              </span>
                            </li>
                            {thresholds.map((th, i) => (
                              <li key={i} className="flex justify-between">
                                <span className="text-neutral-500">
                                  {locale === 'sv'
                                    ? `Beställning över ${formatPrice(th.min_order_amount)}`
                                    : `Orders over ${formatPrice(th.min_order_amount)}`}
                                </span>
                                <span className={`font-normal ${th.shipping_price === 0 ? 'text-green-600' : 'text-neutral-800'}`}>
                                  {th.shipping_price === 0
                                    ? (locale === 'sv' ? 'Fri frakt' : 'Free')
                                    : formatPrice(th.shipping_price)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <ul className="list-disc list-inside space-y-3 text-sm font-light">
                    <li>{t('standardShipping') || 'Standard shipping: 2-5 business days'}</li>
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

