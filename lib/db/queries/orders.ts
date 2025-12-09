import { D1Database } from '@cloudflare/workers-types';
import { Order, OrderItem } from '@/types/database';
import { queryDB, queryOne, executeDB } from '../client';
import { generateOrderNumber } from '@/lib/utils';

export async function createOrder(
  db: D1Database,
  orderData: {
    userId?: string;
    email: string;
    paymentMethod?: 'stripe' | 'paypal';
    paymentIntentId?: string;
    subtotal: number;
    shippingCost: number;
    tax: number;
    total: number;
    currency?: string;
    shippingRegionId?: string;
    shippingName: string;
    shippingAddressLine1: string;
    shippingAddressLine2?: string;
    shippingCity: string;
    shippingPostalCode: string;
    shippingCountry: string;
    shippingPhone?: string;
    items: Array<{
      productId: string;
      variantId?: string;
      productName: string;
      variantName?: string;
      sku?: string;
      price: number;
      quantity: number;
    }>;
  }
): Promise<Order> {
  const id = crypto.randomUUID();
  const orderNumber = generateOrderNumber();

  // Create order
  await executeDB(
    db,
    `INSERT INTO orders (
      id, order_number, user_id, email, payment_method, payment_intent_id,
      subtotal, shipping_cost, tax, total, currency, shipping_region_id,
      shipping_name, shipping_address_line1, shipping_address_line2,
      shipping_city, shipping_postal_code, shipping_country, shipping_phone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      orderNumber,
      orderData.userId || null,
      orderData.email,
      orderData.paymentMethod || null,
      orderData.paymentIntentId || null,
      orderData.subtotal,
      orderData.shippingCost,
      orderData.tax,
      orderData.total,
      orderData.currency || 'SEK',
      orderData.shippingRegionId || null,
      orderData.shippingName,
      orderData.shippingAddressLine1,
      orderData.shippingAddressLine2 || null,
      orderData.shippingCity,
      orderData.shippingPostalCode,
      orderData.shippingCountry,
      orderData.shippingPhone || null,
    ]
  );

  // Create order items
  for (const item of orderData.items) {
    const itemId = crypto.randomUUID();
    await executeDB(
      db,
      `INSERT INTO order_items (
        id, order_id, product_id, variant_id, product_name, variant_name,
        sku, price, quantity, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemId,
        id,
        item.productId,
        item.variantId || null,
        item.productName,
        item.variantName || null,
        item.sku || null,
        item.price,
        item.quantity,
        item.price * item.quantity,
      ]
    );
  }

  const order = await getOrderById(db, id);
  if (!order) {
    throw new Error('Failed to create order');
  }

  return order;
}

export async function getOrderById(
  db: D1Database,
  id: string
): Promise<Order | null> {
  return await queryOne<Order>(
    db,
    'SELECT * FROM orders WHERE id = ?',
    [id]
  );
}

export async function getOrderByNumber(
  db: D1Database,
  orderNumber: string
): Promise<Order | null> {
  return await queryOne<Order>(
    db,
    'SELECT * FROM orders WHERE order_number = ?',
    [orderNumber]
  );
}

export async function getOrderItems(
  db: D1Database,
  orderId: string
): Promise<OrderItem[]> {
  const result = await queryDB<OrderItem>(
    db,
    'SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC',
    [orderId]
  );
  return result.results || [];
}

export async function getOrdersByUserId(
  db: D1Database,
  userId: string
): Promise<Order[]> {
  const result = await queryDB<Order>(
    db,
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return result.results || [];
}

export async function updateOrderStatus(
  db: D1Database,
  id: string,
  status: Order['status']
): Promise<void> {
  await executeDB(
    db,
    'UPDATE orders SET status = ?, updated_at = unixepoch() WHERE id = ?',
    [status, id]
  );
}

export async function updatePaymentStatus(
  db: D1Database,
  id: string,
  paymentStatus: Order['payment_status']
): Promise<void> {
  await executeDB(
    db,
    'UPDATE orders SET payment_status = ?, updated_at = unixepoch() WHERE id = ?',
    [paymentStatus, id]
  );
}

export async function updateTrackingNumber(
  db: D1Database,
  id: string,
  trackingNumber: string
): Promise<void> {
  await executeDB(
    db,
    'UPDATE orders SET tracking_number = ?, status = ?, updated_at = unixepoch() WHERE id = ?',
    [trackingNumber, 'shipped', id]
  );
}

