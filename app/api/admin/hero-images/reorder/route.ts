import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { reorderHeroImages } from '@/lib/db/queries/hero-images';

/**
 * POST /api/admin/hero-images/reorder
 * Reorder hero images
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json() as { imageIds?: string[] };
    const { imageIds } = body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { error: 'imageIds must be a non-empty array' },
        { status: 400 }
      );
    }

    await reorderHeroImages(db, imageIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder hero images error:', error);
    return NextResponse.json(
      { error: 'Failed to reorder hero images' },
      { status: 500 }
    );
  }
}

