import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB, getR2Bucket } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { randomUUID } from 'crypto';

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

/**
 * POST /api/admin/site-images/upload
 * Upload a site image file to R2 and create/update database record
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
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `site/${section}-${randomUUID()}.${fileExtension}`;

    // Upload to R2
    let bucket;
    try {
      bucket = getR2Bucket();
    } catch (error) {
      console.error('Failed to get R2 bucket:', error);
      return NextResponse.json(
        { error: 'R2 bucket not available. Please check Cloudflare configuration.' },
        { status: 500 }
      );
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log(`Uploading site image to R2: ${fileName}, size: ${arrayBuffer.byteLength} bytes`);
      
      const putResult = await bucket.put(fileName, arrayBuffer, {
        httpMetadata: {
          contentType: file.type,
        },
      });
      
      console.log('Site image uploaded to R2 successfully:', putResult);
      
      // Verify the file was uploaded
      const verifyObject = await bucket.get(fileName);
      if (!verifyObject) {
        console.error('File upload verification failed - file not found in R2');
        return NextResponse.json(
          { error: 'File upload verification failed' },
          { status: 500 }
        );
      }
      console.log('Site image upload verified in R2');
    } catch (error) {
      console.error('Error uploading to R2:', error);
      return NextResponse.json(
        { error: `Failed to upload to R2: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Generate public URL - use API route to serve images
    const imageUrl = `/api/images/${fileName}`;

    const now = Math.floor(Date.now() / 1000);
    const active = activeStr === 'true' ? 1 : 0;

    // Check if image for this section already exists
    const existing = await db
      .prepare('SELECT id, url FROM site_images WHERE section = ?')
      .bind(section)
      .first<{ id: string; url: string }>();

    if (existing) {
      // Try to delete old image from R2
      try {
        const oldFileName = existing.url.replace('/api/images/', '');
        await bucket.delete(oldFileName);
        console.log('Deleted old site image from R2:', oldFileName);
      } catch (e) {
        console.warn('Failed to delete old image from R2:', e);
      }

      // Update existing
      await db
        .prepare(
          `UPDATE site_images 
           SET url = ?, alt_text_en = ?, alt_text_sv = ?, active = ?, updated_at = ?
           WHERE id = ?`
        )
        .bind(imageUrl, altTextEn || null, altTextSv || null, active, now, existing.id)
        .run();

      const updated = await db
        .prepare('SELECT * FROM site_images WHERE id = ?')
        .bind(existing.id)
        .first<SiteImage>();

      return NextResponse.json({ image: updated, updated: true });
    } else {
      // Create new
      const id = randomUUID();
      await db
        .prepare(
          `INSERT INTO site_images (id, section, url, alt_text_en, alt_text_sv, active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(id, section, imageUrl, altTextEn || null, altTextSv || null, active, now, now)
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
