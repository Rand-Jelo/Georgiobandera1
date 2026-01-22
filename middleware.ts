import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { defineRouting } from 'next-intl/routing';
import { getDB } from './lib/db/client';
import { getGeneralSettings } from './lib/db/queries/settings';

// Custom middleware that reads default language from database
export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Always try to get default language from database first
  let defaultLocale: 'en' | 'sv' = 'en';
  
  try {
    const db = getDB();
    const settings = await getGeneralSettings(db);
    console.log('[Middleware] Fetched settings:', JSON.stringify(settings));
    
    if (settings?.default_language && (settings.default_language === 'en' || settings.default_language === 'sv')) {
      defaultLocale = settings.default_language as 'en' | 'sv';
      console.log(`[Middleware] Using default locale from database: ${defaultLocale} for path: ${pathname}`);
    } else {
      console.log(`[Middleware] No valid default_language in settings (got: ${settings?.default_language}), using fallback: ${defaultLocale}`);
    }
  } catch (error: any) {
    // If database access fails, fallback to 'en'
    console.error('[Middleware] Error fetching default language:', error?.message || error);
    if (error?.stack) {
      console.error('[Middleware] Error stack:', error.stack);
    }
  }

  // Create routing config with the database default (or fallback to 'en')
  const routing = defineRouting({
    locales: ['en', 'sv'],
    defaultLocale: defaultLocale,
  });

  console.log(`[Middleware] Created routing with defaultLocale: ${defaultLocale} for path: ${pathname}`);

  // Create and use middleware with dynamic default locale
  const intlMiddleware = createMiddleware(routing);
  const response = await intlMiddleware(request);
  
  console.log(`[Middleware] Response status: ${response?.status}, redirecting to: ${response?.headers.get('location') || 'none'}`);
  
  return response;
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

