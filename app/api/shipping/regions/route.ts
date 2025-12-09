import { NextRequest, NextResponse } from 'next/server';
import { getShippingRegions } from '@/lib/db/queries/shipping';

export async function GET(request: NextRequest) {
  try {
    const db = (request as any).env?.DB;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

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

