import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getHeroImages } from '@/lib/db/queries/hero-images';

/**
 * GET /api/hero-images
 * Get all active hero images for public display
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDB();
    const images = await getHeroImages(db, true); // Only active images

    return NextResponse.json({ images }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Get hero images error:', error);
    return NextResponse.json(
      { error: 'Failed to get hero images' },
      { status: 500 }
    );
  }
}

