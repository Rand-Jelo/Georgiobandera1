import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getOrderByNumber, getOrderItems } from '@/lib/db/queries/orders';

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

    // Verify order belongs to user (if logged in)
    if (session?.userId && order.user_id !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const items = await getOrderItems(db, order.id);

    return NextResponse.json({
      order: {
        ...order,
        items,
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
