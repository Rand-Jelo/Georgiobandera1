import { D1Database } from '@cloudflare/workers-types';
import { Product, ProductVariant, ProductImage, Category } from '@/types/database';
import { queryDB, queryOne, executeDB } from '../client';

export async function getProducts(
  db: D1Database,
  options: {
    categoryId?: string;
    status?: 'draft' | 'active' | 'archived';
    featured?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Product[]> {
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];

  if (options.categoryId) {
    sql += ' AND category_id = ?';
    params.push(options.categoryId);
  }

  if (options.status) {
    sql += ' AND status = ?';
    params.push(options.status);
  }

  if (options.featured !== undefined) {
    sql += ' AND featured = ?';
    params.push(options.featured ? 1 : 0);
  }

  sql += ' ORDER BY created_at DESC';

  if (options.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }

  if (options.offset) {
    sql += ' OFFSET ?';
    params.push(options.offset);
  }

  const result = await queryDB<Product>(db, sql, params);
  return result.results || [];
}

export async function getProductBySlug(
  db: D1Database,
  slug: string
): Promise<Product | null> {
  return await queryOne<Product>(
    db,
    'SELECT * FROM products WHERE slug = ?',
    [slug]
  );
}

export async function getProductById(
  db: D1Database,
  id: string
): Promise<Product | null> {
  return await queryOne<Product>(
    db,
    'SELECT * FROM products WHERE id = ?',
    [id]
  );
}

export async function getProductVariants(
  db: D1Database,
  productId: string
): Promise<ProductVariant[]> {
  const result = await queryDB<ProductVariant>(
    db,
    'SELECT * FROM product_variants WHERE product_id = ? ORDER BY created_at ASC',
    [productId]
  );
  return result.results || [];
}

export async function getProductImages(
  db: D1Database,
  productId: string,
  variantId?: string
): Promise<ProductImage[]> {
  let sql = 'SELECT * FROM product_images WHERE product_id = ?';
  const params: any[] = [productId];

  if (variantId) {
    sql += ' AND (variant_id = ? OR variant_id IS NULL)';
    params.push(variantId);
  }

  sql += ' ORDER BY sort_order ASC, created_at ASC';

  const result = await queryDB<ProductImage>(db, sql, params);
  return result.results || [];
}

export async function getCategories(
  db: D1Database,
  parentId?: string | null
): Promise<Category[]> {
  let sql = 'SELECT * FROM categories WHERE 1=1';
  const params: any[] = [];

  if (parentId === null) {
    sql += ' AND parent_id IS NULL';
  } else if (parentId) {
    sql += ' AND parent_id = ?';
    params.push(parentId);
  }

  sql += ' ORDER BY sort_order ASC, name_en ASC';

  const result = await queryDB<Category>(db, sql, params);
  return result.results || [];
}

export async function getCategoryBySlug(
  db: D1Database,
  slug: string
): Promise<Category | null> {
  return await queryOne<Category>(
    db,
    'SELECT * FROM categories WHERE slug = ?',
    [slug]
  );
}

export async function getCategoryById(
  db: D1Database,
  id: string
): Promise<Category | null> {
  return await queryOne<Category>(
    db,
    'SELECT * FROM categories WHERE id = ?',
    [id]
  );
}

export async function getProductVariant(
  db: D1Database,
  variantId: string
): Promise<ProductVariant | null> {
  return await queryOne<ProductVariant>(
    db,
    'SELECT * FROM product_variants WHERE id = ?',
    [variantId]
  );
}

