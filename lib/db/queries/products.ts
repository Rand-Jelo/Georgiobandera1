import { D1Database } from '@cloudflare/workers-types';
import { Product, ProductVariant, ProductImage, Category } from '@/types/database';
import { queryDB, queryOne, executeDB } from '../client';

export async function getProducts(
  db: D1Database,
  options: {
    categoryId?: string;
    categoryIds?: string[]; // Support multiple category IDs
    status?: 'draft' | 'active' | 'archived';
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Product[]> {
  let sql = 'SELECT DISTINCT * FROM products WHERE 1=1';
  const params: any[] = [];

  if (options.categoryIds && options.categoryIds.length > 0) {
    // Support multiple category IDs
    const placeholders = options.categoryIds.map(() => '?').join(',');
    sql += ` AND category_id IN (${placeholders})`;
    params.push(...options.categoryIds);
  } else if (options.categoryId) {
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

  if (options.search) {
    sql += ' AND (name_en LIKE ? OR name_sv LIKE ? OR slug LIKE ? OR sku LIKE ? OR description_en LIKE ? OR description_sv LIKE ?)';
    const searchTerm = `%${options.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
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

export async function createCategory(
  db: D1Database,
  categoryData: {
    nameEn: string;
    nameSv: string;
    slug: string;
    descriptionEn?: string | null;
    descriptionSv?: string | null;
    imageUrl?: string | null;
    parentId?: string | null;
    sortOrder?: number;
  }
): Promise<Category> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await executeDB(
    db,
    `INSERT INTO categories (
      id, name_en, name_sv, slug, description_en, description_sv,
      image_url, parent_id, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      categoryData.nameEn,
      categoryData.nameSv,
      categoryData.slug,
      categoryData.descriptionEn || null,
      categoryData.descriptionSv || null,
      categoryData.imageUrl || null,
      categoryData.parentId || null,
      categoryData.sortOrder ?? 0,
      now,
      now,
    ]
  );

  const category = await getCategoryById(db, id);
  if (!category) {
    throw new Error('Failed to create category');
  }

  return category;
}

export async function updateCategory(
  db: D1Database,
  id: string,
  categoryData: {
    nameEn?: string;
    nameSv?: string;
    slug?: string;
    descriptionEn?: string | null;
    descriptionSv?: string | null;
    imageUrl?: string | null;
    parentId?: string | null;
    sortOrder?: number;
  }
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const updates: string[] = [];
  const params: any[] = [];

  if (categoryData.nameEn !== undefined) {
    updates.push('name_en = ?');
    params.push(categoryData.nameEn);
  }
  if (categoryData.nameSv !== undefined) {
    updates.push('name_sv = ?');
    params.push(categoryData.nameSv);
  }
  if (categoryData.slug !== undefined) {
    updates.push('slug = ?');
    params.push(categoryData.slug);
  }
  if (categoryData.descriptionEn !== undefined) {
    updates.push('description_en = ?');
    params.push(categoryData.descriptionEn);
  }
  if (categoryData.descriptionSv !== undefined) {
    updates.push('description_sv = ?');
    params.push(categoryData.descriptionSv);
  }
  if (categoryData.imageUrl !== undefined) {
    updates.push('image_url = ?');
    params.push(categoryData.imageUrl);
  }
  if (categoryData.parentId !== undefined) {
    updates.push('parent_id = ?');
    params.push(categoryData.parentId);
  }
  if (categoryData.sortOrder !== undefined) {
    updates.push('sort_order = ?');
    params.push(categoryData.sortOrder);
  }

  if (updates.length === 0) {
    return;
  }

  updates.push('updated_at = ?');
  params.push(now);
  params.push(id);

  await executeDB(
    db,
    `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
}

export async function deleteCategory(
  db: D1Database,
  id: string
): Promise<void> {
  // Check if category has children
  const children = await getCategories(db, id);
  if (children.length > 0) {
    throw new Error('Cannot delete category with subcategories. Please delete or move subcategories first.');
  }

  // Check if category has active products (not archived)
  const products = await queryDB(
    db,
    'SELECT id FROM products WHERE category_id = ? AND status != ? LIMIT 1',
    [id, 'archived']
  );
  if (products.results && products.results.length > 0) {
    throw new Error('Cannot delete category with active products. Please move or archive products first.');
  }

  await executeDB(
    db,
    'DELETE FROM categories WHERE id = ?',
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

export async function createProductVariant(
  db: D1Database,
  variantData: {
    productId: string;
    nameEn?: string | null;
    nameSv?: string | null;
    sku?: string | null;
    price?: number | null;
    compareAtPrice?: number | null;
    stockQuantity?: number;
    trackInventory?: boolean;
    option1Name?: string | null;
    option1Value?: string | null;
    option2Name?: string | null;
    option2Value?: string | null;
    option3Name?: string | null;
    option3Value?: string | null;
  }
): Promise<ProductVariant> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await executeDB(
    db,
    `INSERT INTO product_variants (
      id, product_id, name_en, name_sv, sku, price, compare_at_price,
      stock_quantity, track_inventory, option1_name, option1_value,
      option2_name, option2_value, option3_name, option3_value,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      variantData.productId,
      variantData.nameEn || null,
      variantData.nameSv || null,
      variantData.sku || null,
      variantData.price || null,
      variantData.compareAtPrice || null,
      variantData.stockQuantity ?? 0,
      variantData.trackInventory !== false ? 1 : 0,
      variantData.option1Name || null,
      variantData.option1Value || null,
      variantData.option2Name || null,
      variantData.option2Value || null,
      variantData.option3Name || null,
      variantData.option3Value || null,
      now,
      now,
    ]
  );

  const variant = await getProductVariant(db, id);
  if (!variant) {
    throw new Error('Failed to create product variant');
  }

  return variant;
}

export async function updateProductVariant(
  db: D1Database,
  variantId: string,
  variantData: {
    nameEn?: string | null;
    nameSv?: string | null;
    sku?: string | null;
    price?: number | null;
    compareAtPrice?: number | null;
    stockQuantity?: number;
    trackInventory?: boolean;
    option1Name?: string | null;
    option1Value?: string | null;
    option2Name?: string | null;
    option2Value?: string | null;
    option3Name?: string | null;
    option3Value?: string | null;
  }
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const updates: string[] = [];
  const params: any[] = [];

  if (variantData.nameEn !== undefined) {
    updates.push('name_en = ?');
    params.push(variantData.nameEn);
  }
  if (variantData.nameSv !== undefined) {
    updates.push('name_sv = ?');
    params.push(variantData.nameSv);
  }
  if (variantData.sku !== undefined) {
    updates.push('sku = ?');
    params.push(variantData.sku);
  }
  if (variantData.price !== undefined) {
    updates.push('price = ?');
    params.push(variantData.price);
  }
  if (variantData.compareAtPrice !== undefined) {
    updates.push('compare_at_price = ?');
    params.push(variantData.compareAtPrice);
  }
  if (variantData.stockQuantity !== undefined) {
    updates.push('stock_quantity = ?');
    params.push(variantData.stockQuantity);
  }
  if (variantData.trackInventory !== undefined) {
    updates.push('track_inventory = ?');
    params.push(variantData.trackInventory ? 1 : 0);
  }
  if (variantData.option1Name !== undefined) {
    updates.push('option1_name = ?');
    params.push(variantData.option1Name);
  }
  if (variantData.option1Value !== undefined) {
    updates.push('option1_value = ?');
    params.push(variantData.option1Value);
  }
  if (variantData.option2Name !== undefined) {
    updates.push('option2_name = ?');
    params.push(variantData.option2Name);
  }
  if (variantData.option2Value !== undefined) {
    updates.push('option2_value = ?');
    params.push(variantData.option2Value);
  }
  if (variantData.option3Name !== undefined) {
    updates.push('option3_name = ?');
    params.push(variantData.option3Name);
  }
  if (variantData.option3Value !== undefined) {
    updates.push('option3_value = ?');
    params.push(variantData.option3Value);
  }

  if (updates.length === 0) {
    return;
  }

  updates.push('updated_at = ?');
  params.push(now);
  params.push(variantId);

  await executeDB(
    db,
    `UPDATE product_variants SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
}

export async function deleteProductVariant(
  db: D1Database,
  variantId: string
): Promise<void> {
  await executeDB(
    db,
    'DELETE FROM product_variants WHERE id = ?',
    [variantId]
  );
}

export async function deleteProductVariants(
  db: D1Database,
  productId: string
): Promise<void> {
  await executeDB(
    db,
    'DELETE FROM product_variants WHERE product_id = ?',
    [productId]
  );
}

export async function createProductImage(
  db: D1Database,
  imageData: {
    productId: string;
    variantId?: string | null;
    url: string;
    altTextEn?: string | null;
    altTextSv?: string | null;
    sortOrder?: number;
  }
): Promise<ProductImage> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await executeDB(
    db,
    `INSERT INTO product_images (
      id, product_id, variant_id, url, alt_text_en, alt_text_sv, sort_order, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      imageData.productId,
      imageData.variantId || null,
      imageData.url,
      imageData.altTextEn || null,
      imageData.altTextSv || null,
      imageData.sortOrder ?? 0,
      now,
    ]
  );

  const result = await queryOne<ProductImage>(
    db,
    'SELECT * FROM product_images WHERE id = ?',
    [id]
  );

  if (!result) {
    throw new Error('Failed to create product image');
  }

  return result;
}

export async function updateProductImage(
  db: D1Database,
  imageId: string,
  imageData: {
    url?: string;
    altTextEn?: string | null;
    altTextSv?: string | null;
    sortOrder?: number;
  }
): Promise<void> {
  const updates: string[] = [];
  const params: any[] = [];

  if (imageData.url !== undefined) {
    updates.push('url = ?');
    params.push(imageData.url);
  }
  if (imageData.altTextEn !== undefined) {
    updates.push('alt_text_en = ?');
    params.push(imageData.altTextEn);
  }
  if (imageData.altTextSv !== undefined) {
    updates.push('alt_text_sv = ?');
    params.push(imageData.altTextSv);
  }
  if (imageData.sortOrder !== undefined) {
    updates.push('sort_order = ?');
    params.push(imageData.sortOrder);
  }

  if (updates.length === 0) {
    return;
  }

  params.push(imageId);

  await executeDB(
    db,
    `UPDATE product_images SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
}

export async function deleteProductImage(
  db: D1Database,
  imageId: string
): Promise<void> {
  await executeDB(
    db,
    'DELETE FROM product_images WHERE id = ?',
    [imageId]
  );
}

export async function getProductImageById(
  db: D1Database,
  imageId: string
): Promise<ProductImage | null> {
  return await queryOne<ProductImage>(
    db,
    'SELECT * FROM product_images WHERE id = ?',
    [imageId]
  );
}

