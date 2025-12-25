import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getOrderByNumber, getOrderItems } from '@/lib/db/queries/orders';
import { getOrderStatusHistory } from '@/lib/db/queries/order-tracking';

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

    const items = await getOrderItems(db, order.id);
    const statusHistory = await getOrderStatusHistory(db, order.id);

    return NextResponse.json({
      order: {
        ...order,
        items,
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
