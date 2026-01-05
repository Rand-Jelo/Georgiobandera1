import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getHeroImages, createHeroImage } from '@/lib/db/queries/hero-images';
import { randomUUID } from 'crypto';

/**
 * GET /api/admin/hero-images
 * Get all hero images (including inactive) for admin
 */
export async function GET(request: NextRequest) {
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

    const images = await getHeroImages(db, false); // Get all images

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Get admin hero images error:', error);
    return NextResponse.json(
      { error: 'Failed to get hero images' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/hero-images
 * Create a new hero image
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

    const body = await request.json() as {
      url?: string;
      alt_text_en?: string | null;
      alt_text_sv?: string | null;
      sort_order?: number;
      active?: boolean;
    };
    const { url, alt_text_en, alt_text_sv, sort_order, active } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Get current max sort_order to append new image at the end
    const existingImages = await getHeroImages(db, false);
    const maxSortOrder = existingImages.length > 0
      ? Math.max(...existingImages.map(img => img.sort_order))
      : -1;

    const image = await createHeroImage(db, {
      id: randomUUID(),
      url,
      alt_text_en: alt_text_en || null,
      alt_text_sv: alt_text_sv || null,
      sort_order: sort_order !== undefined ? sort_order : maxSortOrder + 1,
      active: active !== undefined ? active : true,
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error('Create hero image error:', error);
    return NextResponse.json(
      { error: 'Failed to create hero image' },
      { status: 500 }
    );
  }
}

