import { D1Database } from '@cloudflare/workers-types';
import { CartItem } from '@/types/database';
import { queryDB, queryOne, executeDB } from '../client';

export async function getCartItems(
  db: D1Database,
  userId?: string,
  sessionId?: string
): Promise<CartItem[]> {
  if (!userId && !sessionId) {
    return [];
  }

  let sql = 'SELECT * FROM cart_items WHERE';
  const params: any[] = [];

  if (userId) {
    sql += ' user_id = ?';
    params.push(userId);
  } else if (sessionId) {
    sql += ' session_id = ?';
    params.push(sessionId);
  }

  sql += ' ORDER BY created_at ASC';

  const result = await queryDB<CartItem>(db, sql, params);
  return result.results || [];
}

export async function addCartItem(
  db: D1Database,
  item: {
    userId?: string;
    sessionId?: string;
    productId: string;
    variantId?: string;
    quantity: number;
  }
): Promise<void> {
  const id = crypto.randomUUID();
  await executeDB(
    db,
    `INSERT INTO cart_items (id, user_id, session_id, product_id, variant_id, quantity)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      item.userId || null,
      item.sessionId || null,
      item.productId,
      item.variantId || null,
      item.quantity,
    ]
  );
}

export async function updateCartItem(
  db: D1Database,
  id: string,
  quantity: number
): Promise<void> {
  await executeDB(
    db,
    'UPDATE cart_items SET quantity = ?, updated_at = unixepoch() WHERE id = ?',
    [quantity, id]
  );
}

export async function removeCartItem(
  db: D1Database,
  id: string
): Promise<void> {
  await executeDB(db, 'DELETE FROM cart_items WHERE id = ?', [id]);
}

export async function clearCart(
  db: D1Database,
  userId?: string,
  sessionId?: string
): Promise<void> {
  if (userId) {
    await executeDB(db, 'DELETE FROM cart_items WHERE user_id = ?', [userId]);
  } else if (sessionId) {
    await executeDB(db, 'DELETE FROM cart_items WHERE session_id = ?', [sessionId]);
  }
}

