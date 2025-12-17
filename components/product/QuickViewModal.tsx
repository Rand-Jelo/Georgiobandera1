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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-2xl shadow-2xl border border-neutral-100 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-2.5 bg-white rounded-full shadow-lg border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-300 hover:scale-110"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="grid md:grid-cols-2 gap-0 overflow-y-auto">
            {/* Product Image */}
            <div className="bg-gradient-to-br from-neutral-50 to-white p-8 md:p-12 flex items-center justify-center">
              {product.images && product.images.length > 0 ? (
                <div className="relative aspect-square w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src={product.images[selectedImageIndex]?.url || product.images[0].url}
                    alt={product.images[selectedImageIndex]?.alt_text_en || productName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="aspect-square w-full max-w-md bg-neutral-100 rounded-2xl flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-neutral-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-neutral-400 text-sm font-medium">No image available</span>
                  </div>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col p-8 md:p-12 bg-white">
              <h2 className="text-3xl font-light tracking-tight text-neutral-900 mb-6">{productName}</h2>

              {/* Price */}
              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-3xl font-semibold text-neutral-900">
                  {formatPrice(product.price, 'SEK')}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-neutral-400 line-through font-medium">
                    {formatPrice(product.compare_at_price!, 'SEK')}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-8">
                {inStock ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-700 font-medium text-sm">{t('inStock') || 'In Stock'}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-700 font-medium text-sm">{t('outOfStock') || 'Out of Stock'}</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              {inStock && (
                <div className="mb-8">
                  <label className="block text-sm font-medium text-neutral-700 mb-3 tracking-wide">
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
              <div className="mb-8 flex items-center gap-4">
                <AddToCartButton
                  productId={product.id}
                  quantity={quantity}
                  disabled={!inStock}
                  className="flex-1"
                />
                <WishlistButton
                  productId={product.id}
                  size="md"
                />
              </div>

              {/* View Full Details Link */}
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 text-center text-neutral-600 hover:text-neutral-900 font-medium text-sm transition-colors group"
              >
                {t('viewFullDetails') || 'View Full Details'}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

