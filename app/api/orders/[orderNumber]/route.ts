import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getOrderByNumber, getOrderItems } from '@/lib/db/queries/orders';
import { getOrderStatusHistory } from '@/lib/db/queries/order-tracking';
import { getProductById, getProductVariant } from '@/lib/db/queries/products';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const session = await getSession();
    const db = getDB();

    const order = await getOrderByNumber(db, orderNumber);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order belongs to user (if logged in) or allow guest access by email
    if (session?.userId) {
      // Logged in user - must own the order
      if (order.user_id !== session.userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    } else {
      // Guest user - check if email matches (from query parameter or cookie)
      const guestEmail = request.nextUrl.searchParams.get('email');
      if (!guestEmail || order.email.toLowerCase() !== guestEmail.toLowerCase()) {
        return NextResponse.json(
          { error: 'Unauthorized. Please provide your email address.' },
          { status: 403 }
        );
      }
    }

    // Get locale from query parameter or default to 'en'
    const locale = request.nextUrl.searchParams.get('locale') || 'en';
    const isSwedish = locale === 'sv';

    const items = await getOrderItems(db, order.id);
    const statusHistory = await getOrderStatusHistory(db, order.id);

    // Update product names based on locale if products still exist
    const itemsWithLocalizedNames = await Promise.all(
      items.map(async (item) => {
        try {
          const product = await getProductById(db, item.product_id);
          if (product) {
            // Product exists - use locale-specific name
            const productName = isSwedish ? product.name_sv : product.name_en;
            
            let variantName = item.variant_name;
            if (item.variant_id) {
              const variant = await getProductVariant(db, item.variant_id);
              if (variant) {
                variantName = isSwedish 
                  ? (variant.name_sv || variant.name_en || item.variant_name)
                  : (variant.name_en || item.variant_name);
              }
            }

            return {
              ...item,
              product_name: productName,
              variant_name: variantName,
            };
          }
        } catch (err) {
          // If product lookup fails, use stored name
          console.error('Error fetching product for order item:', err);
        }
        // Fallback to stored name if product doesn't exist or lookup fails
        return item;
      })
    );

    return NextResponse.json({
      order: {
        ...order,
        items: itemsWithLocalizedNames,
        statusHistory,
      },
    });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Failed to get order' },
      { status: 500 }
    );
  }
}
