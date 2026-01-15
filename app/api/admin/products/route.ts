import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { executeDB, queryOne } from '@/lib/db/client';
import { createProductVariant } from '@/lib/db/queries/products';
import { setProductCollections } from '@/lib/db/queries/product-collections';
import type { Product } from '@/types/database';

const variantSchema = z.object({
  name_en: z.string().nullable().optional(),
  name_sv: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  compare_at_price: z.number().nullable().optional(),
  stock_quantity: z.number().int().min(0).default(0),
  track_inventory: z.boolean().default(true),
  option1_name: z.string().nullable().optional(),
  option1_value: z.string().nullable().optional(),
  option2_name: z.string().nullable().optional(),
  option2_value: z.string().nullable().optional(),
  option3_name: z.string().nullable().optional(),
  option3_value: z.string().nullable().optional(),
});

const createProductSchema = z.object({
  name_en: z.string().min(1),
  name_sv: z.string().min(1),
  slug: z.string().min(1),
  description_en: z.string().optional(),
  description_sv: z.string().optional(),
  category_id: z.string().nullable().optional(),
  price: z.number().positive(),
  compare_at_price: z.number().positive().nullable().optional(),
  sku: z.string().nullable().optional(),
  status: z.enum(['draft', 'active', 'archived']),
  featured: z.boolean().default(false),
  stock_quantity: z.number().int().min(0).default(0),
  track_inventory: z.boolean().default(true),
  variants: z.array(variantSchema).optional().default([]),
  collection_ids: z.array(z.string()).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const db = getDB();
    const user = await getUserById(db, session.userId);
    
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Creating product with data:', JSON.stringify(body, null, 2));
    
    const validated = createProductSchema.parse(body);
    console.log('Validated product data:', JSON.stringify(validated, null, 2));

    // Check if slug already exists (only for active products, not archived)
    let existingProduct: Product | null = null;
    try {
      existingProduct = await queryOne<Product>(
        db,
        "SELECT id FROM products WHERE slug = ? AND status IN ('draft', 'active')",
        [validated.slug]
      );
      console.log('Slug check result (active):', existingProduct);
    } catch (queryError) {
      console.error('Error checking slug:', queryError);
      // Continue anyway - if query fails, we'll catch it later
    }
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 400 }
      );
    }

    // Check if an archived product has this slug and update it to free the slug
    try {
      const archivedProduct = await queryOne<Product>(
        db,
        "SELECT id, slug FROM products WHERE slug = ? AND status = 'archived'",
        [validated.slug]
      );
      
      if (archivedProduct) {
        console.log('Found archived product with same slug, updating it:', archivedProduct.id);
        // Update the archived product's slug to free it up
        const newSlug = `${archivedProduct.slug}-archived-${Date.now()}`;
        await executeDB(
          db,
          "UPDATE products SET slug = ?, updated_at = unixepoch() WHERE id = ?",
          [newSlug, archivedProduct.id]
        );
        console.log(`Updated archived product slug from '${archivedProduct.slug}' to '${newSlug}'`);
      }
    } catch (queryError) {
      console.error('Error checking/updating archived product slug:', queryError);
      // Continue anyway - if this fails, the INSERT will fail with a clearer error
    }

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    await executeDB(
      db,
      `INSERT INTO products (
        id, name_en, name_sv, slug, description_en, description_sv,
        category_id, price, compare_at_price, sku, status, featured,
        stock_quantity, track_inventory, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        validated.name_en,
        validated.name_sv,
        validated.slug,
        validated.description_en || null,
        validated.description_sv || null,
        validated.category_id || null,
        validated.price,
        validated.compare_at_price || null,
        validated.sku || null,
        validated.status,
        validated.featured ? 1 : 0,
        validated.stock_quantity,
        validated.track_inventory ? 1 : 0,
        now,
        now,
      ]
    );

    const product = await queryOne<Product>(
      db,
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    // Create variants if provided
    if (validated.variants && validated.variants.length > 0) {
      for (const variantData of validated.variants) {
        await createProductVariant(db, {
          productId: id,
          nameEn: variantData.name_en,
          nameSv: variantData.name_sv,
          sku: variantData.sku,
          price: variantData.price,
          compareAtPrice: variantData.compare_at_price,
          stockQuantity: variantData.stock_quantity,
          trackInventory: variantData.track_inventory,
          option1Name: variantData.option1_name,
          option1Value: variantData.option1_value,
          option2Name: variantData.option2_name,
          option2Value: variantData.option2_value,
          option3Name: variantData.option3_name,
          option3Value: variantData.option3_value,
        });
      }
    }

    // Set collections if provided
    if (validated.collection_ids && validated.collection_ids.length > 0) {
      await setProductCollections(db, id, validated.collection_ids);
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create product error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    
    return NextResponse.json(
      { 
        error: 'Failed to create product',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

