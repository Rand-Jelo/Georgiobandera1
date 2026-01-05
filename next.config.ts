import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/config.ts');

const nextConfig: NextConfig = {
  // Cloudflare Pages compatibility
  // Remove output: 'standalone' for Cloudflare Pages
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features here
  },
  images: {
    // Disable image optimization for Cloudflare Pages compatibility
    // Next.js Image optimization doesn't work well with Cloudflare Pages
    unoptimized: true,
    // Allow external images from Unsplash (for hero carousel examples)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
