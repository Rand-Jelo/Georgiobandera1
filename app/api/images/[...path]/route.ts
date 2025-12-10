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

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    return new NextResponse(object.body, {
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

