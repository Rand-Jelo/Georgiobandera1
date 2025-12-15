import { D1Database } from '@cloudflare/workers-types';
import { queryDB, queryOne, executeDB } from '../client';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: number;
}

export async function getWishlistItems(
  db: D1Database,
  userId: string
): Promise<WishlistItem[]> {
  const result = await queryDB<WishlistItem>(
    db,
    'SELECT * FROM wishlist WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return result.results || [];
}

export async function getWishlistItem(
  db: D1Database,
  userId: string,
  productId: string
): Promise<WishlistItem | null> {
  return await queryOne<WishlistItem>(
    db,
    'SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
}

export async function addToWishlist(
  db: D1Database,
  userId: string,
  productId: string
): Promise<void> {
  const id = crypto.randomUUID();
  await executeDB(
    db,
    `INSERT INTO wishlist (id, user_id, product_id)
     VALUES (?, ?, ?)`,
    [id, userId, productId]
  );
}

export async function removeFromWishlist(
  db: D1Database,
  userId: string,
  productId: string
): Promise<void> {
  await executeDB(
    db,
    'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
}

export async function isInWishlist(
  db: D1Database,
  userId: string,
  productId: string
): Promise<boolean> {
  const item = await getWishlistItem(db, userId, productId);
  return item !== null;
}

