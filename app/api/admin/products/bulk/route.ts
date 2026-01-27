import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { executeDB } from '@/lib/db/client';

const bulkOperationSchema = z.object({
  productIds: z.array(z.string()).min(1, 'At least one product must be selected'),
  action: z.enum(['delete', 'status', 'category', 'featured']),
  value: z.union([
    z.string(), // For status, category_id
    z.boolean(), // For featured
  ]).optional(),
});

/**
 * POST /api/admin/products/bulk
 * Perform bulk operations on products (admin only)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validated = bulkOperationSchema.parse(body);

    const { productIds, action, value } = validated;
    const placeholders = productIds.map(() => '?').join(',');

    let updated = 0;

    switch (action) {
      case 'delete': {
        // Soft delete by setting status to archived
        const deleteResult = await executeDB(
          db,
          `UPDATE products SET status = 'archived', updated_at = unixepoch() WHERE id IN (${placeholders})`,
          productIds
        );
        updated = deleteResult.meta?.changes || 0;
        break;
      }

      case 'status': {
        if (!value || typeof value !== 'string') {
          return NextResponse.json(
            { error: 'Status value is required' },
            { status: 400 }
          );
        }
        if (!['draft', 'active', 'archived'].includes(value)) {
          return NextResponse.json(
            { error: 'Invalid status value' },
            { status: 400 }
          );
        }
        const statusResult = await executeDB(
          db,
          `UPDATE products SET status = ?, updated_at = unixepoch() WHERE id IN (${placeholders})`,
          [value, ...productIds]
        );
        updated = statusResult.meta?.changes || 0;
        break;
      }

      case 'category': {
        // value can be null to remove category
        const categoryResult = await executeDB(
          db,
          `UPDATE products SET category_id = ?, updated_at = unixepoch() WHERE id IN (${placeholders})`,
          [value || null, ...productIds]
        );
        updated = categoryResult.meta?.changes || 0;
        break;
      }

      case 'featured': {
        if (typeof value !== 'boolean') {
          return NextResponse.json(
            { error: 'Featured value must be a boolean' },
            { status: 400 }
          );
        }
        const featuredResult = await executeDB(
          db,
          `UPDATE products SET featured = ?, updated_at = unixepoch() WHERE id IN (${placeholders})`,
          [value ? 1 : 0, ...productIds]
        );
        updated = featuredResult.meta?.changes || 0;
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} product(s)`,
      updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Bulk operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

