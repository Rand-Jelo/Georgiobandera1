import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import {
  getCartItems,
  addCartItem,
  updateCartItem,
  removeCartItem,
} from '@/lib/db/queries/cart';
import { getProductById, getProductVariant } from '@/lib/db/queries/products';
import { z } from 'zod';

const addItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const db = getDB();

    // Get session ID from cookie for guest carts
    const sessionId = request.cookies.get('session-id')?.value || undefined;
    
    const items = await getCartItems(db, session?.userId, sessionId);
    
    // Enrich with product data
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await getProductById(db, item.product_id);
        const variant = item.variant_id
          ? await getProductVariant(db, item.variant_id)
          : null;
        
        return {
          ...item,
          product,
          variant,
        };
      })
    );

    return NextResponse.json({ items: enrichedItems });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json(
      { error: 'Failed to get cart' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = addItemSchema.parse(body);
    const session = await getSession();
    const db = getDB();

    // Verify product exists
    const product = await getProductById(db, validated.productId);
    if (!product || product.status !== 'active') {
      return NextResponse.json(
        { error: 'Product not found or unavailable' },
        { status: 404 }
      );
    }

    // Verify variant if provided
    if (validated.variantId) {
      const variant = await getProductVariant(db, validated.variantId);
      if (!variant || variant.product_id !== validated.productId) {
        return NextResponse.json(
          { error: 'Invalid variant' },
          { status: 400 }
        );
      }
    }

    // Get or create session ID for guest carts
    let sessionId = request.cookies.get('session-id')?.value;
    if (!sessionId && !session?.userId) {
      sessionId = crypto.randomUUID();
    }

    // Check if item already exists in cart
    const existingItems = await getCartItems(
      db,
      session?.userId,
      sessionId || undefined
    );
    
    const existingItem = existingItems.find(
      (item) =>
        item.product_id === validated.productId &&
        item.variant_id === validated.variantId
    );

    if (existingItem) {
      // Update quantity
      await updateCartItem(
        db,
        existingItem.id,
        existingItem.quantity + validated.quantity
      );
    } else {
      // Add new item
      await addCartItem(db, {
        userId: session?.userId,
        sessionId: sessionId || undefined,
        productId: validated.productId,
        variantId: validated.variantId,
        quantity: validated.quantity,
      });
    }

    // Set session cookie if guest
    if (!session?.userId && sessionId) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('session-id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Add to cart error:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, quantity } = z
      .object({
        itemId: z.string(),
        quantity: z.number().int().positive(),
      })
      .parse(body);

    const session = await getSession();
    const db = getDB();

    // Verify item belongs to user
    const sessionId = request.cookies.get('session-id')?.value || undefined;
    const items = await getCartItems(db, session?.userId, sessionId);
    const item = items.find((i) => i.id === itemId);

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    await updateCartItem(db, itemId, quantity);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update cart error:', error);
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID required' },
        { status: 400 }
      );
    }

    const session = await getSession();
    const db = getDB();

    // Verify item belongs to user
    const sessionId = request.cookies.get('session-id')?.value || undefined;
    const items = await getCartItems(db, session?.userId, sessionId);
    const item = items.find((i) => i.id === itemId);

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    await removeCartItem(db, itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}
