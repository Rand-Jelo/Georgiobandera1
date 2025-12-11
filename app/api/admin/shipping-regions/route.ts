import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getShippingRegions, createShippingRegion } from '@/lib/db/queries/shipping';

/**
 * GET /api/admin/shipping-regions
 * Get all shipping regions (admin only)
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);

    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const regions = await getShippingRegions(db, false); // Get all, including inactive
    return NextResponse.json({ regions });
  } catch (error) {
    console.error('Get shipping regions error:', error);
    return NextResponse.json(
      { error: 'Failed to get shipping regions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/shipping-regions
 * Create a new shipping region (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);

    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const region = await createShippingRegion(db, body);

    return NextResponse.json({ region });
  } catch (error) {
    console.error('Create shipping region error:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping region' },
      { status: 500 }
    );
  }
}

