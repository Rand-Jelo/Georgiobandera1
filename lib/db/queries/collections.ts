import { D1Database } from '@cloudflare/workers-types';
import { queryOne, queryDB, executeDB } from '../client';

export interface Collection {
  id: string;
  name_en: string;
  name_sv: string;
  description_en: string | null;
  description_sv: string | null;
  href: string;
  image_url: string | null;
  sort_order: number;
  active: number;
  created_at: number;
  updated_at: number;
}

/**
 * Get all active collections ordered by sort_order
 */
export async function getActiveCollections(
  db: D1Database
): Promise<Collection[]> {
  const result = await queryDB<Collection>(
    db,
    'SELECT * FROM collections WHERE active = 1 ORDER BY sort_order ASC'
  );
  return result.results || [];
}

/**
 * Get all collections (admin)
 */
export async function getAllCollections(
  db: D1Database
): Promise<Collection[]> {
  const result = await queryDB<Collection>(
    db,
    'SELECT * FROM collections ORDER BY sort_order ASC'
  );
  return result.results || [];
}

/**
 * Get collection by ID
 */
export async function getCollectionById(
  db: D1Database,
  id: string
): Promise<Collection | null> {
  return await queryOne<Collection>(
    db,
    'SELECT * FROM collections WHERE id = ?',
    [id]
  );
}

/**
 * Create a new collection
 */
export async function createCollection(
  db: D1Database,
  collection: {
    name_en: string;
    name_sv: string;
    description_en?: string | null;
    description_sv?: string | null;
    href?: string;
    image_url?: string | null;
    sort_order?: number;
    active?: number;
  }
): Promise<Collection> {
  const id = `collection-${Date.now()}`;
  const now = Date.now();
  const sortOrder = collection.sort_order ?? 0;
  const active = collection.active ?? 1;
  // Auto-generate href based on collection ID - this will link to /shop?collection=ID
  const href = collection.href || `/shop?collection=${id}`;

  await executeDB(
    db,
    `INSERT INTO collections (
      id, name_en, name_sv, description_en, description_sv,
      href, image_url, sort_order, active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      collection.name_en,
      collection.name_sv,
      collection.description_en ?? null,
      collection.description_sv ?? null,
      href,
      collection.image_url ?? null,
      sortOrder,
      active,
      now,
      now,
    ]
  );

  const created = await getCollectionById(db, id);
  if (!created) {
    throw new Error('Failed to create collection');
  }
  return created;
}

/**
 * Update a collection
 */
export async function updateCollection(
  db: D1Database,
  id: string,
  updates: {
    name_en?: string;
    name_sv?: string;
    description_en?: string | null;
    description_sv?: string | null;
    href?: string;
    image_url?: string | null;
    sort_order?: number;
    active?: number;
  }
): Promise<Collection> {
  const now = Date.now();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name_en !== undefined) {
    fields.push('name_en = ?');
    values.push(updates.name_en);
  }
  if (updates.name_sv !== undefined) {
    fields.push('name_sv = ?');
    values.push(updates.name_sv);
  }
  if (updates.description_en !== undefined) {
    fields.push('description_en = ?');
    values.push(updates.description_en);
  }
  if (updates.description_sv !== undefined) {
    fields.push('description_sv = ?');
    values.push(updates.description_sv);
  }
  if (updates.href !== undefined) {
    fields.push('href = ?');
    values.push(updates.href);
  }
  if (updates.image_url !== undefined) {
    fields.push('image_url = ?');
    values.push(updates.image_url);
  }
  if (updates.sort_order !== undefined) {
    fields.push('sort_order = ?');
    values.push(updates.sort_order);
  }
  if (updates.active !== undefined) {
    fields.push('active = ?');
    values.push(updates.active);
  }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await executeDB(
    db,
    `UPDATE collections SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  const updated = await getCollectionById(db, id);
  if (!updated) {
    throw new Error('Failed to update collection');
  }
  return updated;
}

/**
 * Delete a collection
 */
export async function deleteCollection(
  db: D1Database,
  id: string
): Promise<void> {
  await executeDB(db, 'DELETE FROM collections WHERE id = ?', [id]);
}

/**
 * Reorder collections
 */
export async function reorderCollections(
  db: D1Database,
  collectionIds: string[]
): Promise<void> {
  const now = Date.now();
  for (let i = 0; i < collectionIds.length; i++) {
    await executeDB(
      db,
      'UPDATE collections SET sort_order = ?, updated_at = ? WHERE id = ?',
      [i, now, collectionIds[i]]
    );
  }
}

