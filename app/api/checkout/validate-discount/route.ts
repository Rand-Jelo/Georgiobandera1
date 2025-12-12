import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import {
  validateDiscountCode,
  calculateDiscountAmount,
} from '@/lib/db/queries/discount-codes';
import { getSession } from '@/lib/auth/session';

/**
 * POST /api/checkout/validate-discount
 * Validate a discount code and return the discount amount
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      code?: string;
      subtotal?: number;
    };

    if (!body.code || !body.subtotal) {
      return NextResponse.json(
        { error: 'Code and subtotal are required' },
        { status: 400 }
      );
    }

    const db = getDB();
    const session = await getSession();
    const userId = session?.userId || null;

    // Get user email if logged in
    let email: string | undefined;
    if (userId) {
      const { getUserById } = await import('@/lib/db/queries/users');
      const user = await getUserById(db, userId);
      email = user?.email;
    }

    // Validate discount code
    const validation = await validateDiscountCode(
      db,
      body.code,
      body.subtotal,
      userId || undefined,
      email
    );

    if (!validation.valid || !validation.discountCode) {
      return NextResponse.json(
        { error: validation.error || 'Invalid discount code' },
        { status: 400 }
      );
    }

    // Calculate discount amount
    const discountAmount = calculateDiscountAmount(
      validation.discountCode,
      body.subtotal
    );

    return NextResponse.json({
      valid: true,
      discountCode: {
        id: validation.discountCode.id,
        code: validation.discountCode.code,
        discount_type: validation.discountCode.discount_type,
        discount_value: validation.discountCode.discount_value,
      },
      discountAmount,
    });
  } catch (error) {
    console.error('Validate discount code error:', error);
    return NextResponse.json(
      { error: 'Failed to validate discount code' },
      { status: 500 }
    );
  }
}

