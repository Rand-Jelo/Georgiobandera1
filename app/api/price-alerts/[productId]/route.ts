import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getPriceAlert, createPriceAlert, deletePriceAlert } from '@/lib/db/queries/price-alerts';
import { getProductById } from '@/lib/db/queries/products';
import { z } from 'zod';

const createAlertSchema = z.object({
  targetPrice: z.number().positive().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ hasAlert: false });
    }

    const { productId } = await params;
    const db = getDB();
    const alert = await getPriceAlert(db, session.userId, productId);

    return NextResponse.json({ hasAlert: !!alert, alert: alert || null });
  } catch (error) {
    console.error('Get price alert error:', error);
    return NextResponse.json({ hasAlert: false });
  }
}

export async function POST(
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
    const body = await request.json();
    const validated = createAlertSchema.parse(body);
    const db = getDB();

    // Verify product exists
    const product = await getProductById(db, productId);
    if (!product || product.status !== 'active') {
      return NextResponse.json(
        { error: 'Product not found or unavailable' },
        { status: 404 }
      );
    }

    // Check if alert already exists
    const existingAlert = await getPriceAlert(db, session.userId, productId);
    if (existingAlert) {
      return NextResponse.json(
        { error: 'Price alert already exists' },
        { status: 400 }
      );
    }

    // Use target price if provided, otherwise use current price (notify on any drop)
    const targetPrice = validated.targetPrice || product.price;

    await createPriceAlert(db, session.userId, productId, targetPrice, product.price);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create price alert error:', error);
    return NextResponse.json(
      { error: 'Failed to create price alert' },
      { status: 500 }
    );
  }
}

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

    await deletePriceAlert(db, session.userId, productId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete price alert error:', error);
    return NextResponse.json(
      { error: 'Failed to delete price alert' },
      { status: 500 }
    );
  }
}

