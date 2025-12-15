'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Link } from '@/lib/i18n/routing';
import { formatPrice } from '@/lib/utils';
import AddToCartButton from '@/components/cart/AddToCartButton';
import type { ProductReview } from '@/types/database';

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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-neutral-600">
            <li>
              <Link href="/" className="hover:text-neutral-900 transition-colors">
                Home
              </Link>
            </li>
            {product.category && (
              <>
                <li>
                  <svg className="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li>
                  <Link 
                    href={`/categories/${product.category.slug}`}
                    className="hover:text-neutral-900 transition-colors"
                  >
                    {locale === 'sv' ? product.category.name_sv : product.category.name_en}
                  </Link>
                </li>
              </>
            )}
            <li>
              <svg className="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li className="text-neutral-900 font-medium" aria-current="page">
              {getDisplayName()}
            </li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-16 mb-16">
          {/* Images */}
          <div className="mb-8 lg:mb-0">
            {product.images.length > 0 ? (
              <>
                <div className="aspect-square bg-neutral-50 rounded-2xl overflow-hidden mb-4 border border-neutral-200 relative">
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
                  <div className="grid grid-cols-4 gap-3">
                    {product.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square bg-neutral-50 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index
                            ? 'border-neutral-900 ring-2 ring-neutral-900 ring-offset-2'
                            : 'border-neutral-200 hover:border-neutral-300'
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
              <div className="aspect-square bg-neutral-50 rounded-2xl flex items-center justify-center border border-neutral-200">
                <span className="text-neutral-400">No image available</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-semibold text-neutral-900 mb-4 tracking-tight">{getDisplayName()}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-3xl font-semibold text-neutral-900">
                {formatPrice(getDisplayPrice(), 'SEK')}
              </span>
              {hasDiscount && (
                <span className="text-xl text-neutral-500 line-through">
                  {formatPrice(product.compare_at_price!, 'SEK')}
                </span>
              )}
            </div>

            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-neutral-700 mb-3 uppercase tracking-wide">
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
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-50'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        } ${
                          !variantInStock
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-neutral-900">{displayName}</span>
                          {variant.price && variant.price !== product.price && (
                            <span className="text-sm font-medium text-neutral-600">
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
              <div className="border-t border-neutral-200 pt-8 mt-auto">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 uppercase tracking-wide text-sm">
                  {t('description') || 'Description'}
                </h2>
                <div
                  className="prose prose-sm max-w-none text-neutral-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: productDescription }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-neutral-200 pt-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-3">Customer Reviews</h2>
              {reviewStats && reviewStats.total > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {renderStars(Math.round(reviewStats.average))}
                    <span className="text-lg font-semibold text-neutral-900">
                      {reviewStats.average.toFixed(1)}
                    </span>
                    <span className="text-neutral-600 text-sm">
                      ({reviewStats.total} {reviewStats.total === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                </div>
              )}
            </div>
            {!hasReviewed && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm uppercase tracking-wide whitespace-nowrap"
              >
                {showReviewForm ? 'Cancel' : 'Write a Review'}
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
            <div className="mb-12 p-6 bg-neutral-50 rounded-xl border border-neutral-200">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="review-name" className="block text-sm font-medium text-neutral-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="review-name"
                        required
                        value={reviewFormData.name}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="review-email" className="block text-sm font-medium text-neutral-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="review-email"
                        required
                        value={reviewFormData.email}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Rating *
                    </label>
                    {renderStars(reviewFormData.rating, true, (rating) =>
                      setReviewFormData({ ...reviewFormData, rating })
                    )}
                  </div>

                  <div>
                    <label htmlFor="review-title" className="block text-sm font-medium text-neutral-700 mb-2">
                      Review Title (optional)
                    </label>
                    <input
                      type="text"
                      id="review-title"
                      value={reviewFormData.title}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="review-text" className="block text-sm font-medium text-neutral-700 mb-2">
                      Your Review *
                    </label>
                    <textarea
                      id="review-text"
                      required
                      rows={5}
                      minLength={10}
                      value={reviewFormData.review_text}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, review_text: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 bg-white resize-none"
                      placeholder="Share your experience with this product..."
                    />
                    <p className="mt-2 text-sm text-neutral-500">
                      Minimum 10 characters
                    </p>
                  </div>

                  {reviewError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{reviewError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm uppercase tracking-wide"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-600">No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-neutral-200 pb-8 last:border-b-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      {review.title && (
                        <h4 className="font-semibold text-neutral-900 mb-2 text-lg">
                          {review.title}
                        </h4>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <p className="text-sm font-medium text-neutral-900">{review.name}</p>
                        <span className="text-neutral-400">•</span>
                        <p className="text-sm text-neutral-500">
                          {new Date(review.created_at * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <p className="text-neutral-700 mb-4 leading-relaxed">{review.review_text}</p>
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
            <div className="mt-12 p-6 bg-neutral-50 rounded-xl border border-neutral-200">
              <h3 className="text-base font-semibold text-neutral-900 mb-5 uppercase tracking-wide text-sm">Rating Distribution</h3>
              <div className="space-y-3">
                {reviewStats.ratingDistribution.map(({ rating, count }) => {
                  const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 w-20">
                        <span className="text-sm font-medium text-neutral-700">{rating}</span>
                        <svg className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div className="flex-1 bg-neutral-200 rounded-full h-2.5">
                        <div
                          className="bg-yellow-400 h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-neutral-700 w-12 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Related Products Section */}
        {product.category_id && (
          <div className="mt-16 border-t border-neutral-200 pt-12">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-8">Related Products</h2>
            {loadingRelated ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
              </div>
            ) : relatedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                      <div className="relative w-full overflow-hidden rounded-xl border border-neutral-200 bg-white aspect-[4/5] mb-3">
                        {relatedImageUrl ? (
                          <Image
                            src={relatedImageUrl}
                            alt={relatedName}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-neutral-400 bg-neutral-50">
                            No image
                          </div>
                        )}
                        {relatedHasDiscount && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            Sale
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        {relatedProduct.category && (
                          <p className="text-xs uppercase tracking-[0.15em] text-neutral-500 font-medium">
                            {locale === 'sv' ? relatedProduct.category.name_sv : relatedProduct.category.name_en}
                          </p>
                        )}
                        <h3 className="text-sm font-medium tracking-tight text-neutral-900 group-hover:text-neutral-600 transition-colors line-clamp-2">
                          {relatedName}
                        </h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-neutral-900">
                            {formatPrice(relatedProduct.price, 'SEK')}
                          </span>
                          {relatedHasDiscount && (
                            <span className="text-xs text-neutral-500 line-through">
                              {formatPrice(relatedProduct.compare_at_price!, 'SEK')}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-neutral-500 text-center py-8">No related products found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

