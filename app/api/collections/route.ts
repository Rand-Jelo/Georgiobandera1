import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getActiveCollections } from '@/lib/db/queries/collections';

/**
 * GET /api/collections
 * Get all active collections (public)
 */
export async function GET() {
  try {
    const db = getDB();
    const collections = await getActiveCollections(db);
    return NextResponse.json({ collections });
  } catch (error) {
    console.error('Get collections error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

