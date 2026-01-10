import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';

interface SiteImage {
  id: string;
  section: string;
  url: string;
  alt_text_en: string | null;
  alt_text_sv: string | null;
  active: number;
  created_at: number;
  updated_at: number;
}

// GET - Fetch a specific site image by section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  try {
    const { section } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);
    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const image = await db
      .prepare('SELECT * FROM site_images WHERE section = ?')
      .bind(section)
      .first<SiteImage>();

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Error fetching site image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site image' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a site image by section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  try {
    const { section } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);
    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const existing = await db
      .prepare('SELECT id FROM site_images WHERE section = ?')
      .bind(section)
      .first<{ id: string }>();

    if (!existing) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    await db
      .prepare('DELETE FROM site_images WHERE section = ?')
      .bind(section)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting site image:', error);
    return NextResponse.json(
      { error: 'Failed to delete site image' },
      { status: 500 }
    );
  }
}

