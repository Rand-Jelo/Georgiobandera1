import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const section = formData.get('section') as string | null;
    const altTextEn = formData.get('alt_text_en') as string | null;
    const altTextSv = formData.get('alt_text_sv') as string | null;
    const activeStr = formData.get('active') as string | null;

    if (!file || !section) {
      return NextResponse.json(
        { error: 'File and section are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${section}-${crypto.randomUUID()}.${ext}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/images/site directory
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'site');
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // URL for the image
    const url = `/images/site/${filename}`;

    const now = Math.floor(Date.now() / 1000);
    const active = activeStr === 'true' ? 1 : 0;

    // Check if image for this section already exists
    const existing = await db
      .prepare('SELECT id FROM site_images WHERE section = ?')
      .bind(section)
      .first<{ id: string }>();

    if (existing) {
      // Update existing
      await db
        .prepare(
          `UPDATE site_images 
           SET url = ?, alt_text_en = ?, alt_text_sv = ?, active = ?, updated_at = ?
           WHERE id = ?`
        )
        .bind(url, altTextEn || null, altTextSv || null, active, now, existing.id)
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
        .bind(id, section, url, altTextEn || null, altTextSv || null, active, now, now)
        .run();

      const created = await db
        .prepare('SELECT * FROM site_images WHERE id = ?')
        .bind(id)
        .first<SiteImage>();

      return NextResponse.json({ image: created, created: true });
    }
  } catch (error) {
    console.error('Error uploading site image:', error);
    return NextResponse.json(
      { error: 'Failed to upload site image' },
      { status: 500 }
    );
  }
}

