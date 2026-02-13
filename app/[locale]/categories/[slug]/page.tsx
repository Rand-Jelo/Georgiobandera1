'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import VariantSelectionModal from '@/components/product/VariantSelectionModal';

interface Product {
  id: string;
  name_en: string;
  name_sv: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images?: Array<{ url: string; alt_text_en?: string | null }>;
}

interface Category {
  id: string;
  name_en: string;
  name_sv: string;
  description_en: string | null;
  description_sv: string | null;
}

export default function CategoryPage() {
  const t = useTranslations('common');
  const locale = useLocale();
  const params = useParams();
  const slug = params?.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [variantSelectProductSlug, setVariantSelectProductSlug] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchCategory();
    }
  }, [slug]);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/categories/${slug}`);
      const data = await response.json() as {
        category?: Category;
        products?: Product[];
        error?: string
      };

      if (data.error) {
        setError(data.error);
      } else {
        setCategory(data.category || null);
        setProducts(data.products || []);
      }
    } catch (err) {
      setError('Failed to load category');
      console.error('Error fetching category:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Category not found'}</p>
        </div>
      </div>
    );
  }

  const categoryName = locale === 'sv' ? category.name_sv : category.name_en;
  const categoryDescription = locale === 'sv'
    ? category.description_sv
    : category.description_en;

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{categoryName}</h1>
        {categoryDescription && (
          <p className="text-gray-600 mb-8">{categoryDescription}</p>
        )}

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale as string} showQuickAdd={true} onVariantSelect={(slug) => setVariantSelectProductSlug(slug)} />
            ))}
          </div>
        )}
      </div>

      {/* Variant Selection Modal */}
      <VariantSelectionModal
        productSlug={variantSelectProductSlug || ''}
        isOpen={!!variantSelectProductSlug}
        onClose={() => setVariantSelectProductSlug(null)}
        onSuccess={() => setVariantSelectProductSlug(null)}
      />
    </div>
  );
}

