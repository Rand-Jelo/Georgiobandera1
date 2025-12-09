import { D1Database } from '@cloudflare/workers-types';
import { ShippingRegion } from '@/types/database';
import { queryDB, queryOne } from '../client';

export async function getShippingRegions(
  db: D1Database,
  activeOnly: boolean = true
): Promise<ShippingRegion[]> {
  let sql = 'SELECT * FROM shipping_regions';
  const params: any[] = [];

  if (activeOnly) {
    sql += ' WHERE active = 1';
  }

  sql += ' ORDER BY name_en ASC';

  const result = await queryDB<ShippingRegion>(db, sql, params);
  return result.results || [];
}

export async function getShippingRegionByCode(
  db: D1Database,
  code: string
): Promise<ShippingRegion | null> {
  return await queryOne<ShippingRegion>(
    db,
    'SELECT * FROM shipping_regions WHERE code = ? AND active = 1',
    [code]
  );
}

export async function getShippingRegionById(
  db: D1Database,
  id: string
): Promise<ShippingRegion | null> {
  return await queryOne<ShippingRegion>(
    db,
    'SELECT * FROM shipping_regions WHERE id = ?',
    [id]
  );
}

export function calculateShippingCost(
  region: ShippingRegion,
  subtotal: number
): number {
  // Check if free shipping threshold is met
  if (
    region.free_shipping_threshold &&
    subtotal >= region.free_shipping_threshold
  ) {
    return 0;
  }

  return region.base_price;
}

