import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { removeFromWishlist, isInWishlist } from '@/lib/db/queries/wishlist';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { productId } = await params;
    const db = getDB();

    await removeFromWishlist(db, session.userId, productId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ inWishlist: false });
    }

    const { productId } = await params;
    const db = getDB();

    const inWishlist = await isInWishlist(db, session.userId, productId);
    return NextResponse.json({ inWishlist });
  } catch (error) {
    console.error('Check wishlist error:', error);
    return NextResponse.json({ inWishlist: false });
  }
}

