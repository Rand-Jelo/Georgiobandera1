import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { defineRouting } from 'next-intl/routing';
import { getDB } from './lib/db/client';
import { getGeneralSettings } from './lib/db/queries/settings';

// Custom middleware that reads default language from database
export default async function middleware(request: NextRequest) {
  // Always try to get default language from database first
  let defaultLocale: 'en' | 'sv' = 'en';
  
  try {
    const db = getDB();
    const settings = await getGeneralSettings(db);
    if (settings?.default_language && (settings.default_language === 'en' || settings.default_language === 'sv')) {
      defaultLocale = settings.default_language as 'en' | 'sv';
    }
  } catch (error: any) {
    // If database access fails, fallback to 'en'
    // This is expected during build or if Cloudflare context is unavailable
    if (!error?.message?.includes('getCloudflareContext')) {
      console.error('Error fetching default language in middleware:', error);
    }
  }

  // Create routing config with the database default (or fallback to 'en')
  const routing = defineRouting({
    locales: ['en', 'sv'],
    defaultLocale: defaultLocale,
  });

  // Create and use middleware with dynamic default locale
  const intlMiddleware = createMiddleware(routing);
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

