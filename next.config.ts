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
};

export default withNextIntl(nextConfig);
