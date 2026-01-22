import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { getDB } from '@/lib/db/client';
import { getGeneralSettings } from '@/lib/db/queries/settings';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    // Try to get default language from database settings
    // Note: This may fail during build time, so we catch and fallback
    try {
      const db = getDB();
      const settings = await getGeneralSettings(db);
      if (settings?.default_language && routing.locales.includes(settings.default_language as any)) {
        locale = settings.default_language as 'en' | 'sv';
      } else {
        locale = routing.defaultLocale;
      }
    } catch (error: any) {
      // Fallback to hardcoded default if database query fails
      // This is expected during build time or if Cloudflare context is not available
      if (error?.message?.includes('getCloudflareContext')) {
        // Silently fallback during build or when context is unavailable
        locale = routing.defaultLocale;
      } else {
        console.error('Error fetching default language from settings:', error);
        locale = routing.defaultLocale;
      }
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});

