import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { executeDB, queryOne } from '@/lib/db/client';
import { createProductVariant } from '@/lib/db/queries/products';
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
    const validated = createProductSchema.parse(body);

    // Check if slug already exists (only for active products, not archived)
    const existingProduct = await queryOne<Product>(
      db,
      'SELECT id FROM products WHERE slug = ? AND status != ?',
      [validated.slug, 'archived']
    );

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

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

