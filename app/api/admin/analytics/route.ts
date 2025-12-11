import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getSalesData, getTopProducts, getRevenueByStatus } from '@/lib/db/queries/analytics';

/**
 * GET /api/admin/analytics
 * Get analytics data (admin only)
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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const [salesData, topProducts, revenueByStatus] = await Promise.all([
      getSalesData(db, days),
      getTopProducts(db, limit),
      getRevenueByStatus(db),
    ]);

    return NextResponse.json({
      salesData,
      topProducts,
      revenueByStatus,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics data' },
      { status: 500 }
    );
  }
}

