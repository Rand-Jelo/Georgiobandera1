import { MetadataRoute } from 'next';
import { getDB } from '@/lib/db/client';
import { getProducts } from '@/lib/db/queries/products';
import { getCategories } from '@/lib/db/queries/products';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://georgiobandera.se';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  alternates?: {
    languages: Record<string, string>;
  };
};

function localeEntry(
  path: string,
  locale: 'en' | 'sv',
  opts: { changeFrequency: SitemapEntry['changeFrequency']; priority: number; lastModified?: Date }
): SitemapEntry {
  return {
    url: `${SITE_URL}/${locale}${path}`,
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: {
      languages: {
        en: `${SITE_URL}/en${path}`,
        sv: `${SITE_URL}/sv${path}`,
        'x-default': `${SITE_URL}/en${path}`,
      },
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let db;
  try {
    db = getDB();
  } catch (error) {
    // If database is not available during build, return basic sitemap
    console.warn('Database not available during sitemap generation, returning basic sitemap');
    return [
      localeEntry('', 'en', { changeFrequency: 'daily', priority: 1 }),
      localeEntry('', 'sv', { changeFrequency: 'daily', priority: 1 }),
    ];
  }

  const staticPages: Array<{ path: string; changeFrequency: SitemapEntry['changeFrequency']; priority: number }> = [
    { path: '', changeFrequency: 'daily', priority: 1.0 },
    { path: '/shop', changeFrequency: 'daily', priority: 0.9 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
  ];

  const urls: SitemapEntry[] = [];

  for (const page of staticPages) {
    urls.push(localeEntry(page.path, 'en', page));
    urls.push(localeEntry(page.path, 'sv', page));
  }

  try {
    // Add all active products
    const products = await getProducts(db, { status: 'active' });
    for (const product of products) {
      const lastModified = new Date(product.updated_at * 1000);
      urls.push(localeEntry(`/products/${product.slug}`, 'en', { changeFrequency: 'weekly', priority: 0.8, lastModified }));
      urls.push(localeEntry(`/products/${product.slug}`, 'sv', { changeFrequency: 'weekly', priority: 0.8, lastModified }));
    }

    // Add category pages using slug-based URLs (no query params — not indexable)
    const categories = await getCategories(db);
    for (const category of categories) {
      if (category.slug) {
        urls.push(localeEntry(`/shop/${category.slug}`, 'en', { changeFrequency: 'weekly', priority: 0.7 }));
        urls.push(localeEntry(`/shop/${category.slug}`, 'sv', { changeFrequency: 'weekly', priority: 0.7 }));
      }
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return urls;
}
