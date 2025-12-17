import { D1Database } from '@cloudflare/workers-types';
import { queryDB, queryOne, executeDB } from '../client';

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string | null;
  first_name: string;
  last_name: string;
  company: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: number; // SQLite boolean (0 or 1)
  created_at: number;
  updated_at: number;
}

export async function getAddressesByUserId(
  db: D1Database,
  userId: string
): Promise<SavedAddress[]> {
  const result = await queryDB<SavedAddress>(
    db,
    'SELECT * FROM saved_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
  return result.results || [];
}

export async function getAddressById(
  db: D1Database,
  addressId: string,
  userId: string
): Promise<SavedAddress | null> {
  return await queryOne<SavedAddress>(
    db,
    'SELECT * FROM saved_addresses WHERE id = ? AND user_id = ?',
    [addressId, userId]
  );
}

export async function getDefaultAddress(
  db: D1Database,
  userId: string
): Promise<SavedAddress | null> {
  return await queryOne<SavedAddress>(
    db,
    'SELECT * FROM saved_addresses WHERE user_id = ? AND is_default = 1 LIMIT 1',
    [userId]
  );
}

export async function createAddress(
  db: D1Database,
  userId: string,
  addressData: {
    label?: string;
    first_name: string;
    last_name: string;
    company?: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state_province?: string;
    postal_code: string;
    country: string;
    phone?: string;
    is_default?: boolean;
  }
): Promise<SavedAddress> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // If this is set as default, unset other defaults
  if (addressData.is_default) {
    await executeDB(
      db,
      'UPDATE saved_addresses SET is_default = 0 WHERE user_id = ?',
      [userId]
    );
  }

  await executeDB(
    db,
    `INSERT INTO saved_addresses (
      id, user_id, label, first_name, last_name, company,
      address_line1, address_line2, city, state_province,
      postal_code, country, phone, is_default, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      addressData.label || null,
      addressData.first_name,
      addressData.last_name,
      addressData.company || null,
      addressData.address_line1,
      addressData.address_line2 || null,
      addressData.city,
      addressData.state_province || null,
      addressData.postal_code,
      addressData.country,
      addressData.phone || null,
      addressData.is_default ? 1 : 0,
      now,
      now,
    ]
  );

  const address = await getAddressById(db, id, userId);
  if (!address) {
    throw new Error('Failed to create address');
  }

  return address;
}

export async function updateAddress(
  db: D1Database,
  addressId: string,
  userId: string,
  updates: {
    label?: string;
    first_name?: string;
    last_name?: string;
    company?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state_province?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    is_default?: boolean;
  }
): Promise<void> {
  // If setting as default, unset other defaults
  if (updates.is_default) {
    await executeDB(
      db,
      'UPDATE saved_addresses SET is_default = 0 WHERE user_id = ? AND id != ?',
      [userId, addressId]
    );
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.label !== undefined) {
    fields.push('label = ?');
    values.push(updates.label || null);
  }
  if (updates.first_name !== undefined) {
    fields.push('first_name = ?');
    values.push(updates.first_name);
  }
  if (updates.last_name !== undefined) {
    fields.push('last_name = ?');
    values.push(updates.last_name);
  }
  if (updates.company !== undefined) {
    fields.push('company = ?');
    values.push(updates.company || null);
  }
  if (updates.address_line1 !== undefined) {
    fields.push('address_line1 = ?');
    values.push(updates.address_line1);
  }
  if (updates.address_line2 !== undefined) {
    fields.push('address_line2 = ?');
    values.push(updates.address_line2 || null);
  }
  if (updates.city !== undefined) {
    fields.push('city = ?');
    values.push(updates.city);
  }
  if (updates.state_province !== undefined) {
    fields.push('state_province = ?');
    values.push(updates.state_province || null);
  }
  if (updates.postal_code !== undefined) {
    fields.push('postal_code = ?');
    values.push(updates.postal_code);
  }
  if (updates.country !== undefined) {
    fields.push('country = ?');
    values.push(updates.country);
  }
  if (updates.phone !== undefined) {
    fields.push('phone = ?');
    values.push(updates.phone || null);
  }
  if (updates.is_default !== undefined) {
    fields.push('is_default = ?');
    values.push(updates.is_default ? 1 : 0);
  }

  if (fields.length === 0) {
    return;
  }

  fields.push('updated_at = unixepoch()');
  values.push(addressId, userId);

  await executeDB(
    db,
    `UPDATE saved_addresses SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );
}

export async function deleteAddress(
  db: D1Database,
  addressId: string,
  userId: string
): Promise<void> {
  await executeDB(
    db,
    'DELETE FROM saved_addresses WHERE id = ? AND user_id = ?',
    [addressId, userId]
  );
}

