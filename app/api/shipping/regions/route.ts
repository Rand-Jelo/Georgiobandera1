import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getShippingRegions } from '@/lib/db/queries/shipping';

export async function GET() {
  try {
    const db = getDB();
    const regions = await getShippingRegions(db, true); // Only active regions

    // Add caching headers - shipping regions rarely change, cache for 10 minutes
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=300');
    
    return NextResponse.json({ regions }, { headers });
  } catch (error) {
    console.error('Get shipping regions error:', error);
    return NextResponse.json(
      { error: 'Failed to get shipping regions' },
      { status: 500 }
    );
  }
}
