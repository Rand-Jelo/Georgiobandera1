import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getCollectionProducts } from '@/lib/db/queries/product-collections';
import { queryDB } from '@/lib/db/client';

/**
 * GET /api/admin/collections/[id]/products
 * Get all products in a collection (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const productIds = await getCollectionProducts(db, id);

    // Get product details
    if (productIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const placeholders = productIds.map(() => '?').join(',');
    const result = await queryDB<{
      id: string;
      name_en: string;
      name_sv: string;
      slug: string;
    }>(
      db,
      `SELECT id, name_en, name_sv, slug FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    return NextResponse.json({ products: result.results || [] });
  } catch (error) {
    console.error('Get collection products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection products' },
      { status: 500 }
    );
  }
}

