'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/lib/hooks/useCart';
import QuantitySelector from '@/components/product/QuantitySelector';

interface ProductVariant {
    id: string;
    name_en?: string;
    name_sv?: string;
    sku?: string;
    price?: number;
    compare_at_price?: number;
    stock_quantity: number;
    track_inventory: boolean;
    option1_name?: string;
    option1_value?: string;
    option2_name?: string;
    option2_value?: string;
    option3_name?: string;
    option3_value?: string;
}

interface ProductImage {
    url: string;
    alt_text_en?: string | null;
    alt_text_sv?: string | null;
}

interface Product {
    id: string;
    name_en: string;
    name_sv: string;
    slug: string;
    price: number;
    compare_at_price: number | null;
    stock_quantity: number;
    track_inventory: boolean;
    variants: ProductVariant[];
    images?: ProductImage[];
}

interface VariantSelectionModalProps {
    productSlug: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function VariantSelectionModal({
    productSlug,
    isOpen,
    onClose,
    onSuccess,
}: VariantSelectionModalProps) {
    const t = useTranslations('product');
    const locale = useLocale();
    const { addToCart, adding } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOption1, setSelectedOption1] = useState<string | null>(null);
    const [selectedOption2, setSelectedOption2] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [addSuccess, setAddSuccess] = useState(false);

    // Extract unique options from variants
    const getUniqueOptions = () => {
        if (!product?.variants) return { option1: null, option2: null };

        const option1Values = new Set<string>();
        const option2Values = new Set<string>();
        let option1Name = '';
        let option2Name = '';

        product.variants.forEach(v => {
            if (v.option1_name && v.option1_value) {
                option1Name = v.option1_name;
                option1Values.add(v.option1_value);
            }
            if (v.option2_name && v.option2_value) {
                option2Name = v.option2_name;
                option2Values.add(v.option2_value);
            }
        });

        return {
            option1: option1Values.size > 0 ? { name: option1Name, values: Array.from(option1Values) } : null,
            option2: option2Values.size > 0 ? { name: option2Name, values: Array.from(option2Values) } : null,
        };
    };

    const { option1, option2 } = getUniqueOptions();

    // Robust matching helper
    const format = (val: string | null | undefined) => val ? String(val).trim().toLowerCase() : '';

    // Derived selected variant
    const selectedVariant = product?.variants.find(v => {

        // Check if options are globally required
        const hasOption1 = product.variants.some(pv => pv.option1_value);
        const hasOption2 = product.variants.some(pv => pv.option2_value);

        const v1 = v.option1_value;
        const s1 = selectedOption1;
        const match1 = hasOption1
            ? format(v1) === format(s1)
            : true;

        const v2 = v.option2_value;
        const s2 = selectedOption2;
        const match2 = hasOption2
            ? format(v2) === format(s2)
            : true;

        return match1 && match2;
    }) || null;

