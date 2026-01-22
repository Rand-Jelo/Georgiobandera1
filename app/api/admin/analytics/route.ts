import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getSalesData, getTopProducts, getRevenueByStatus } from '@/lib/db/queries/analytics';
import { getProductById } from '@/lib/db/queries/products';

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

    // Get locale from Accept-Language header or default to 'en'
    const acceptLanguage = request.headers.get('accept-language') || '';
    const locale = acceptLanguage.includes('sv') ? 'sv' : 'en';
    const isSwedish = locale === 'sv';

    const [salesData, topProductsRaw, revenueByStatus] = await Promise.all([
      getSalesData(db, days),
      getTopProducts(db, limit, days),
      getRevenueByStatus(db, days),
    ]);

    // Update product names based on locale if products still exist
    const topProducts = await Promise.all(
      topProductsRaw.map(async (product) => {
        try {
          const productData = await getProductById(db, product.product_id);
          if (productData) {
            // Product exists - use locale-specific name
            const productName = isSwedish ? productData.name_sv : productData.name_en;
            return {
              ...product,
              product_name: productName || product.product_name,
            };
          }
        } catch (err) {
          // If product lookup fails, use stored name
          console.error('Error fetching product for analytics:', err);
        }
        // Fallback to stored name if product doesn't exist or lookup fails
        return product;
      })
    );

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

