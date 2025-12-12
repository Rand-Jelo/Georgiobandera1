import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import {
  getDiscountCodes,
  createDiscountCode,
} from '@/lib/db/queries/discount-codes';

const createDiscountCodeSchema = z.object({
  code: z.string().min(1).max(50),
  description: z.string().nullable().optional(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().min(0),
  minimum_purchase: z.number().min(0).optional(),
  maximum_discount: z.number().min(0).nullable().optional(),
  usage_limit: z.number().int().positive().nullable().optional(),
  user_usage_limit: z.number().int().positive().optional(),
  valid_from: z.number().int().nullable().optional(),
  valid_until: z.number().int().nullable().optional(),
  active: z.boolean().optional(),
});

/**
 * GET /api/admin/discount-codes
 * List all discount codes (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);

    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

    const codes = await getDiscountCodes(db, {
      active: active !== null ? active === 'true' : undefined,
      search,
      limit,
      offset,
    });

    return NextResponse.json({ codes });
  } catch (error) {
    console.error('Get discount codes error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Check if table doesn't exist
    if (errorMessage.includes('no such table: discount_codes')) {
      return NextResponse.json(
        { 
          error: 'Discount codes table not found. Please run database migrations first.',
          needsMigration: true 
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to get discount codes', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/discount-codes
 * Create a new discount code (admin only)
 */
export async function POST(request: NextRequest) {
  try {
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

    const validated = createDiscountCodeSchema.parse(body);

    // Validate percentage discount
    if (validated.discount_type === 'percentage' && validated.discount_value > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    const discountCode = await createDiscountCode(db, validated);

    return NextResponse.json({ discountCode }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Create discount code error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Check if table doesn't exist
    if (errorMessage.includes('no such table: discount_codes')) {
      return NextResponse.json(
        { 
          error: 'Discount codes table not found. Please run database migrations first.',
          needsMigration: true 
        },
        { status: 500 }
      );
    }
    if (errorMessage.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create discount code', details: errorMessage },
      { status: 500 }
    );
  }
}

