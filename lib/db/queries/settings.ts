import { D1Database } from '@cloudflare/workers-types';
import { queryOne, executeDB } from '../client';

export interface StoreSettings {
  id: string;
  store_name: string;
  store_email: string;
  store_phone: string | null;
  store_address: string | null;
  store_city: string | null;
  store_postal_code: string | null;
  store_country: string | null;
  currency: string;
  tax_rate: number;
  created_at: number;
  updated_at: number;
}

export interface GeneralSettings {
  id: string;
  maintenance_mode: boolean;
  allow_registrations: boolean;
  default_language: string;
  created_at: number;
  updated_at: number;
}

/**
 * Get store settings (singleton - only one record)
 */
export async function getStoreSettings(db: D1Database): Promise<StoreSettings | null> {
  return await queryOne<StoreSettings>(
    db,
    'SELECT * FROM store_settings ORDER BY created_at ASC LIMIT 1'
  );
}

/**
 * Create or update store settings
 */
export async function upsertStoreSettings(
  db: D1Database,
  settings: {
    store_name: string;
    store_email: string;
    store_phone?: string | null;
    store_address?: string | null;
    store_city?: string | null;
    store_postal_code?: string | null;
    store_country?: string | null;
    currency?: string;
    tax_rate?: number;
  }
): Promise<StoreSettings> {
  const existing = await getStoreSettings(db);
  const now = Math.floor(Date.now() / 1000);

  if (existing) {
    // Update existing
    await executeDB(
      db,
      `UPDATE store_settings SET
        store_name = ?,
        store_email = ?,
        store_phone = ?,
        store_address = ?,
        store_city = ?,
        store_postal_code = ?,
        store_country = ?,
        currency = ?,
        tax_rate = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        settings.store_name,
        settings.store_email,
        settings.store_phone || null,
        settings.store_address || null,
        settings.store_city || null,
        settings.store_postal_code || null,
        settings.store_country || null,
        settings.currency || 'SEK',
        settings.tax_rate || 0,
        now,
        existing.id,
      ]
    );
    return (await getStoreSettings(db))!;
  } else {
    // Create new
    const id = crypto.randomUUID();
    await executeDB(
      db,
      `INSERT INTO store_settings (
        id, store_name, store_email, store_phone, store_address,
        store_city, store_postal_code, store_country, currency, tax_rate,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        settings.store_name,
        settings.store_email,
        settings.store_phone || null,
        settings.store_address || null,
        settings.store_city || null,
        settings.store_postal_code || null,
        settings.store_country || null,
        settings.currency || 'SEK',
        settings.tax_rate || 0,
        now,
        now,
      ]
    );
    return (await getStoreSettings(db))!;
  }
}

/**
 * Get general settings (singleton - only one record)
 */
export async function getGeneralSettings(db: D1Database): Promise<GeneralSettings | null> {
  return await queryOne<GeneralSettings>(
    db,
    'SELECT * FROM general_settings ORDER BY created_at ASC LIMIT 1'
  );
}

/**
 * Create or update general settings
 */
export async function upsertGeneralSettings(
  db: D1Database,
  settings: {
    maintenance_mode?: boolean;
    allow_registrations?: boolean;
    default_language?: string;
  }
): Promise<GeneralSettings> {
  const existing = await getGeneralSettings(db);
  const now = Math.floor(Date.now() / 1000);

  if (existing) {
    // Update existing
    await executeDB(
      db,
      `UPDATE general_settings SET
        maintenance_mode = ?,
        allow_registrations = ?,
        default_language = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        settings.maintenance_mode !== undefined ? (settings.maintenance_mode ? 1 : 0) : existing.maintenance_mode ? 1 : 0,
        settings.allow_registrations !== undefined ? (settings.allow_registrations ? 1 : 0) : existing.allow_registrations ? 1 : 0,
        settings.default_language || existing.default_language || 'en',
        now,
        existing.id,
      ]
    );
    return (await getGeneralSettings(db))!;
  } else {
    // Create new
    const id = crypto.randomUUID();
    await executeDB(
      db,
      `INSERT INTO general_settings (
        id, maintenance_mode, allow_registrations, default_language,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        settings.maintenance_mode ? 1 : 0,
        settings.allow_registrations !== undefined ? (settings.allow_registrations ? 1 : 0) : 1,
        settings.default_language || 'en',
        now,
        now,
      ]
    );
    return (await getGeneralSettings(db))!;
  }
}

