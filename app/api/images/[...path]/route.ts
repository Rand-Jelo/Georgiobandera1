import { NextRequest, NextResponse } from 'next/server';
import { getR2Bucket } from '@/lib/db/client';

/**
 * GET /api/images/[...path]
 * Serve images from R2 bucket
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const key = path.join('/');

    if (!key) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const bucket = getR2Bucket();
    const object = await bucket.get(key);

    if (!object) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Convert R2 body to ArrayBuffer for NextResponse compatibility
    const arrayBuffer = await object.arrayBuffer();

    // Manually create headers from R2 object metadata
    const headers = new Headers();
    
    // Set content type if available
    if (object.httpMetadata?.contentType) {
      headers.set('content-type', object.httpMetadata.contentType);
    }
    
    // Set cache control if available
    if (object.httpMetadata?.cacheControl) {
      headers.set('cache-control', object.httpMetadata.cacheControl);
    }
    
    // Set etag
    if (object.httpEtag) {
      headers.set('etag', object.httpEtag);
    }

    return new NextResponse(arrayBuffer, {
      headers,
    });
  } catch (error) {
    console.error('Get image error:', error);
    return NextResponse.json(
      { error: 'Failed to get image' },
      { status: 500 }
    );
  }
}

