import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import {
  getWishlistItems,
  addToWishlist,
  isInWishlist,
} from '@/lib/db/queries/wishlist';
import { getProductById, getProductImages } from '@/lib/db/queries/products';
import { z } from 'zod';

const addItemSchema = z.object({
  productId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDB();
    const items = await getWishlistItems(db, session.userId);

    // Enrich with product data including images
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await getProductById(db, item.product_id);
        if (product) {
          const images = await getProductImages(db, item.product_id);
          return {
            ...item,
            product: {
              ...product,
              images: images.map(img => ({
                url: img.url,
                alt_text_en: img.alt_text_en,
                alt_text_sv: img.alt_text_sv,
              })),
            },
          };
        }
        return {
          ...item,
          product: null,
        };
      })
    );

    // Filter out items where product was deleted
    const validItems = enrichedItems.filter(item => item.product !== null);

    return NextResponse.json({ items: validItems });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to get wishlist' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = addItemSchema.parse(body);
    const db = getDB();

    // Verify product exists
    const product = await getProductById(db, validated.productId);
    if (!product || product.status !== 'active') {
      return NextResponse.json(
        { error: 'Product not found or unavailable' },
        { status: 404 }
      );
    }

    // Check if already in wishlist
    const alreadyInWishlist = await isInWishlist(db, session.userId, validated.productId);
    if (alreadyInWishlist) {
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400 }
      );
    }

    await addToWishlist(db, session.userId, validated.productId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Add to wishlist error:', error);
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

