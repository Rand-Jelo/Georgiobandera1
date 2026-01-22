import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { defineRouting } from 'next-intl/routing';
import { getDB } from './lib/db/client';
import { getGeneralSettings } from './lib/db/queries/settings';

// Base routing config
const baseRouting = defineRouting({
  locales: ['en', 'sv'],
  defaultLocale: 'en',
});

// Create base middleware with default routing
const intlMiddleware = createMiddleware(baseRouting);

// Custom middleware that reads default language from database
export default async function middleware(request: NextRequest) {
  // For root path or paths without locale, try to get default language from database
  const pathname = request.nextUrl.pathname;
  const isRootOrNoLocale = pathname === '/' || (!pathname.startsWith('/en') && !pathname.startsWith('/sv'));
  
  if (isRootOrNoLocale) {
    try {
      const db = getDB();
      const settings = await getGeneralSettings(db);
      if (settings?.default_language && (settings.default_language === 'en' || settings.default_language === 'sv')) {
        // Create a new routing config with the database default
        const dynamicRouting = defineRouting({
          locales: ['en', 'sv'],
          defaultLocale: settings.default_language as 'en' | 'sv',
        });
        const dynamicMiddleware = createMiddleware(dynamicRouting);
        return dynamicMiddleware(request);
      }
    } catch (error: any) {
      // If database access fails, fallback to default middleware
      // This is expected during build or if Cloudflare context is unavailable
      if (!error?.message?.includes('getCloudflareContext')) {
        console.error('Error fetching default language in middleware:', error);
      }
    }
  }

  // Use default middleware for all other cases
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except static files and API routes
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ]
};

// Note: For Cloudflare Pages, compatibility flags must be set in:
// Dashboard → Pages → Settings → Runtime → Compatibility flags: ["nodejs_compat"]

