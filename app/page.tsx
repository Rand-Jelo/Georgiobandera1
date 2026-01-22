import { redirect } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';
import { getDB } from '@/lib/db/client';
import { getGeneralSettings } from '@/lib/db/queries/settings';

// Force dynamic rendering to access database
export const dynamic = 'force-dynamic';

// Redirect root to default locale
export default async function RootPage() {
  // Try to get default language from database settings
  let defaultLocale: 'en' | 'sv' = routing.defaultLocale;
  try {
    const db = getDB();
    const settings = await getGeneralSettings(db);
    if (settings?.default_language && routing.locales.includes(settings.default_language as any)) {
      defaultLocale = settings.default_language as 'en' | 'sv';
    }
  } catch (error) {
    // Fallback to hardcoded default if database query fails
    console.error('Error fetching default language from settings:', error);
  }
  
  redirect(`/${defaultLocale}`);
}
