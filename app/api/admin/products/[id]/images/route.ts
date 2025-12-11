import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB, getR2Bucket } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getProductById } from '@/lib/db/queries/products';
import { getProductImages, createProductImage, deleteProductImage, updateProductImage } from '@/lib/db/queries/products';

/**
 * GET /api/admin/products/[id]/images
 * Get all images for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const images = await getProductImages(db, id);

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Get product images error:', error);
    return NextResponse.json(
      { error: 'Failed to get product images' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products/[id]/images
 * Upload and create a new product image
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    
    // Verify product exists
    const product = await getProductById(db, id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const altTextEn = (formData.get('alt_text_en') as string) || null;
    const altTextSv = (formData.get('alt_text_sv') as string) || null;
    const variantId = (formData.get('variant_id') as string) || null;
    const sortOrder = formData.get('sort_order') ? parseInt(formData.get('sort_order') as string) : 0;

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
    const fileName = `${id}/${crypto.randomUUID()}.${fileExtension}`;

    // Upload to R2
    let bucket;
    try {
      bucket = getR2Bucket();
      console.log('R2 bucket retrieved successfully');
    } catch (error) {
      console.error('Failed to get R2 bucket:', error);
      return NextResponse.json(
        { error: 'R2 bucket not available. Please check Cloudflare configuration.' },
        { status: 500 }
      );
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log(`Uploading file to R2: ${fileName}, size: ${arrayBuffer.byteLength} bytes`);
      
      const putResult = await bucket.put(fileName, arrayBuffer, {
        httpMetadata: {
          contentType: file.type,
        },
      });
      
      console.log('File uploaded to R2 successfully:', putResult);
      
      // Verify the file was uploaded
      const verifyObject = await bucket.get(fileName);
      if (!verifyObject) {
        console.error('File upload verification failed - file not found in R2');
        return NextResponse.json(
          { error: 'File upload verification failed' },
          { status: 500 }
        );
      }
      console.log('File upload verified in R2');
    } catch (error) {
      console.error('Error uploading to R2:', error);
      return NextResponse.json(
        { error: `Failed to upload to R2: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Generate public URL - use API route to serve images
    const imageUrl = `/api/images/${fileName}`;

    // Create image record in database
    const image = await createProductImage(db, {
      productId: id,
      variantId: variantId || null,
      url: imageUrl,
      altTextEn: altTextEn || null,
      altTextSv: altTextSv || null,
      sortOrder: sortOrder,
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error('Upload product image error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    );
  }
}