    // Fetch product details with variants
    useEffect(() => {
        if (isOpen && productSlug) {
            fetchProduct();
        }
    }, [isOpen, productSlug]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedOption1(null);
            setSelectedOption2(null);
            setQuantity(1);
            setAddSuccess(false);
            setError('');
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const fetchProduct = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/products/${productSlug}`);
            const data = await response.json() as { product?: Product; error?: string };
            if (data.error) {
                setError(data.error);
            } else if (data.product) {
                setProduct(data.product);
            }
        } catch (err) {
            setError('Failed to load product');
            console.error('Error fetching product:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!product || !selectedVariant) return;

        try {
            await addToCart(product.id, selectedVariant.id, quantity);
            setAddSuccess(true);
            setTimeout(() => {
                onClose();
                onSuccess?.();
            }, 1000);
        } catch (err) {
            setError('Failed to add to cart');
            console.error('Error adding to cart:', err);
        }
    };

    if (!isOpen) return null;

    const productName = product ? (locale === 'sv' ? product.name_sv : product.name_en) : '';

    // Determine the appropriate variant selection message based on available options
    const getVariantSelectionMessage = () => {
        // If we have options but no selection, guide the user
        if ((option1 && !selectedOption1) && (option2 && !selectedOption2)) {
            const opt1Name = option1.name?.toLowerCase() || '';
            const opt2Name = option2?.name?.toLowerCase() || '';

            const hasSize = opt1Name === 'size' || opt1Name === 'storlek' || opt2Name === 'size' || opt2Name === 'storlek';
            const hasColor = opt1Name === 'color' || opt1Name === 'färg' || opt2Name === 'color' || opt2Name === 'färg';

            if (hasSize && hasColor) return t('selectSizeAndColorFirst');
        }

        if (option1 && !selectedOption1) {
            const opt1Name = option1.name?.toLowerCase() || '';
            const isSize = opt1Name === 'size' || opt1Name === 'storlek';
            return isSize ? t('selectSizeFirst') : t('selectVariantFirst');
        }

        if (option2 && !selectedOption2) {
            const opt2Name = option2.name?.toLowerCase() || '';
            const isColor = opt2Name === 'color' || opt2Name === 'färg';
            return isColor ? t('selectColorFirst') : t('selectVariantFirst');
        }

        return t('selectVariantFirst');
    };

    // Check stock for selected variant
    const getVariantStock = (variant: ProductVariant | null) => {
        if (!variant) return { inStock: false, maxQuantity: 0 };
        const inStock = !variant.track_inventory || variant.stock_quantity > 0;
        const maxQuantity = variant.track_inventory ? variant.stock_quantity : 999;
        return { inStock, maxQuantity };
    };

    const { inStock, maxQuantity } = getVariantStock(selectedVariant);

    // Get price (variant price or product price)
    const displayPrice = selectedVariant?.price ?? product?.price ?? 0;
    const comparePrice = selectedVariant?.compare_at_price ?? product?.compare_at_price;
    const hasDiscount = comparePrice && comparePrice > displayPrice;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className="relative bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-neutral-900 transition-colors duration-300"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {loading && (
                        <div className="p-12 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-200 border-t-amber-500"></div>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="p-8 text-center">
                            <p className="text-red-600 font-light">{error}</p>
                            <button
                                onClick={onClose}
                                className="mt-4 px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                            >
                                {t('close') || 'Close'}
                            </button>
                        </div>
                    )}

                    {product && !loading && !error && (
                        <div className="p-6 sm:p-8">
                            {/* Product Header */}
                            <div className="flex gap-4 mb-6 pb-6 border-b border-neutral-200/50">
                                {/* Product Image */}
                                {product.images && product.images.length > 0 && (
                                    <div className="relative w-20 h-20 flex-shrink-0 bg-neutral-50 rounded">
                                        <Image
                                            src={product.images[0].url}
                                            alt={product.images[0].alt_text_en || productName}
                                            fill
                                            className="object-cover rounded"
                                            sizes="80px"
                                        />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-light text-neutral-900 mb-2 leading-tight">
                                        {productName}
                                    </h2>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-base font-light text-neutral-900">
                                            {formatPrice(displayPrice, 'SEK')}
                                        </span>
                                        {hasDiscount && (
                                            <span className="text-sm text-neutral-400 line-through font-extralight">
                                                {formatPrice(comparePrice!, 'SEK')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Option 1 Selection */}
                            {option1 && (
                                <div className="mb-6">
                                    <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-3">
                                        {option1.name.toLowerCase() === 'size' || option1.name.toLowerCase() === 'storlek' ? t('size') : option1.name}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {option1.values.map((value) => {
                                            const format = (v: any) => v ? String(v).trim().toLowerCase() : '';
                                            const isSelected = format(selectedOption1) === format(value);

                                            // Compatibility Check
                                            const hasOption2 = product.variants.some(pv => pv.option2_value);
                                            const isCompatible = product.variants.some(v =>
                                                format(v.option1_value) === format(value) &&
                                                (!hasOption2 || !selectedOption2 || format(v.option2_value) === format(selectedOption2))
                                            );

                                            return (
                                                <button
                                                    key={value}
                                                    onClick={() => setSelectedOption1(value)}
                                                    disabled={!isCompatible}
                                                    className={`px-4 py-2.5 text-xs font-light uppercase tracking-wide border transition-all duration-200 ${isSelected
                                                        ? 'bg-neutral-900 text-white border-neutral-900'
                                                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                                                        } ${!isCompatible ? 'opacity-40 cursor-not-allowed decoration-slice' : ''}`}
                                                >
                                                    {value}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Option 2 Selection */}
                            {option2 && (
                                <div className="mb-6">
                                    <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-3">
                                        {option2.name.toLowerCase() === 'color' || option2.name.toLowerCase() === 'färg' ? t('color') : option2.name}
                                    </label>
                                    <div className="flex flex-wrap items-center gap-3">
                                        {option2.values.map((value) => {
                                            const format = (v: any) => v ? String(v).trim().toLowerCase() : '';
                                            const isSelected = format(selectedOption2) === format(value);
                                            const isHex = value.startsWith('#');

                                            // Compatibility Check
                                            const hasOption1 = product.variants.some(pv => pv.option1_value);
                                            const isCompatible = product.variants.some(v =>
                                                format(v.option2_value) === format(value) &&
                                                (!hasOption1 || !selectedOption1 || format(v.option1_value) === format(selectedOption1))
                                            );

                                            return isHex ? (
                                                <button
                                                    key={value}
                                                    onClick={() => setSelectedOption2(value)}
                                                    disabled={!isCompatible}
                                                    className={`relative w-10 h-10 rounded-full transition-all duration-300
                                                        ${isSelected
                                                            ? 'ring-2 ring-amber-500 ring-offset-2 scale-110'
                                                            : 'ring-1 ring-neutral-200/50 hover:ring-neutral-300 hover:scale-105'
                                                        }
                                                        ${!isCompatible ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    style={{ backgroundColor: value }}
                                                    title={(() => {
                                                        const v = product.variants.find(v => v.option2_value === value);
                                                        return (locale === 'sv' ? v?.name_sv : v?.name_en) || value;
                                                    })()}
                                                />
                                            ) : (
                                                <button
                                                    key={value}
                                                    onClick={() => setSelectedOption2(value)}
                                                    disabled={!isCompatible}
                                                    className={`px-4 py-2.5 text-xs font-light uppercase tracking-wide border transition-all duration-200 ${isSelected
                                                        ? 'bg-neutral-900 text-white border-neutral-900'
                                                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                                                        } ${!isCompatible ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                >
                                                    {value}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Variant Selection Message */}
                            {!selectedVariant && (
                                <p className="text-sm text-amber-600 font-light mb-6">
                                    {getVariantSelectionMessage()}
                                </p>
                            )}

                            {/* Stock Status */}
                            {selectedVariant && (
                                <div className="mb-6">
                                    {inStock ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200/50 rounded-full">
                                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                                            <span className="text-xs font-light uppercase tracking-[0.15em] text-neutral-600">
                                                {t('inStock') || 'In Stock'}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-neutral-200/50 rounded-full">
                                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                                            <span className="text-xs font-light uppercase tracking-[0.15em] text-neutral-600">
                                                {t('outOfStock') || 'Out of Stock'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quantity Selector */}
                            {selectedVariant && inStock && (
                                <div className="mb-6">
                                    <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-3">
                                        {t('quantity') || 'Quantity'}
                                    </label>
                                    <QuantitySelector
                                        value={quantity}
                                        onChange={setQuantity}
                                        min={1}
                                        max={maxQuantity}
                                        disabled={!inStock}
                                    />
                                </div>
                            )}

                            {/* Add to Cart Button */}
                            <button
                                onClick={handleAddToCart}
                                disabled={!selectedVariant || !inStock || adding || addSuccess}
                                className="w-full px-6 py-3.5 bg-neutral-900 text-white text-xs font-light uppercase tracking-[0.2em] hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {addSuccess ? (
                                    <span className="inline-flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {t('addedToCart') || 'Added to Cart'}
                                    </span>
                                ) : adding ? (
                                    'Adding...'
                                ) : (
                                    t('addToCart') || 'Add to Cart'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
