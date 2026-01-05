import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getHeroImageById, updateHeroImage, deleteHeroImage } from '@/lib/db/queries/hero-images';

/**
 * GET /api/admin/hero-images/[id]
 * Get a single hero image
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);
    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const image = await getHeroImageById(db, id);

    if (!image) {
      return NextResponse.json({ error: 'Hero image not found' }, { status: 404 });
    }

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Get hero image error:', error);
    return NextResponse.json(
      { error: 'Failed to get hero image' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/hero-images/[id]
 * Update a hero image
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);
    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json() as {
      url?: string;
      alt_text_en?: string | null;
      alt_text_sv?: string | null;
      sort_order?: number;
      active?: boolean;
    };
    const { url, alt_text_en, alt_text_sv, sort_order, active } = body;

    const image = await updateHeroImage(db, id, {
      url,
      alt_text_en,
      alt_text_sv,
      sort_order,
      active,
    });

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Update hero image error:', error);
    return NextResponse.json(
      { error: 'Failed to update hero image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/hero-images/[id]
 * Delete a hero image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);
    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await deleteHeroImage(db, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete hero image error:', error);
    return NextResponse.json(
      { error: 'Failed to delete hero image' },
      { status: 500 }
    );
  }
}

