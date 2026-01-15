'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/lib/i18n/routing';
import { formatPrice } from '@/lib/utils';
import AddToCartButton from '@/components/cart/AddToCartButton';
import QuantitySelector from '@/components/product/QuantitySelector';
import WishlistButton from '@/components/product/WishlistButton';

interface Product {
  id: string;
  name_en: string;
  name_sv: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  track_inventory: boolean;
  images?: Array<{ url: string; alt_text_en?: string | null }>;
}

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const t = useTranslations('product');
  const locale = useLocale();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setSelectedImageIndex(0);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const productName = locale === 'sv' ? product.name_sv : product.name_en;
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const inStock = !product.track_inventory || product.stock_quantity > 0;
  const maxQuantity = product.track_inventory ? product.stock_quantity : 999;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-0 sm:p-4 md:p-6">
        <div
          className="relative bg-white max-w-6xl w-full h-full sm:h-auto sm:max-h-[95vh] overflow-y-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="fixed sm:absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 bg-white/90 sm:bg-transparent rounded-full sm:rounded-none text-neutral-400 hover:text-neutral-900 transition-colors duration-300"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="grid md:grid-cols-2 gap-0">
            {/* Product Image */}
            <div className="bg-neutral-50 p-6 sm:p-8 md:p-12 lg:p-16 flex items-center justify-center">
              {product.images && product.images.length > 0 ? (
                <div className="relative aspect-square w-full max-w-md sm:max-w-lg bg-white">
                  <Image
                    src={product.images[selectedImageIndex]?.url || product.images[0].url}
                    alt={product.images[selectedImageIndex]?.alt_text_en || productName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, 50vw"
                  />
                </div>
              ) : (
                <div className="aspect-square w-full max-w-md sm:max-w-lg bg-neutral-100 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="inline-block h-px w-16 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
                    <p className="text-[10px] font-light uppercase tracking-[0.2em] text-neutral-300">No image</p>
                  </div>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col p-6 sm:p-8 md:p-12 lg:p-16 bg-white">
              {/* Product Name */}
              <h2 className="text-2xl sm:text-3xl font-extralight tracking-wide text-neutral-900 mb-6 sm:mb-8 leading-tight">{productName}</h2>

              {/* Price */}
              <div className="flex items-baseline gap-3 sm:gap-4 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-neutral-200/50">
                <span className="text-xl sm:text-2xl font-light text-neutral-900">
                  {formatPrice(product.price, 'SEK')}
                </span>
                {hasDiscount && (
                  <span className="text-base sm:text-lg text-neutral-400 line-through font-extralight">
                    {formatPrice(product.compare_at_price!, 'SEK')}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6 sm:mb-10">
                {inStock ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200/50">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs font-light uppercase tracking-[0.2em] text-neutral-600">{t('inStock') || 'In Stock'}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200/50">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-xs font-light uppercase tracking-[0.2em] text-neutral-600">{t('outOfStock') || 'Out of Stock'}</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              {inStock && (
                <div className="mb-6 sm:mb-10">
                  <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-3 sm:mb-4">
                    {t('quantity') || 'Quantity'}
                  </label>
                  <QuantitySelector
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    max={maxQuantity}
                    disabled={!inStock}
                    className="w-full sm:w-auto"
                  />
                </div>
              )}

              {/* Add to Cart and Wishlist */}
              <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <AddToCartButton
                  productId={product.id}
                  quantity={quantity}
                  disabled={!inStock}
                  className="flex-1 w-full sm:w-auto"
                />
                <WishlistButton
                  productId={product.id}
                  size="md"
                  className="self-center sm:self-auto"
                />
              </div>

              {/* View Full Details Link */}
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="inline-flex items-center gap-2 text-xs font-light uppercase tracking-[0.2em] text-neutral-500 hover:text-amber-600 transition-colors duration-300 group"
              >
                {t('viewFullDetails') || 'View Full Details'}
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

