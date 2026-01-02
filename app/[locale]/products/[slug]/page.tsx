'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/lib/i18n/routing';
import { formatPrice } from '@/lib/utils';
import AddToCartButton from '@/components/cart/AddToCartButton';
import QuantitySelector from '@/components/product/QuantitySelector';
import WishlistButton from '@/components/product/WishlistButton';
import ProductTabs from '@/components/product/ProductTabs';
import PriceAlertButton from '@/components/product/PriceAlertButton';
import { ProductStructuredData, BreadcrumbStructuredData } from '@/components/seo/StructuredData';
import type { ProductReview } from '@/types/database';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://georgiobandera.se';

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
  sku: string | null;
  stock_quantity: number;
  track_inventory: boolean;
  category_id?: string | null;
  variants: ProductVariant[];
  images: ProductImage[];
  category?: {
    id: string;
    name_en: string;
    name_sv: string;
    slug: string;
  } | null;
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
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewStats, setReviewStats] = useState<{
    total: number;
    average: number;
    ratingDistribution: { rating: number; count: number }[];
  } | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    title: '',
    review_text: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [userSession, setUserSession] = useState<{ userId?: string; email?: string } | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set());
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedColorName, setSelectedColorName] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchProduct();
      fetchUserSession();
    }
  }, [slug]);

  useEffect(() => {
    if (product) {
      fetchReviews();
      fetchRelatedProducts();
    }
  }, [product]);

  useEffect(() => {
    // Check if user has already reviewed
    if (userSession && reviews.length > 0) {
      const userReview = reviews.find((r) => 
        (userSession.userId && r.user_id === userSession.userId) ||
        (userSession.email && r.email === userSession.email)
      );
      setHasReviewed(!!userReview);
    } else {
      setHasReviewed(false);
    }

    // Load helpful clicks from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`helpful-${product?.id || slug}`);
      if (stored) {
        try {
          const clicked = JSON.parse(stored) as string[];
          setHelpfulClicked(new Set(clicked));
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [userSession, reviews, product, slug]);

  const fetchUserSession = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json() as { user?: { id?: string; email?: string } };
        if (data.user) {
          setUserSession({
            userId: data.user.id,
            email: data.user.email,
          });
        } else {
          setUserSession(null);
        }
      } else {
        setUserSession(null);
      }
    } catch (err) {
      console.error('Error fetching user session:', err);
      setUserSession(null);
    }
  };

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

  const fetchReviews = async () => {
    if (!product) return;
    try {
      const response = await fetch(`/api/products/${product.slug}/reviews?stats=true`);
      const data = await response.json() as {
        reviews?: ProductReview[];
        stats?: {
          total: number;
          average: number;
          ratingDistribution: { rating: number; count: number }[];
        };
      };
      setReviews(data.reviews || []);
      if (data.stats) {
        setReviewStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  const fetchRelatedProducts = async () => {
    if (!product || !product.category_id) return;
    
    setLoadingRelated(true);
    try {
      // Fetch all categories to find parent and siblings
      const categoryResponse = await fetch(`/api/categories`);
      const categoryData = await categoryResponse.json() as { 
        categories?: Array<{ 
          id: string; 
          parent_id: string | null;
          children?: Array<{ id: string }>;
        }> 
      };
      
      // Flatten categories to get all (including nested children)
      const flattenCategories = (cats: typeof categoryData.categories): Array<{ id: string; parent_id: string | null }> => {
        if (!cats) return [];
        const result: Array<{ id: string; parent_id: string | null }> = [];
        for (const cat of cats) {
          result.push({ id: cat.id, parent_id: cat.parent_id || null });
          if (cat.children) {
            result.push(...flattenCategories(cat.children as any));
          }
        }
        return result;
      };
      
      const allCategories = flattenCategories(categoryData.categories);
      
      // Find current category
      const currentCategory = allCategories.find(c => c.id === product.category_id);
      if (!currentCategory) {
        // Fallback to just current category if not found
        const response = await fetch(`/api/products?categoryId=${product.category_id}&status=active&limit=5`);
        const data = await response.json() as { products?: Product[] };
        const products = data.products || [];
        const related = products.filter(p => p.id !== product.id).slice(0, 4);
        setRelatedProducts(related);
        setLoadingRelated(false);
        return;
      }
      
      const parentId = currentCategory.parent_id;
      let categoryIdsToFetch: string[] = [product.category_id];
      
      // If category has a parent, get all sibling categories (categories with same parent_id)
      if (parentId) {
        const siblingCategories = allCategories
          .filter(c => c.parent_id === parentId && c.id !== product.category_id)
          .map(c => c.id);
        categoryIdsToFetch = [...new Set([...categoryIdsToFetch, ...siblingCategories])];
      }
      
      // Fetch products from current category + sibling categories
      const categoryIdsParam = categoryIdsToFetch.join(',');
      const response = await fetch(`/api/products?categoryIds=${categoryIdsParam}&status=active&limit=8`);
      const data = await response.json() as { products?: Product[] };
      const products = data.products || [];
      
      // Filter out the current product
      const related = products.filter(p => p.id !== product.id).slice(0, 4);
      setRelatedProducts(related);
    } catch (err) {
      console.error('Error fetching related products:', err);
      // Fallback to just current category on error
      try {
        const response = await fetch(`/api/products?categoryId=${product.category_id}&status=active&limit=5`);
        const data = await response.json() as { products?: Product[] };
        const products = data.products || [];
        const related = products.filter(p => p.id !== product.id).slice(0, 4);
        setRelatedProducts(related);
      } catch (fallbackErr) {
        console.error('Error in fallback fetch:', fallbackErr);
      }
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setReviewError('');
    setSubmittingReview(true);

    try {
      const response = await fetch(`/api/products/${product.slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewFormData),
      });

      const data = await response.json() as { review?: ProductReview; error?: string };

      if (!response.ok || data.error) {
        setReviewError(data.error || 'Failed to submit review');
        setSubmittingReview(false);
        return;
      }

      setReviewSuccess(true);
      setReviewFormData({
        name: '',
        email: '',
        rating: 5,
        title: '',
        review_text: '',
      });
      setSubmittingReview(false);
      // Refresh reviews after a short delay
      setTimeout(() => {
        fetchReviews();
      }, 1000);
    } catch (err) {
      console.error('Error submitting review:', err);
      setReviewError('Failed to submit review. Please try again.');
      setSubmittingReview(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (!product) return;
    
    // Check if already clicked
    if (helpfulClicked.has(reviewId)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${product.slug}/reviews/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      });

      if (response.ok) {
        // Mark as clicked in state and localStorage
        const newClicked = new Set(helpfulClicked);
        newClicked.add(reviewId);
        setHelpfulClicked(newClicked);

        // Store in localStorage
        if (typeof window !== 'undefined') {
          const clickedArray = Array.from(newClicked);
          localStorage.setItem(`helpful-${product.id}`, JSON.stringify(clickedArray));
        }

        fetchReviews();
      }
    } catch (err) {
      console.error('Error marking review as helpful:', err);
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
            className={interactive ? 'cursor-pointer' : ''}
          >
            <svg
              className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
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

  const getMaxQuantity = (): number => {
    if (!product) return 1;
    if (selectedVariant) {
      if (selectedVariant.track_inventory) {
        return selectedVariant.stock_quantity;
      }
    } else {
      if (product.track_inventory) {
        return product.stock_quantity;
      }
    }
    return 999; // No inventory tracking, allow high quantity
  };

  const getStockQuantity = (): number => {
    if (!product) return 0;
    if (selectedVariant) {
      return selectedVariant.stock_quantity;
    }
    return product.stock_quantity;
  };

  const getTrackInventory = (): boolean => {
    if (!product) return false;
    if (selectedVariant) {
      return selectedVariant.track_inventory;
    }
    return product.track_inventory;
  };

  const showStockUrgency = (): boolean => {
    if (!inStock) return false;
    const stock = getStockQuantity();
    const trackInv = getTrackInventory();
    return trackInv && stock > 0 && stock <= 10;
  };

  // Reset quantity when variant changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant?.id]);

  // Adjust quantity if it exceeds max when stock changes
  useEffect(() => {
    if (!product) return;
    const maxQty = getMaxQuantity();
    if (quantity > maxQty && maxQty > 0) {
      setQuantity(Math.max(1, maxQty));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.stock_quantity, selectedVariant?.stock_quantity]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-neutral-200 border-t-amber-500"></div>
          <p className="mt-6 text-neutral-500 font-light tracking-wide">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 font-light">{error || 'Product not found'}</p>
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

  // Build breadcrumb items for structured data
  const breadcrumbItems = [
    { name: 'Home', url: `${SITE_URL}/${locale}` },
  ];
  if (product.category) {
    breadcrumbItems.push({
      name: locale === 'sv' ? product.category.name_sv : product.category.name_en,
      url: `${SITE_URL}/${locale}/shop?categories=${product.category.id}`,
    });
  }
  breadcrumbItems.push({
    name: productName,
    url: `${SITE_URL}/${locale}/products/${product.slug}`,
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Structured Data */}
      <ProductStructuredData 
        product={{
          id: product.id,
          name_en: product.name_en,
          name_sv: product.name_sv,
          description_en: product.description_en,
          description_sv: product.description_sv,
          price: product.price,
          compare_at_price: product.compare_at_price,
          sku: product.sku,
          images: product.images,
          category: product.category,
        }}
        locale={locale}
        siteUrl={SITE_URL}
      />
      <BreadcrumbStructuredData items={breadcrumbItems} />
      
      <div className="max-w-[1600px] mx-auto px-6 py-12 lg:py-16">
        {/* Breadcrumbs */}
        <nav className="mb-8 pb-6 border-b border-neutral-200/50" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-xs font-light uppercase tracking-[0.2em] text-neutral-500">
            <li>
              <Link href="/" className="hover:text-amber-600 transition-colors duration-300">
                Home
              </Link>
            </li>
            {product.category && (
              <>
                <li>
                  <span className="mx-2">/</span>
                </li>
                <li>
                  <Link 
                    href={`/shop?categories=${product.category.id}`}
                    className="hover:text-amber-600 transition-colors duration-300"
                  >
                    {locale === 'sv' ? product.category.name_sv : product.category.name_en}
                  </Link>
                </li>
              </>
            )}
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="text-neutral-900" aria-current="page">
              {getDisplayName()}
            </li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-20 mb-20">
          {/* Images */}
          <div className="mb-12 lg:mb-0">
            {product.images.length > 0 ? (
              <>
                <div className="aspect-square bg-neutral-50 overflow-hidden mb-8 relative">
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
                        className={`aspect-square bg-neutral-50 overflow-hidden border transition-all duration-300 ${
                          selectedImageIndex === index
                            ? 'border-neutral-900'
                            : 'border-neutral-200/50 hover:border-neutral-300'
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
              <div className="aspect-square bg-neutral-50 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="inline-block h-px w-16 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
                  <p className="text-[10px] font-light uppercase tracking-[0.2em] text-neutral-300">No image</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Product Title */}
            <div className="mb-6">
              {product.category && (
                <div className="inline-block mb-3">
                  <p className="text-[10px] font-light uppercase tracking-[0.4em] text-neutral-500">
                    {locale === 'sv' ? product.category.name_sv : product.category.name_en}
                  </p>
                  <div className="mt-2 h-px w-16 bg-gradient-to-r from-amber-500/50 to-transparent" />
                </div>
              )}
              <h1 className="text-4xl font-extralight tracking-[0.02em] leading-[1.1] text-neutral-900 sm:text-5xl lg:text-6xl mb-6">
                {getDisplayName()}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4 mb-10 pb-10 border-b border-neutral-200/50">
              <span className="text-2xl font-light text-neutral-900">
                {formatPrice(getDisplayPrice(), 'SEK')}
              </span>
              {hasDiscount && (
                <span className="text-lg text-neutral-400 line-through font-extralight">
                  {formatPrice(product.compare_at_price!, 'SEK')}
                </span>
              )}
            </div>

            {/* Variants - Separate Size and Color */}
            {(() => {
              // Separate variants into sizes and colors
              const sizeVariants = product.variants.filter(v => 
                v.option1_name?.toLowerCase() === 'size' && v.option1_value
              );
              const colorVariants = product.variants.filter(v => 
                v.option2_name?.toLowerCase() === 'color' && v.option2_value
              );

              // Get unique sizes and colors
              const uniqueSizes = Array.from(new Set(sizeVariants.map(v => v.option1_value).filter((s): s is string => Boolean(s))));
              
              // Extract colors - try to get name from variant name or use hex
              const uniqueColors = colorVariants.map(v => {
                const hex = v.option2_value || '#000000';
                // Try to extract color name from variant name
                let name = locale === 'sv' 
                  ? (v.name_sv || v.name_en || '')
                  : (v.name_en || v.name_sv || '');
                
                // If no name from variant, try to get from hex color mapping
                if (!name && hex.startsWith('#')) {
                  // Common color names mapping
                  const colorMap: Record<string, string> = {
                    '#000000': 'Black',
                    '#FFFFFF': 'White',
                    '#FF0000': 'Red',
                    '#00FF00': 'Green',
                    '#0000FF': 'Blue',
                    '#FFFF00': 'Yellow',
                    '#FF00FF': 'Magenta',
                    '#00FFFF': 'Cyan',
                    '#FFA500': 'Orange',
                    '#800080': 'Purple',
                    '#FFC0CB': 'Pink',
                    '#A52A2A': 'Brown',
                    '#808080': 'Gray',
                    '#000080': 'Navy',
                    '#008000': 'Dark Green',
                    '#800000': 'Maroon',
                    '#FFD700': 'Gold',
                    '#C0C0C0': 'Silver',
                  };
                  name = colorMap[hex.toUpperCase()] || hex;
                }
                
                return {
                  variant: v,
                  hex: hex,
                  name: name || hex,
                };
              }).filter((v, i, self) => 
                i === self.findIndex(t => t.hex === v.hex)
              );

              return (
                <>
                  {/* Size Selection - Only show if multiple sizes */}
                  {uniqueSizes.length > 1 && (
                    <div className="mb-10">
                      <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                        {t('size') || 'Size'}
                      </label>
                      <select
                        value={selectedVariant?.option1_value || ''}
                        onChange={(e) => {
                          const selectedSize = e.target.value;
                          // Find variant with this size (and current color if selected)
                          const currentColor = selectedVariant?.option2_value;
                          let newVariant = sizeVariants.find(v => 
                            v.option1_value === selectedSize && 
                            (!currentColor || v.option2_value === currentColor)
                          );
                          // If no variant with both size and color, just find by size
                          if (!newVariant) {
                            newVariant = sizeVariants.find(v => v.option1_value === selectedSize);
                          }
                          if (newVariant) setSelectedVariant(newVariant);
                        }}
                        className="w-full px-5 py-3 border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 text-sm font-light tracking-wide focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                      >
                        <option value="">{t('selectSize') || 'Select Size'}</option>
                        {uniqueSizes.map((size) => {
                          const sizeVariant = sizeVariants.find(v => v.option1_value === size);
                          const inStock = sizeVariant && (sizeVariant.stock_quantity > 0 || !sizeVariant.track_inventory);
                          return (
                            <option 
                              key={size} 
                              value={size}
                              disabled={!inStock}
                            >
                              {size} {!inStock && '(Out of Stock)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Color Selection - Show color swatches */}
                  {uniqueColors.length > 0 && (
                    <div className="mb-10">
                      <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                        {t('color') || 'Color'}
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        {uniqueColors.map((colorItem) => {
                          const isHex = colorItem.hex.startsWith('#');
                          const hexColor = isHex ? colorItem.hex : '#000000';
                          const isSelected = selectedVariant?.option2_value === colorItem.hex;
                          const colorVariant = colorVariants.find(v => v.option2_value === colorItem.hex);
                          const inStock = colorVariant && (colorVariant.stock_quantity > 0 || !colorVariant.track_inventory);
                          
                          return (
                            <div key={colorItem.hex} className="relative group">
                              <button
                                type="button"
                                onClick={() => {
                                  // Find variant with this color (and current size if selected)
                                  const currentSize = selectedVariant?.option1_value;
                                  let newVariant = colorVariants.find(v => 
                                    v.option2_value === colorItem.hex && 
                                    (!currentSize || v.option1_value === currentSize)
                                  );
                                  // If no variant with both color and size, just find by color
                                  if (!newVariant) {
                                    newVariant = colorVariants.find(v => v.option2_value === colorItem.hex);
                                  }
                                  if (newVariant) {
                                    setSelectedVariant(newVariant);
                                    setSelectedColorName(colorItem.name);
                                    // Hide name after 2 seconds
                                    setTimeout(() => setSelectedColorName(null), 2000);
                                  }
                                }}
                                disabled={!inStock}
                                className={`
                                  relative w-12 h-12 border transition-all duration-300
                                  ${isSelected 
                                    ? 'border-neutral-900' 
                                    : 'border-neutral-200/50 hover:border-neutral-300'
                                  }
                                  ${!inStock ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                                style={{ backgroundColor: hexColor }}
                                title={colorItem.name}
                              />
                              {/* Color name tooltip - appears on click */}
                              {selectedColorName === colorItem.name && (
                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-10">
                                  <div className="bg-neutral-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg">
                                    {colorItem.name}
                                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-neutral-900 rotate-45"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Stock Status */}
            <div className="mb-10">
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
              <div className="mb-10">
                <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                  {t('quantity') || 'Quantity'}
                </label>
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={getMaxQuantity()}
                  disabled={!inStock}
                  className="w-full sm:w-auto"
                />
              </div>
            )}

            {/* Add to Cart and Wishlist */}
            <div className="mb-10 flex items-center gap-4">
              <AddToCartButton
                productId={product.id}
                variantId={selectedVariant?.id}
                quantity={quantity}
                disabled={!inStock}
                className="flex-1"
              />
              <WishlistButton
                productId={product.id}
                size="md"
              />
            </div>

            {/* Price Alert */}
            <div className="mb-10">
              <PriceAlertButton
                productId={product.id}
                currentPrice={getDisplayPrice()}
              />
            </div>

          </div>
        </div>

        {/* Product Tabs */}
        <ProductTabs
          description={productDescription}
          sku={product.sku}
          stockQuantity={getStockQuantity()}
          trackInventory={getTrackInventory()}
          size={(() => {
            // If there's only one size, show it in specifications
            const sizeVariants = product.variants.filter(v => 
              v.option1_name?.toLowerCase() === 'size' && v.option1_value
            );
            const uniqueSizes = Array.from(new Set(sizeVariants.map(v => v.option1_value).filter(Boolean)));
            return uniqueSizes.length === 1 ? uniqueSizes[0] : null;
          })()}
          reviewsContent={
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12 pb-8 border-b border-neutral-200/50">
                <div>
                  <h2 className="text-2xl font-extralight tracking-wide text-neutral-900 mb-4">Customer Reviews</h2>
                  {reviewStats && reviewStats.total > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {renderStars(Math.round(reviewStats.average))}
                        <span className="text-lg font-light text-neutral-900">
                          {reviewStats.average.toFixed(1)}
                        </span>
                        <span className="text-neutral-500 text-sm font-light">
                          ({reviewStats.total} {reviewStats.total === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {!hasReviewed && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-xs font-light uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all duration-300 whitespace-nowrap"
                  >
                    {showReviewForm ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Write a Review
                      </>
                    )}
                  </button>
                )}
                {hasReviewed && (
                  <p className="text-sm text-neutral-600 italic">
                    You have already reviewed this product
                  </p>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <div className="mb-12 p-10 bg-white border border-neutral-200/50">
                  {reviewSuccess ? (
                    <div className="text-center py-4">
                      <p className="text-green-600 font-medium mb-4">
                        Thank you for your review! It will be reviewed before being published.
                      </p>
                      <button
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewSuccess(false);
                        }}
                        className="text-neutral-900 hover:text-neutral-700 font-medium underline"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="review-name" className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                            Name *
                          </label>
                          <input
                            type="text"
                            id="review-name"
                            required
                            value={reviewFormData.name}
                            onChange={(e) => setReviewFormData({ ...reviewFormData, name: e.target.value })}
                            className="w-full px-5 py-3 border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor="review-email" className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                            Email *
                          </label>
                          <input
                            type="email"
                            id="review-email"
                            required
                            value={reviewFormData.email}
                            onChange={(e) => setReviewFormData({ ...reviewFormData, email: e.target.value })}
                            className="w-full px-5 py-3 border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                          Rating *
                        </label>
                        {renderStars(reviewFormData.rating, true, (rating) =>
                          setReviewFormData({ ...reviewFormData, rating })
                        )}
                      </div>

                      <div>
                        <label htmlFor="review-title" className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                          Review Title <span className="text-neutral-400 font-normal normal-case">(optional)</span>
                        </label>
                        <input
                          type="text"
                          id="review-title"
                          value={reviewFormData.title}
                          onChange={(e) => setReviewFormData({ ...reviewFormData, title: e.target.value })}
                          className="w-full px-5 py-3 border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 text-sm font-light focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                        />
                      </div>

                      <div>
                        <label htmlFor="review-text" className="block text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-4">
                          Your Review *
                        </label>
                        <textarea
                          id="review-text"
                          required
                          rows={5}
                          minLength={10}
                          value={reviewFormData.review_text}
                          onChange={(e) => setReviewFormData({ ...reviewFormData, review_text: e.target.value })}
                          className="w-full px-5 py-3 border border-neutral-200/50 bg-white/50 backdrop-blur-sm text-neutral-900 text-sm font-light resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30 transition-all"
                          placeholder="Share your experience with this product..."
                        />
                        <p className="mt-2 text-xs text-neutral-400 font-light">
                          Minimum 10 characters
                        </p>
                      </div>

                      {reviewError && (
                        <div className="p-4 bg-red-50/50 border border-red-200/50 rounded-xl backdrop-blur-sm">
                          <div className="flex items-center gap-2 text-sm text-red-800">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {reviewError}
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-neutral-900 text-white text-xs font-light uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingReview ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Submit Review
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-neutral-500 font-light">No reviews yet. Be the first to review this product!</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-neutral-200/50 pb-12 last:border-b-0">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {review.title && (
                            <h4 className="font-light text-neutral-900 mb-3 text-lg tracking-wide">
                              {review.title}
                            </h4>
                          )}
                          <div className="flex items-center gap-3 mb-4">
                            <p className="text-sm font-light text-neutral-900">{review.name}</p>
                            <span className="text-neutral-300">•</span>
                            <p className="text-sm text-neutral-400 font-light">
                              {new Date(review.created_at * 1000).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="text-neutral-600 mb-6 leading-relaxed font-light">{review.review_text}</p>
                      <button
                        onClick={() => handleMarkHelpful(review.id)}
                        disabled={helpfulClicked.has(review.id)}
                        className={`text-sm flex items-center gap-1.5 transition-colors ${
                          helpfulClicked.has(review.id)
                            ? 'text-neutral-400 cursor-not-allowed'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        <svg 
                          className={`w-4 h-4 ${helpfulClicked.has(review.id) ? 'fill-current' : ''}`} 
                          fill={helpfulClicked.has(review.id) ? 'currentColor' : 'none'} 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        Helpful ({review.helpful_count})
                        {helpfulClicked.has(review.id) && (
                          <span className="text-xs text-neutral-500">(You marked this)</span>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Rating Distribution */}
              {reviewStats && reviewStats.total > 0 && (
                <div className="mt-16 p-10 bg-white border border-neutral-200/50">
                  <h3 className="text-xs font-light uppercase tracking-[0.3em] text-neutral-500 mb-8">Rating Distribution</h3>
                  <div className="space-y-3">
                    {reviewStats.ratingDistribution.map(({ rating, count }) => {
                      const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 w-20">
                            <span className="text-sm font-medium text-neutral-700">{rating}</span>
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                          <div className="flex-1 bg-neutral-200 rounded-full h-2.5">
                            <div
                              className="bg-yellow-400 h-2.5 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-neutral-600 w-12 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          }
        />

        {/* Related Products Section */}
        {product.category_id && (
          <div className="mt-24 border-t border-neutral-200/50 pt-16">
            <h2 className="text-3xl font-extralight tracking-wide text-neutral-900 mb-12">Related Products</h2>
            {loadingRelated ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
              </div>
            ) : relatedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 lg:gap-12">
                {relatedProducts.map((relatedProduct) => {
                  const relatedName = locale === 'sv' ? relatedProduct.name_sv : relatedProduct.name_en;
                  const relatedImageUrl = relatedProduct.images?.[0]?.url;
                  const relatedHasDiscount = relatedProduct.compare_at_price && relatedProduct.compare_at_price > relatedProduct.price;

                  return (
                    <Link
                      key={relatedProduct.id}
                      href={`/products/${relatedProduct.slug}`}
                      className="group"
                    >
                      <div className="relative w-full overflow-hidden bg-neutral-50 aspect-[3/4] mb-6">
                        {relatedImageUrl ? (
                          <Image
                            src={relatedImageUrl}
                            alt={relatedName}
                            fill
                            className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <div className="text-center space-y-3">
                              <div className="inline-block h-px w-12 bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
                              <p className="text-[10px] font-light uppercase tracking-[0.2em] text-neutral-300">Image</p>
                            </div>
                          </div>
                        )}
                        {relatedHasDiscount && (
                          <div className="absolute top-4 right-4 z-10">
                            <div className="bg-amber-500 px-3 py-1">
                              <p className="text-[9px] font-light uppercase tracking-[0.3em] text-white">Sale</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {relatedProduct.category && (
                          <p className="text-[9px] uppercase tracking-[0.4em] text-neutral-400 font-light">
                            {locale === 'sv' ? relatedProduct.category.name_sv : relatedProduct.category.name_en}
                          </p>
                        )}
                        <h3 className="text-lg font-extralight tracking-wide text-neutral-900 group-hover:text-amber-600 transition-colors duration-300 leading-tight">
                          {relatedName}
                        </h3>
                        <div className="flex items-baseline gap-3 pt-1">
                          {relatedHasDiscount ? (
                            <>
                              <span className="text-base font-light text-neutral-900">
                                {formatPrice(relatedProduct.price, 'SEK')}
                              </span>
                              <span className="text-sm text-neutral-400 line-through font-extralight">
                                {formatPrice(relatedProduct.compare_at_price!, 'SEK')}
                              </span>
                            </>
                          ) : (
                            <span className="text-base font-light text-neutral-900">
                              {formatPrice(relatedProduct.price, 'SEK')}
                            </span>
                          )}
                        </div>
                        <div className="h-px w-0 bg-gradient-to-r from-amber-500/50 to-transparent transition-all duration-500 group-hover:w-full mt-4" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-neutral-400 text-center py-12 font-light">No related products found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

