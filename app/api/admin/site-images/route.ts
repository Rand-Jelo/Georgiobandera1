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

// GET - Fetch all site images
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

    const images = await db
      .prepare('SELECT * FROM site_images ORDER BY section ASC')
      .all<SiteImage>();

    return NextResponse.json({ images: images.results || [] });
  } catch (error) {
    console.error('Error fetching site images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site images' },
      { status: 500 }
    );
  }
}

// POST - Create or update a site image
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
      section?: string;
      url?: string;
      alt_text_en?: string;
      alt_text_sv?: string;
      active?: boolean;
    };
    const { section, url, alt_text_en, alt_text_sv, active } = body;

    if (!section || !url) {
      return NextResponse.json(
        { error: 'Section and URL are required' },
        { status: 400 }
      );
    }

    // Check if image for this section already exists
    const existing = await db
      .prepare('SELECT id FROM site_images WHERE section = ?')
      .bind(section)
      .first<{ id: string }>();

    const now = Math.floor(Date.now() / 1000);

    if (existing) {
      // Update existing
      await db
        .prepare(
          `UPDATE site_images 
           SET url = ?, alt_text_en = ?, alt_text_sv = ?, active = ?, updated_at = ?
           WHERE id = ?`
        )
        .bind(url, alt_text_en || null, alt_text_sv || null, active ? 1 : 0, now, existing.id)
        .run();

      const updated = await db
        .prepare('SELECT * FROM site_images WHERE id = ?')
        .bind(existing.id)
        .first<SiteImage>();

      return NextResponse.json({ image: updated, updated: true });
    } else {
      // Create new
      const id = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO site_images (id, section, url, alt_text_en, alt_text_sv, active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(id, section, url, alt_text_en || null, alt_text_sv || null, active ? 1 : 0, now, now)
        .run();

      const created = await db
        .prepare('SELECT * FROM site_images WHERE id = ?')
        .bind(id)
        .first<SiteImage>();

      return NextResponse.json({ image: created, created: true });
    }
  } catch (error) {
    console.error('Error saving site image:', error);
    return NextResponse.json(
      { error: 'Failed to save site image' },
      { status: 500 }
    );
  }
}

