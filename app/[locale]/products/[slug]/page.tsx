'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import AddToCartButton from '@/components/cart/AddToCartButton';

interface ProductVariant {
  id: string;
  name_en: string | null;
  name_sv: string | null;
  price: number | null;
  stock_quantity: number;
  track_inventory: boolean;
  option1_name: string | null;
  option1_value: string | null;
  option2_name: string | null;
  option2_value: string | null;
  option3_name: string | null;
  option3_value: string | null;
}

interface ProductImage {
  id: string;
  url: string;
  alt_text_en: string | null;
  alt_text_sv: string | null;
}

interface Product {
  id: string;
  name_en: string;
  name_sv: string;
  slug: string;
  description_en: string | null;
  description_sv: string | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  track_inventory: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
}

export default function ProductPage() {
  const t = useTranslations('product');
  const locale = useLocale();
  const params = useParams();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${slug}`);
      const data = await response.json() as { product?: Product; error?: string };
      
      if (data.error) {
        setError(data.error);
      } else if (data.product) {
        setProduct(data.product);
        // Select first variant if available
        if (data.product.variants.length > 0) {
          setSelectedVariant(data.product.variants[0]);
        }
      }
    } catch (err) {
      setError('Failed to load product');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayPrice = (): number => {
    if (selectedVariant?.price !== null && selectedVariant?.price !== undefined) {
      return selectedVariant.price;
    }
    return product?.price || 0;
  };

  const getDisplayName = (): string => {
    const baseName = locale === 'sv' ? product?.name_sv : product?.name_en;
    if (selectedVariant) {
      const variantName = locale === 'sv' 
        ? selectedVariant.name_sv 
        : selectedVariant.name_en;
      if (variantName) {
        return `${baseName} - ${variantName}`;
      }
    }
    return baseName || '';
  };

  const isInStock = (): boolean => {
    if (!product) return false;
    if (selectedVariant) {
      if (selectedVariant.stock_quantity === 0 && selectedVariant.track_inventory) {
        return false;
      }
    } else {
      if (product.stock_quantity === 0 && product.track_inventory) {
        return false;
      }
    }
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Product not found'}</p>
        </div>
      </div>
    );
  }

  const productName = locale === 'sv' ? product.name_sv : product.name_en;
  const productDescription = locale === 'sv' 
    ? product.description_sv 
    : product.description_en;
  const hasDiscount = product.compare_at_price && product.compare_at_price > getDisplayPrice();
  const inStock = isInStock();

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Images */}
          <div className="mb-8 lg:mb-0">
            {product.images.length > 0 ? (
              <>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <Image
                    src={product.images[selectedImageIndex]?.url || product.images[0].url}
                    alt={product.images[selectedImageIndex]?.alt_text_en || productName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-4">
                    {product.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === index
                            ? 'border-indigo-600'
                            : 'border-transparent'
                        }`}
                      >
                        <Image
                          src={image.url}
                          alt={image.alt_text_en || productName}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 25vw, 12.5vw"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{getDisplayName()}</h1>

            {/* Price */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(getDisplayPrice(), 'SEK')}
              </span>
              {hasDiscount && (
                <span className="text-xl text-gray-500 line-through">
                  {formatPrice(product.compare_at_price!, 'SEK')}
                </span>
              )}
            </div>

            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  {t('selectVariant') || 'Select Variant'}
                </h3>
                <div className="space-y-2">
                  {product.variants.map((variant) => {
                    const variantName = locale === 'sv'
                      ? variant.name_sv || variant.name_en
                      : variant.name_en;
                    
                    const options: string[] = [];
                    if (variant.option1_value) options.push(variant.option1_value);
                    if (variant.option2_value) options.push(variant.option2_value);
                    if (variant.option3_value) options.push(variant.option3_value);
                    
                    const displayName = variantName || options.join(' / ') || 'Variant';
                    const isSelected = selectedVariant?.id === variant.id;
                    const variantInStock = variant.stock_quantity > 0 || !variant.track_inventory;

                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={!variantInStock}
                        className={`w-full text-left px-4 py-2 rounded-lg border-2 transition-colors ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${
                          !variantInStock
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{displayName}</span>
                          {variant.price && variant.price !== product.price && (
                            <span className="text-sm font-medium">
                              {formatPrice(variant.price, 'SEK')}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {inStock ? (
                <p className="text-green-600 font-medium">{t('inStock')}</p>
              ) : (
                <p className="text-red-600 font-medium">{t('outOfStock')}</p>
              )}
            </div>

            {/* Add to Cart */}
            <div className="mb-8">
              <AddToCartButton
                productId={product.id}
                variantId={selectedVariant?.id}
                disabled={!inStock}
                className="w-full"
              />
            </div>

            {/* Description */}
            {productDescription && (
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('description')}
                </h2>
                <div
                  className="prose prose-sm max-w-none text-gray-600"
                  dangerouslySetInnerHTML={{ __html: productDescription }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

