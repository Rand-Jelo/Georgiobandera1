import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB, getR2Bucket } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getProductImageById, deleteProductImage, updateProductImage } from '@/lib/db/queries/products';

/**
 * PATCH /api/admin/products/[id]/images/[imageId]
 * Update product image metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
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

    const { imageId } = await params;
    const body = await request.json();

    await updateProductImage(db, imageId, {
      altTextEn: body.alt_text_en,
      altTextSv: body.alt_text_sv,
      sortOrder: body.sort_order,
    });

    const image = await getProductImageById(db, imageId);
    return NextResponse.json({ image });
  } catch (error) {
    console.error('Update product image error:', error);
    return NextResponse.json(
      { error: 'Failed to update product image' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id]/images/[imageId]
 * Delete product image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
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

    const { imageId } = await params;

    // Get image to get the R2 key
    const image = await getProductImageById(db, imageId);
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete from R2 if URL starts with /images/ (our R2 path)
    if (image.url.startsWith('/images/')) {
      try {
        const bucket = getR2Bucket();
        const key = image.url.replace('/images/', '');
        await bucket.delete(key);
      } catch (error) {
        console.error('Error deleting from R2:', error);
        // Continue with database deletion even if R2 deletion fails
      }
    }

    // Delete from database
    await deleteProductImage(db, imageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product image error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product image' },
      { status: 500 }
    );
  }
}

