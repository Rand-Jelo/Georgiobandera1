import { D1Database } from '@cloudflare/workers-types';
import { queryDB, queryOne, executeDB } from '../client';

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  message: string | null;
  created_at: number;
}

/**
 * Add a status update to order history
 */
export async function addOrderStatusHistory(
  db: D1Database,
  orderId: string,
  status: string,
  message?: string
): Promise<OrderStatusHistory> {
  const id = crypto.randomUUID();
  
  await executeDB(
    db,
    `INSERT INTO order_status_history (id, order_id, status, message, created_at)
     VALUES (?, ?, ?, ?, unixepoch())`,
    [id, orderId, status, message || null]
  );

  const history = await queryOne<OrderStatusHistory>(
    db,
    'SELECT * FROM order_status_history WHERE id = ?',
    [id]
  );

  if (!history) {
    throw new Error('Failed to create order status history');
  }

  return history;
}

/**
 * Get order status history
 */
export async function getOrderStatusHistory(
  db: D1Database,
  orderId: string
): Promise<OrderStatusHistory[]> {
  const result = await queryDB<OrderStatusHistory>(
    db,
    'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC',
    [orderId]
  );
  return result.results || [];
}

/**
 * Get latest order status
 */
export async function getLatestOrderStatus(
  db: D1Database,
  orderId: string
): Promise<OrderStatusHistory | null> {
  return await queryOne<OrderStatusHistory>(
    db,
    'SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
    [orderId]
  );
}

