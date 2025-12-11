import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getStoreSettings } from '@/lib/db/queries/settings';
import { getDefaultTaxRate } from '@/lib/utils/tax';

/**
 * GET /api/checkout/tax
 * Get tax rate for calculations
 */
export async function GET() {
  try {
    const db = getDB();
    const settings = await getStoreSettings(db);
    const taxRate = settings?.tax_rate ? settings.tax_rate / 100 : getDefaultTaxRate(); // Convert percentage to decimal
    
    return NextResponse.json({ taxRate });
  } catch (error) {
    console.error('Get tax rate error:', error);
    // Return default tax rate on error
    return NextResponse.json({ taxRate: getDefaultTaxRate() });
  }
}

