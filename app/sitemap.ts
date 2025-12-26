import { MetadataRoute } from 'next';
import { getDB } from '@/lib/db/client';
import { getProducts } from '@/lib/db/queries/products';
import { getCategories } from '@/lib/db/queries/products';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://georgiobandera.se';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let db;
  try {
    db = getDB();
  } catch (error) {
    // If database is not available during build, return basic sitemap
    console.warn('Database not available during sitemap generation, returning basic sitemap');
    return [
      {
        url: `${SITE_URL}/en`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${SITE_URL}/sv`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
  
  const urls: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/en`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/sv`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/en/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/sv/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/en/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/sv/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/en/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/sv/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    // Add all active products
    const products = await getProducts(db, { status: 'active' });
    for (const product of products) {
      urls.push({
        url: `${SITE_URL}/en/products/${product.slug}`,
        lastModified: new Date(product.updated_at * 1000),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
      urls.push({
        url: `${SITE_URL}/sv/products/${product.slug}`,
        lastModified: new Date(product.updated_at * 1000),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // Add all categories
    const categories = await getCategories(db);
    for (const category of categories) {
      urls.push({
        url: `${SITE_URL}/en/shop?categories=${category.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
      urls.push({
        url: `${SITE_URL}/sv/shop?categories=${category.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return urls;
}

