'use client';

import { useState, useEffect } from 'react';
import Hero from '@/components/home/Hero';
import FeaturedProducts from '@/components/home/FeaturedProducts';

interface Product {
  id: string;
  name_en: string;
  name_sv: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images?: Array<{ url: string; alt_text_en?: string | null }>;
  category?: {
    id: string;
    name_en: string;
    name_sv: string;
    slug: string;
  } | null;
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch featured products
      const productsResponse = await fetch('/api/products?featured=true&status=active&limit=6');
      const productsData = await productsResponse.json() as { products?: Product[] };
      const products = productsData.products || [];
      // Deduplicate by product ID to ensure no duplicates
      const uniqueProducts = Array.from(
        new Map(products.map(product => [product.id, product])).values()
      );
      setFeaturedProducts(uniqueProducts);
    } catch (err) {
      console.error('Error fetching homepage data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-neutral-50">
      <Hero />
      <FeaturedProducts products={featuredProducts} loading={loading} />
    </main>
  );
}
