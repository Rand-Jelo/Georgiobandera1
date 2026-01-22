import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { defineRouting } from 'next-intl/routing';
import { getDB } from './lib/db/client';
import { getGeneralSettings } from './lib/db/queries/settings';

// Custom middleware that reads default language from database
export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // For root path, manually redirect based on database setting
  if (pathname === '/') {
    let defaultLocale: 'en' | 'sv' = 'en';
    
    try {
      const db = getDB();
      const settings = await getGeneralSettings(db);
      console.log('[Middleware] Root path - Fetched settings:', JSON.stringify(settings));
      
      if (settings?.default_language && (settings.default_language === 'en' || settings.default_language === 'sv')) {
        defaultLocale = settings.default_language as 'en' | 'sv';
        console.log(`[Middleware] Root path - Redirecting to: /${defaultLocale}`);
      } else {
        console.log(`[Middleware] Root path - No valid default_language (got: ${settings?.default_language}), using fallback: /${defaultLocale}`);
      }
    } catch (error: any) {
      console.error('[Middleware] Root path - Error fetching default language:', error?.message || error);
    }
    
    // Manually redirect to the default locale
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.redirect(url);
  }

  // For all other paths, use next-intl middleware with dynamic default
  let defaultLocale: 'en' | 'sv' = 'en';
  
  try {
    const db = getDB();
    const settings = await getGeneralSettings(db);
    if (settings?.default_language && (settings.default_language === 'en' || settings.default_language === 'sv')) {
      defaultLocale = settings.default_language as 'en' | 'sv';
    }
  } catch (error: any) {
    if (!error?.message?.includes('getCloudflareContext')) {
      console.error('[Middleware] Error fetching default language:', error);
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

