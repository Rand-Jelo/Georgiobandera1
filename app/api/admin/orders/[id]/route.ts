import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { getOrderById, getOrderItems, updateOrderStatus, updateTrackingNumber, markOrderAsDelivered } from '@/lib/db/queries/orders';
import { sendDeliveryNotificationEmail } from '@/lib/email';
import type { Order } from '@/types/database';

/**
 * GET /api/admin/orders/[id]
 * Get order details with items (admin only)
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
    const order = await getOrderById(db, id);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const items = await getOrderItems(db, id);

    return NextResponse.json({ order, items });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Failed to get order' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/orders/[id]
 * Update order status or tracking number (admin only)
 */
export async function PATCH(
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
    const body = await request.json() as {
      status?: Order['status'];
      tracking_number?: string;
    };

    const order = await getOrderById(db, id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (body.status) {
      await updateOrderStatus(db, id, body.status);
      
      const updatedOrder = await getOrderById(db, id);
      if (!updatedOrder) {
        return NextResponse.json(
          { error: 'Order not found after update' },
          { status: 404 }
        );
      }

      const locale = request.headers.get('accept-language')?.includes('sv') ? 'sv' : 'en';
      
      // Get base URL from request (for preview URLs)
      const requestUrl = new URL(request.url);
      const baseUrl = requestUrl.origin;
      
      // Send delivery notification when order is shipped
      if (body.status === 'shipped') {
        // Use tracking_number from body if provided, otherwise from order
        const trackingNumber = body.tracking_number || updatedOrder.tracking_number || undefined;
        
        sendDeliveryNotificationEmail({
          to: updatedOrder.email,
          name: updatedOrder.shipping_name,
          orderNumber: updatedOrder.order_number,
          trackingNumber,
          locale: locale as 'sv' | 'en',
          baseUrl,
        }).catch(err => {
          console.error('Failed to send delivery notification:', err);
        });
      }
      
      // Send delivery notification when order is marked as delivered
      if (body.status === 'delivered') {
        await markOrderAsDelivered(db, id);
        const finalOrder = await getOrderById(db, id);
        if (finalOrder) {
          sendDeliveryNotificationEmail({
            to: finalOrder.email,
            name: finalOrder.shipping_name,
            orderNumber: finalOrder.order_number,
            trackingNumber: finalOrder.tracking_number || undefined,
            locale: locale as 'sv' | 'en',
            baseUrl,
          }).catch(err => {
            console.error('Failed to send delivery notification:', err);
          });
        }
      }
    }

    if (body.tracking_number) {
      await updateTrackingNumber(db, id, body.tracking_number);
      
      // Send delivery notification when tracking number is added (if order is shipped)
      const updatedOrder = await getOrderById(db, id);
      if (updatedOrder && updatedOrder.status === 'shipped') {
        const locale = request.headers.get('accept-language')?.includes('sv') ? 'sv' : 'en';
        
        // Get base URL from request (for preview URLs)
        const requestUrl = new URL(request.url);
        const baseUrl = requestUrl.origin;
        
        sendDeliveryNotificationEmail({
          to: updatedOrder.email,
          name: updatedOrder.shipping_name,
          orderNumber: updatedOrder.order_number,
          trackingNumber: body.tracking_number,
          locale: locale as 'sv' | 'en',
          baseUrl,
        }).catch(err => {
          console.error('Failed to send delivery notification:', err);
        });
      }
    }

    const updatedOrder = await getOrderById(db, id);
    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

