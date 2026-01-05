import { D1Database } from '@cloudflare/workers-types';
import { queryDB, queryOne, executeDB } from '../client';

export interface HeroImage {
  id: string;
  url: string;
  alt_text_en: string | null;
  alt_text_sv: string | null;
  sort_order: number;
  active: number; // 0 or 1
  created_at: number;
  updated_at: number;
}

/**
 * Get all active hero images, ordered by sort_order
 */
export async function getHeroImages(
  db: D1Database,
  activeOnly: boolean = true
): Promise<HeroImage[]> {
  let sql = 'SELECT * FROM hero_images';
  const params: any[] = [];

  if (activeOnly) {
    sql += ' WHERE active = 1';
  }

  sql += ' ORDER BY sort_order ASC, created_at ASC';

  const result = await queryDB<HeroImage>(db, sql, params);
  return result.results || [];
}

/**
 * Get a single hero image by ID
 */
export async function getHeroImageById(
  db: D1Database,
  id: string
): Promise<HeroImage | null> {
  const sql = 'SELECT * FROM hero_images WHERE id = ?';
  const result = await queryOne<HeroImage>(db, sql, [id]);
  return result;
}

/**
 * Create a new hero image
 */
export async function createHeroImage(
  db: D1Database,
  data: {
    id: string;
    url: string;
    alt_text_en?: string | null;
    alt_text_sv?: string | null;
    sort_order?: number;
    active?: boolean;
  }
): Promise<HeroImage> {
  const now = Math.floor(Date.now() / 1000);
  const sortOrder = data.sort_order ?? 0;
  const active = data.active !== false ? 1 : 0;

  const sql = `
    INSERT INTO hero_images (id, url, alt_text_en, alt_text_sv, sort_order, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeDB(db, sql, [
    data.id,
    data.url,
    data.alt_text_en || null,
    data.alt_text_sv || null,
    sortOrder,
    active,
    now,
    now,
  ]);

  const image = await getHeroImageById(db, data.id);
  if (!image) {
    throw new Error('Failed to create hero image');
  }

  return image;
}

/**
 * Update a hero image
 */
export async function updateHeroImage(
  db: D1Database,
  id: string,
  data: {
    url?: string;
    alt_text_en?: string | null;
    alt_text_sv?: string | null;
    sort_order?: number;
    active?: boolean;
  }
): Promise<HeroImage> {
  const now = Math.floor(Date.now() / 1000);
  const updates: string[] = [];
  const params: any[] = [];

  if (data.url !== undefined) {
    updates.push('url = ?');
    params.push(data.url);
  }

  if (data.alt_text_en !== undefined) {
    updates.push('alt_text_en = ?');
    params.push(data.alt_text_en);
  }

  if (data.alt_text_sv !== undefined) {
    updates.push('alt_text_sv = ?');
    params.push(data.alt_text_sv);
  }

  if (data.sort_order !== undefined) {
    updates.push('sort_order = ?');
    params.push(data.sort_order);
  }

  if (data.active !== undefined) {
    updates.push('active = ?');
    params.push(data.active ? 1 : 0);
  }

  if (updates.length === 0) {
    const image = await getHeroImageById(db, id);
    if (!image) {
      throw new Error('Hero image not found');
    }
    return image;
  }

  updates.push('updated_at = ?');
  params.push(now);
  params.push(id);

  const sql = `UPDATE hero_images SET ${updates.join(', ')} WHERE id = ?`;
  await executeDB(db, sql, params);

  const image = await getHeroImageById(db, id);
  if (!image) {
    throw new Error('Hero image not found');
  }

  return image;
}

/**
 * Delete a hero image
 */
export async function deleteHeroImage(
  db: D1Database,
  id: string
): Promise<void> {
  const sql = 'DELETE FROM hero_images WHERE id = ?';
  await executeDB(db, sql, [id]);
}

/**
 * Reorder hero images
 */
export async function reorderHeroImages(
  db: D1Database,
  imageIds: string[]
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  
  // Update sort_order for each image
  for (let i = 0; i < imageIds.length; i++) {
    const sql = 'UPDATE hero_images SET sort_order = ?, updated_at = ? WHERE id = ?';
    await executeDB(db, sql, [i, now, imageIds[i]]);
  }
}

