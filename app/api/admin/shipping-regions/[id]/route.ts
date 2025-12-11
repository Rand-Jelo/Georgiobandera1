import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getShippingRegionById, updateShippingRegion, deleteShippingRegion } from '@/lib/db/queries/shipping';

/**
 * GET /api/admin/shipping-regions/[id]
 * Get shipping region by ID (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const region = await getShippingRegionById(db, id);

    if (!region) {
      return NextResponse.json(
        { error: 'Shipping region not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ region });
  } catch (error) {
    console.error('Get shipping region error:', error);
    return NextResponse.json(
      { error: 'Failed to get shipping region' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/shipping-regions/[id]
 * Update shipping region (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const region = await updateShippingRegion(db, id, body);

    return NextResponse.json({ region });
  } catch (error) {
    console.error('Update shipping region error:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping region' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/shipping-regions/[id]
 * Delete shipping region (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    await deleteShippingRegion(db, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete shipping region error:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipping region' },
      { status: 500 }
    );
  }
}

