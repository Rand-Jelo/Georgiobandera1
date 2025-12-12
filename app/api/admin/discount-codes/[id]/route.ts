import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import {
  getDiscountCodeById,
  updateDiscountCode,
  deleteDiscountCode,
  getDiscountCodeUsage,
} from '@/lib/db/queries/discount-codes';

const updateDiscountCodeSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  description: z.string().nullable().optional(),
  discount_type: z.enum(['percentage', 'fixed']).optional(),
  discount_value: z.number().min(0).optional(),
  minimum_purchase: z.number().min(0).optional(),
  maximum_discount: z.number().min(0).nullable().optional(),
  usage_limit: z.union([z.number().int().positive(), z.null()]).optional(),
  user_usage_limit: z.number().int().positive().optional(),
  valid_from: z.union([z.number().int(), z.null()]).optional(),
  valid_until: z.union([z.number().int(), z.null()]).optional(),
  active: z.boolean().optional(),
});

/**
 * GET /api/admin/discount-codes/[id]
 * Get discount code by ID (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);

    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const discountCode = await getDiscountCodeById(db, id);

    if (!discountCode) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 404 });
    }

    // Get usage history
    const usage = await getDiscountCodeUsage(db, id, { limit: 50 });

    return NextResponse.json({ discountCode, usage });
  } catch (error) {
    console.error('Get discount code error:', error);
    return NextResponse.json(
      { error: 'Failed to get discount code' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/discount-codes/[id]
 * Update discount code (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);

    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json() as {
      code?: string;
      description?: string | null;
      discount_type?: 'percentage' | 'fixed';
      discount_value?: number;
      minimum_purchase?: number;
      maximum_discount?: number | null;
      usage_limit?: number | null;
      user_usage_limit?: number;
      valid_from?: number | null;
      valid_until?: number | null;
      active?: boolean;
    };

    const validated = updateDiscountCodeSchema.parse(body);

    // Validate percentage discount if provided
    if (validated.discount_type === 'percentage' && validated.discount_value !== undefined && validated.discount_value > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    const discountCode = await updateDiscountCode(db, id, validated);

    return NextResponse.json({ discountCode });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Update discount code error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }
    if (errorMessage.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update discount code', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/discount-codes/[id]
 * Delete discount code (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);

    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await deleteDiscountCode(db, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete discount code error:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount code' },
      { status: 500 }
    );
  }
}

