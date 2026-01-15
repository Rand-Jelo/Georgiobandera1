import { D1Database } from '@cloudflare/workers-types';
import { queryDB, queryOne, executeDB } from '../client';

export interface ProductCollection {
  id: string;
  product_id: string;
  collection_id: string;
  sort_order: number;
  created_at: number;
}

/**
 * Get all collections for a product
 */
export async function getProductCollections(
  db: D1Database,
  productId: string
): Promise<string[]> {
  const result = await queryDB<{ collection_id: string }>(
    db,
    'SELECT collection_id FROM product_collections WHERE product_id = ? ORDER BY sort_order ASC',
    [productId]
  );
  return (result.results || []).map((row) => row.collection_id);
}

/**
 * Get all products in a collection
 */
export async function getCollectionProducts(
  db: D1Database,
  collectionId: string
): Promise<string[]> {
  const result = await queryDB<{ product_id: string }>(
    db,
    'SELECT product_id FROM product_collections WHERE collection_id = ? ORDER BY sort_order ASC',
    [collectionId]
  );
  return (result.results || []).map((row) => row.product_id);
}

/**
 * Set collections for a product (replaces existing)
 */
export async function setProductCollections(
  db: D1Database,
  productId: string,
  collectionIds: string[]
): Promise<void> {
  // Delete existing relationships
  await executeDB(
    db,
    'DELETE FROM product_collections WHERE product_id = ?',
    [productId]
  );

  // Insert new relationships
  const now = Date.now();
  for (let i = 0; i < collectionIds.length; i++) {
    const id = `pc-${productId}-${collectionIds[i]}-${now}-${i}`;
    await executeDB(
      db,
      'INSERT INTO product_collections (id, product_id, collection_id, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, productId, collectionIds[i], i, now]
    );
  }
}

/**
 * Add a product to a collection
 */
export async function addProductToCollection(
  db: D1Database,
  productId: string,
  collectionId: string,
  sortOrder?: number
): Promise<void> {
  // Check if relationship already exists
  const existing = await queryOne<{ id: string }>(
    db,
    'SELECT id FROM product_collections WHERE product_id = ? AND collection_id = ?',
    [productId, collectionId]
  );

  if (existing) {
    // Update sort order if provided
    if (sortOrder !== undefined) {
      await executeDB(
        db,
        'UPDATE product_collections SET sort_order = ? WHERE id = ?',
        [sortOrder, existing.id]
      );
    }
    return;
  }

  // Get max sort order for this collection
  const maxSortResult = await queryOne<{ max_sort: number }>(
    db,
    'SELECT COALESCE(MAX(sort_order), -1) as max_sort FROM product_collections WHERE collection_id = ?',
    [collectionId]
  );
  const newSortOrder = sortOrder ?? (maxSortResult?.max_sort ?? -1) + 1;

  const id = `pc-${productId}-${collectionId}-${Date.now()}`;
  await executeDB(
    db,
    'INSERT INTO product_collections (id, product_id, collection_id, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, productId, collectionId, newSortOrder, Date.now()]
  );
}

/**
 * Remove a product from a collection
 */
export async function removeProductFromCollection(
  db: D1Database,
  productId: string,
  collectionId: string
): Promise<void> {
  await executeDB(
    db,
    'DELETE FROM product_collections WHERE product_id = ? AND collection_id = ?',
    [productId, collectionId]
  );
}

