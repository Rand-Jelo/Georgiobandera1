import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB, getR2Bucket } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { createHeroImage, getHeroImages } from '@/lib/db/queries/hero-images';
import { randomUUID } from 'crypto';

/**
 * POST /api/admin/hero-images/upload
 * Upload a hero image file to R2 and create database record
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
    const file = formData.get('file') as File;
    const altTextEn = (formData.get('alt_text_en') as string) || null;
    const altTextSv = (formData.get('alt_text_sv') as string) || null;
    const active = formData.get('active') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `hero/${randomUUID()}.${fileExtension}`;

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
      console.log(`Uploading hero image to R2: ${fileName}, size: ${arrayBuffer.byteLength} bytes`);
      
      const putResult = await bucket.put(fileName, arrayBuffer, {
        httpMetadata: {
          contentType: file.type,
        },
      });
      
      console.log('Hero image uploaded to R2 successfully:', putResult);
      
      // Verify the file was uploaded
      const verifyObject = await bucket.get(fileName);
      if (!verifyObject) {
        console.error('File upload verification failed - file not found in R2');
        return NextResponse.json(
          { error: 'File upload verification failed' },
          { status: 500 }
        );
      }
      console.log('Hero image upload verified in R2');
    } catch (error) {
      console.error('Error uploading to R2:', error);
      return NextResponse.json(
        { error: `Failed to upload to R2: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Generate public URL - use API route to serve images
    const imageUrl = `/api/images/${fileName}`;

    // Get current max sort_order to append new image at the end
    const existingImages = await getHeroImages(db, false);
    const maxSortOrder = existingImages.length > 0
      ? Math.max(...existingImages.map(img => img.sort_order))
      : -1;

    // Create image record in database
    const image = await createHeroImage(db, {
      id: randomUUID(),
      url: imageUrl,
      alt_text_en: altTextEn,
      alt_text_sv: altTextSv,
      sort_order: maxSortOrder + 1,
      active: active,
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error('Upload hero image error:', error);
    return NextResponse.json(
      { error: 'Failed to upload hero image' },
      { status: 500 }
    );
  }
}

