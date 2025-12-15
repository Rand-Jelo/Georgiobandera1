import { D1Database } from '@cloudflare/workers-types';
import { queryDB, queryOne, executeDB } from '../client';

export interface PriceAlert {
  id: string;
  user_id: string;
  product_id: string;
  target_price: number;
  current_price: number;
  notified: boolean;
  created_at: number;
}

export async function getPriceAlert(
  db: D1Database,
  userId: string,
  productId: string
): Promise<PriceAlert | null> {
  return await queryOne<PriceAlert>(
    db,
    'SELECT * FROM price_alerts WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
}

export async function createPriceAlert(
  db: D1Database,
  userId: string,
  productId: string,
  targetPrice: number,
  currentPrice: number
): Promise<void> {
  const id = crypto.randomUUID();
  await executeDB(
    db,
    `INSERT INTO price_alerts (id, user_id, product_id, target_price, current_price)
     VALUES (?, ?, ?, ?, ?)`,
    [id, userId, productId, targetPrice, currentPrice]
  );
}

export async function deletePriceAlert(
  db: D1Database,
  userId: string,
  productId: string
): Promise<void> {
  await executeDB(
    db,
    'DELETE FROM price_alerts WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
}

export async function getPriceAlertsForProduct(
  db: D1Database,
  productId: string
): Promise<PriceAlert[]> {
  const result = await queryDB<PriceAlert>(
    db,
    'SELECT * FROM price_alerts WHERE product_id = ? AND notified = 0',
    [productId]
  );
  return result.results || [];
}

