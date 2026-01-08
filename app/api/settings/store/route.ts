import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getStoreSettings } from '@/lib/db/queries/settings';

/**
 * GET /api/settings/store
 * Get store settings (public - no authentication required)
 */
export async function GET() {
  try {
    const db = getDB();
    const settings = await getStoreSettings(db);
    
    if (!settings) {
      return NextResponse.json({ settings: null });
    }

    return NextResponse.json({ settings }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Get store settings error:', error);
    return NextResponse.json(
      { error: 'Failed to get store settings' },
      { status: 500 }
    );
  }
}

