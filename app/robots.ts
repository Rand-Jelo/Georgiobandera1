import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://georgiobandera.se';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Locale-prefixed private routes
          '/*/admin/',
          '/*/cart',
          '/*/checkout',
          '/*/orders/',
          '/*/profile',
          '/*/wishlist',
          '/*/login',
          '/*/register',
          // API & internal
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
