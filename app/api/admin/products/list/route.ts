import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getProducts } from '@/lib/db/queries/products';
import type { Product } from '@/types/database';

/**
 * GET /api/admin/products/list
 * Get all products for admin (including draft and archived)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);

    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get filters from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'draft' | 'active' | 'archived' | null;
    const search = searchParams.get('search') || undefined;

    // Get all products (no status filter means all statuses)
    const products = await getProducts(db, {
      status: status || undefined,
      search: search,
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get admin products error:', error);
    return NextResponse.json(
      { error: 'Failed to get products' },
      { status: 500 }
    );
  }
}

