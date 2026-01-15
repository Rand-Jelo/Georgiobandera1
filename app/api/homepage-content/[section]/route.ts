import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getHomepageContentBySection } from '@/lib/db/queries/homepage-content';

/**
 * GET /api/homepage-content/[section]
 * Get homepage content by section (public)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  try {
    const { section } = await params;
    const db = getDB();
    const content = await getHomepageContentBySection(db, section);

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Get homepage content error:', error);
    return NextResponse.json(
      { error: 'Failed to get homepage content' },
      { status: 500 }
    );
  }
}

