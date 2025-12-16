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
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-neutral-50 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div>
              {product.images && product.images.length > 0 ? (
                <div className="relative aspect-square bg-neutral-50 rounded-xl overflow-hidden mb-4">
                  <Image
                    src={product.images[selectedImageIndex]?.url || product.images[0].url}
                    alt={product.images[selectedImageIndex]?.alt_text_en || productName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-neutral-50 rounded-xl flex items-center justify-center">
                  <span className="text-neutral-400">No image available</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">{productName}</h2>

              {/* Price */}
              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-2xl font-semibold text-neutral-900">
                  {formatPrice(product.price, 'SEK')}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-neutral-500 line-through">
                    {formatPrice(product.compare_at_price!, 'SEK')}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {inStock ? (
                  <p className="text-green-600 font-medium flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {t('inStock') || 'In Stock'}
                  </p>
                ) : (
                  <p className="text-red-600 font-medium flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {t('outOfStock') || 'Out of Stock'}
                  </p>
                )}
              </div>

              {/* Quantity Selector */}
              {inStock && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
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
              <div className="mb-6 flex items-center gap-3">
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
                className="text-center text-neutral-600 hover:text-neutral-900 underline text-sm"
              >
                {t('viewFullDetails') || 'View Full Details'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

