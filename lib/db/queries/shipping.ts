import { D1Database } from '@cloudflare/workers-types';
import { ShippingRegion } from '@/types/database';
import { queryDB, queryOne, executeDB } from '../client';

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

  const result = await queryDB<any>(db, sql, params);
  const regions = result.results || [];
  
  // Parse countries JSON for each region
  return regions.map((region: any) => ({
    ...region,
    countries: region.countries ? JSON.parse(region.countries) : [],
  })) as ShippingRegion[];
}

export async function getShippingRegionByCode(
  db: D1Database,
  code: string
): Promise<ShippingRegion | null> {
  const region = await queryOne<any>(
    db,
    'SELECT * FROM shipping_regions WHERE code = ? AND active = 1',
    [code]
  );
  
  if (!region) return null;
  
  return {
    ...region,
    countries: region.countries ? JSON.parse(region.countries) : [],
  } as ShippingRegion;
}

export async function getShippingRegionById(
  db: D1Database,
  id: string
): Promise<ShippingRegion | null> {
  const region = await queryOne<any>(
    db,
    'SELECT * FROM shipping_regions WHERE id = ?',
    [id]
  );
  
  if (!region) return null;
  
  return {
    ...region,
    countries: region.countries ? JSON.parse(region.countries) : [],
  } as ShippingRegion;
}

/**
 * Find shipping region by country code
 * Checks if the country is in any region's countries array
 * If no match found, returns the region with empty countries array (WORLD region)
 */
export async function getShippingRegionByCountry(
  db: D1Database,
  countryCode: string
): Promise<ShippingRegion | null> {
  // Get all active regions
  const regions = await getShippingRegions(db, true);
  
  // First, try to find a region where the country code matches exactly
  // (for single-country regions like SE)
  const exactMatch = regions.find(r => r.countries.length === 1 && r.countries[0] === countryCode);
  if (exactMatch) {
    return exactMatch;
  }
  
  // Then, try to find a region that includes this country in its countries array
  const regionMatch = regions.find(r => r.countries.includes(countryCode));
  if (regionMatch) {
    return regionMatch;
  }
  
  // If no match, return the region with empty countries array (WORLD/fallback region)
  const worldRegion = regions.find(r => r.countries.length === 0);
  if (worldRegion) {
    return worldRegion;
  }
  
  // Last resort: return the first active region
  return regions.length > 0 ? regions[0] : null;
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

/**
 * Create a new shipping region
 */
export async function createShippingRegion(
  db: D1Database,
  regionData: {
    name_en: string;
    name_sv: string;
    code: string;
    base_price: number;
    free_shipping_threshold?: number | null;
    active?: boolean;
    countries?: string[];
  }
): Promise<ShippingRegion> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const countriesJson = JSON.stringify(regionData.countries || []);

  await executeDB(
    db,
    `INSERT INTO shipping_regions (
      id, name_en, name_sv, code, base_price, free_shipping_threshold, active, countries,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      regionData.name_en,
      regionData.name_sv,
      regionData.code,
      regionData.base_price,
      regionData.free_shipping_threshold || null,
      regionData.active !== undefined ? (regionData.active ? 1 : 0) : 1,
      countriesJson,
      now,
      now,
    ]
  );

  const region = await getShippingRegionById(db, id);
  if (!region) {
    throw new Error('Failed to create shipping region');
  }

  return region;
}

/**
 * Update a shipping region
 */
export async function updateShippingRegion(
  db: D1Database,
  id: string,
  regionData: {
    name_en?: string;
    name_sv?: string;
    code?: string;
    base_price?: number;
    free_shipping_threshold?: number | null;
    active?: boolean;
    countries?: string[];
  }
): Promise<ShippingRegion> {
  const existing = await getShippingRegionById(db, id);
  if (!existing) {
    throw new Error('Shipping region not found');
  }

  const now = Math.floor(Date.now() / 1000);
  const countriesJson = regionData.countries !== undefined 
    ? JSON.stringify(regionData.countries) 
    : JSON.stringify(existing.countries);

  await executeDB(
    db,
    `UPDATE shipping_regions SET
      name_en = ?,
      name_sv = ?,
      code = ?,
      base_price = ?,
      free_shipping_threshold = ?,
      active = ?,
      countries = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      regionData.name_en ?? existing.name_en,
      regionData.name_sv ?? existing.name_sv,
      regionData.code ?? existing.code,
      regionData.base_price ?? existing.base_price,
      regionData.free_shipping_threshold !== undefined ? regionData.free_shipping_threshold : existing.free_shipping_threshold,
      regionData.active !== undefined ? (regionData.active ? 1 : 0) : existing.active ? 1 : 0,
      countriesJson,
      now,
      id,
    ]
  );

  const updated = await getShippingRegionById(db, id);
  if (!updated) {
    throw new Error('Failed to update shipping region');
  }

  return updated;
}

/**
 * Delete a shipping region
 */
export async function deleteShippingRegion(
  db: D1Database,
  id: string
): Promise<void> {
  await executeDB(
    db,
    'DELETE FROM shipping_regions WHERE id = ?',
    [id]
  );
}

