import { D1Database } from '@cloudflare/workers-types';
import { queryDB, queryOne, executeDB } from '../client';
import type { DiscountCode, DiscountCodeUsage } from '@/types/database';

/**
 * Get all discount codes
 */
export async function getDiscountCodes(
  db: D1Database,
  options: {
    active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<DiscountCode[]> {
  let sql = 'SELECT * FROM discount_codes WHERE 1=1';
  const params: any[] = [];

  if (options.active !== undefined) {
    sql += ' AND active = ?';
    params.push(options.active ? 1 : 0);
  }

  if (options.search) {
    sql += ' AND (code LIKE ? OR description LIKE ?)';
    const searchTerm = `%${options.search}%`;
    params.push(searchTerm, searchTerm);
  }

  sql += ' ORDER BY created_at DESC';

  if (options.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
    if (options.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }
  }

  const result = await queryDB<DiscountCode>(db, sql, params);
  return result.results || [];
}

/**
 * Get discount code by ID
 */
export async function getDiscountCodeById(
  db: D1Database,
  id: string
): Promise<DiscountCode | null> {
  return await queryOne<DiscountCode>(
    db,
    'SELECT * FROM discount_codes WHERE id = ?',
    [id]
  );
}

/**
 * Get discount code by code string
 */
export async function getDiscountCodeByCode(
  db: D1Database,
  code: string
): Promise<DiscountCode | null> {
  return await queryOne<DiscountCode>(
    db,
    'SELECT * FROM discount_codes WHERE code = ?',
    [code.toUpperCase()]
  );
}

/**
 * Validate discount code for a user/order
 */
export async function validateDiscountCode(
  db: D1Database,
  code: string,
  subtotal: number,
  userId?: string | null,
  email?: string
): Promise<{ valid: boolean; discountCode?: DiscountCode; error?: string }> {
  const discountCode = await getDiscountCodeByCode(db, code);

  if (!discountCode) {
    return { valid: false, error: 'Discount code not found' };
  }

  if (!discountCode.active) {
    return { valid: false, error: 'Discount code is inactive' };
  }

  // Check expiry dates
  const now = Math.floor(Date.now() / 1000);
  if (discountCode.valid_from && now < discountCode.valid_from) {
    return { valid: false, error: 'Discount code is not yet valid' };
  }
  if (discountCode.valid_until && now > discountCode.valid_until) {
    return { valid: false, error: 'Discount code has expired' };
  }

  // Check minimum purchase
  if (subtotal < discountCode.minimum_purchase) {
    return {
      valid: false,
      error: `Minimum purchase of ${discountCode.minimum_purchase} SEK required`,
    };
  }

  // Check usage limit
  if (discountCode.usage_limit !== null && discountCode.usage_count >= discountCode.usage_limit) {
    return { valid: false, error: 'Discount code has reached its usage limit' };
  }

  // Check user usage limit
  if (userId || email) {
    let userUsageSql = `
      SELECT COUNT(*) as count
      FROM discount_code_usage
      WHERE discount_code_id = ?
    `;
    const userUsageParams: any[] = [discountCode.id];

    if (userId) {
      userUsageSql += ' AND user_id = ?';
      userUsageParams.push(userId);
    } else if (email) {
      userUsageSql += ' AND email = ?';
      userUsageParams.push(email);
    }

    const userUsageResult = await queryOne<{ count: number }>(
      db,
      userUsageSql,
      userUsageParams
    );

    const userUsageCount = userUsageResult?.count || 0;
    if (userUsageCount >= discountCode.user_usage_limit) {
      return { valid: false, error: 'You have already used this discount code' };
    }
  }

  return { valid: true, discountCode };
}

/**
 * Calculate discount amount
 */
export function calculateDiscountAmount(
  discountCode: DiscountCode,
  subtotal: number
): number {
  let discount = 0;

  if (discountCode.discount_type === 'percentage') {
    discount = (subtotal * discountCode.discount_value) / 100;
    // Apply maximum discount if set
    if (discountCode.maximum_discount !== null && discount > discountCode.maximum_discount) {
      discount = discountCode.maximum_discount;
    }
  } else {
    // Fixed amount
    discount = discountCode.discount_value;
    // Don't allow discount to exceed subtotal
    if (discount > subtotal) {
      discount = subtotal;
    }
  }

  return Math.round(discount * 100) / 100; // Round to 2 decimal places
}

/**
 * Create discount code
 */
export async function createDiscountCode(
  db: D1Database,
  data: {
    code: string;
    description?: string | null;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    minimum_purchase?: number;
    maximum_discount?: number | null;
    usage_limit?: number | null;
    user_usage_limit?: number;
    valid_from?: number | null;
    valid_until?: number | null;
    active?: boolean;
  }
): Promise<DiscountCode> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await executeDB(
    db,
    `INSERT INTO discount_codes (
      id, code, description, discount_type, discount_value,
      minimum_purchase, maximum_discount, usage_limit, usage_count,
      user_usage_limit, valid_from, valid_until, active,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.code.toUpperCase(),
      data.description || null,
      data.discount_type,
      data.discount_value,
      data.minimum_purchase || 0,
      data.maximum_discount || null,
      data.usage_limit || null,
      0,
      data.user_usage_limit || 1,
      data.valid_from || null,
      data.valid_until || null,
      data.active !== false ? 1 : 0,
      now,
      now,
    ]
  );

  const created = await getDiscountCodeById(db, id);
  if (!created) {
    throw new Error('Failed to create discount code');
  }
  return created;
}

/**
 * Update discount code
 */
export async function updateDiscountCode(
  db: D1Database,
  id: string,
  data: {
    code?: string;
    description?: string | null;
    discount_type?: 'percentage' | 'fixed';
    discount_value?: number;
    minimum_purchase?: number;
    maximum_discount?: number | null;
    usage_limit?: number | null;
    user_usage_limit?: number;
    valid_from?: number | null;
    valid_until?: number | null;
    active?: boolean;
  }
): Promise<DiscountCode> {
  const now = Math.floor(Date.now() / 1000);
  const updates: string[] = [];
  const params: any[] = [];

  if (data.code !== undefined) {
    updates.push('code = ?');
    params.push(data.code.toUpperCase());
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }
  if (data.discount_type !== undefined) {
    updates.push('discount_type = ?');
    params.push(data.discount_type);
  }
  if (data.discount_value !== undefined) {
    updates.push('discount_value = ?');
    params.push(data.discount_value);
  }
  if (data.minimum_purchase !== undefined) {
    updates.push('minimum_purchase = ?');
    params.push(data.minimum_purchase);
  }
  if (data.maximum_discount !== undefined) {
    updates.push('maximum_discount = ?');
    params.push(data.maximum_discount);
  }
  if (data.usage_limit !== undefined) {
    updates.push('usage_limit = ?');
    params.push(data.usage_limit);
  }
  if (data.user_usage_limit !== undefined) {
    updates.push('user_usage_limit = ?');
    params.push(data.user_usage_limit);
  }
  if (data.valid_from !== undefined) {
    updates.push('valid_from = ?');
    params.push(data.valid_from);
  }
  if (data.valid_until !== undefined) {
    updates.push('valid_until = ?');
    params.push(data.valid_until);
  }
  if (data.active !== undefined) {
    updates.push('active = ?');
    params.push(data.active ? 1 : 0);
  }

  if (updates.length === 0) {
    const existing = await getDiscountCodeById(db, id);
    if (!existing) {
      throw new Error('Discount code not found');
    }
    return existing;
  }

  updates.push('updated_at = ?');
  params.push(now);
  params.push(id);

  await executeDB(
    db,
    `UPDATE discount_codes SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  const updated = await getDiscountCodeById(db, id);
  if (!updated) {
    throw new Error('Failed to update discount code');
  }
  return updated;
}

/**
 * Delete discount code
 */
export async function deleteDiscountCode(
  db: D1Database,
  id: string
): Promise<void> {
  await executeDB(db, 'DELETE FROM discount_codes WHERE id = ?', [id]);
}

/**
 * Record discount code usage
 */
export async function recordDiscountCodeUsage(
  db: D1Database,
  data: {
    discount_code_id: string;
    order_id: string;
    user_id?: string | null;
    email: string;
    discount_amount: number;
  }
): Promise<void> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // Record usage
  await executeDB(
    db,
    `INSERT INTO discount_code_usage (
      id, discount_code_id, order_id, user_id, email, discount_amount, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.discount_code_id,
      data.order_id,
      data.user_id || null,
      data.email,
      data.discount_amount,
      now,
    ]
  );

  // Increment usage count
  await executeDB(
    db,
    'UPDATE discount_codes SET usage_count = usage_count + 1, updated_at = ? WHERE id = ?',
    [now, data.discount_code_id]
  );
}

/**
 * Get discount code usage history
 */
export async function getDiscountCodeUsage(
  db: D1Database,
  discountCodeId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<DiscountCodeUsage[]> {
  let sql = `
    SELECT * FROM discount_code_usage
    WHERE discount_code_id = ?
    ORDER BY created_at DESC
  `;
  const params: any[] = [discountCodeId];

  if (options.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
    if (options.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }
  }

  const result = await queryDB<DiscountCodeUsage>(db, sql, params);
  return result.results || [];
}

