import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getShippingRegions } from '@/lib/db/queries/shipping';

export async function GET() {
  try {
    const db = getDB();
    const regions = await getShippingRegions(db, true); // Only active regions

    return NextResponse.json({ regions });
  } catch (error) {
    console.error('Get shipping regions error:', error);
    return NextResponse.json(
      { error: 'Failed to get shipping regions' },
      { status: 500 }
    );
  }
}
