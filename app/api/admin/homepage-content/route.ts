import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import {
  getAllHomepageContent,
  upsertHomepageContent,
} from '@/lib/db/queries/homepage-content';

/**
 * GET /api/admin/homepage-content
 * Get all homepage content (admin only)
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

    const content = await getAllHomepageContent(db);
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Get homepage content error:', error);
    return NextResponse.json(
      { error: 'Failed to get homepage content' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/homepage-content
 * Update homepage content (admin only)
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

    const body = await request.json() as {
      section: string;
      title_en?: string | null;
      title_sv?: string | null;
      subtitle_en?: string | null;
      subtitle_sv?: string | null;
      description_en?: string | null;
      description_sv?: string | null;
    };

    const content = await upsertHomepageContent(db, body);
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Update homepage content error:', error);
    return NextResponse.json(
      { error: 'Failed to update homepage content' },
      { status: 500 }
    );
  }
}

