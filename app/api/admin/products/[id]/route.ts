import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getUserById } from '@/lib/db/queries/users';
import { queryOne, executeDB } from '@/lib/db/client';
import { getProductVariants, createProductVariant, updateProductVariant, deleteProductVariant } from '@/lib/db/queries/products';
import type { Product } from '@/types/database';

const variantSchema = z.object({
  id: z.string().optional(), // If provided, update existing; if not, create new
  name_en: z.string().nullable().optional(),
  name_sv: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  price: z.number().min(0).nullable().optional(), // Allow 0 or null
  compare_at_price: z.number().min(0).nullable().optional(),
  stock_quantity: z.number().int().min(0).default(0),
  track_inventory: z.boolean().default(true),
  option1_name: z.string().nullable().optional(),
  option1_value: z.string().nullable().optional(),
  option2_name: z.string().nullable().optional(),
  option2_value: z.string().nullable().optional(),
  option3_name: z.string().nullable().optional(),
  option3_value: z.string().nullable().optional(),
  _delete: z.boolean().optional(), // Flag to delete variant
});

const updateProductSchema = z.object({
  name_en: z.string().min(1).optional(),
  name_sv: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description_en: z.string().nullable().optional(),
  description_sv: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  price: z.number().min(0).optional(), // Allow 0, just not negative
  compare_at_price: z.number().min(0).nullable().optional(), // Allow 0 or null
  sku: z.string().nullable().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  featured: z.boolean().optional(),
  stock_quantity: z.number().int().min(0).optional(),
  track_inventory: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const product = await queryOne<Product>(
      db,
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get variants
    const variants = await getProductVariants(db, id);

    return NextResponse.json({ product, variants });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'Failed to get product' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    
    // Log the request body for debugging
    console.log('Update product request body:', JSON.stringify(body, null, 2));
    
    const validated = updateProductSchema.parse(body);

    // Check if product exists
    const existingProduct = await queryOne<Product>(
      db,
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if new slug already exists (only for active products, not archived)
    if (validated.slug && validated.slug !== existingProduct.slug) {
      const slugExists = await queryOne<Product>(
        db,
        'SELECT id FROM products WHERE slug = ? AND id != ? AND status != ?',
        [validated.slug, id, 'archived']
      );

      if (slugExists) {
        return NextResponse.json(
          { error: 'Product with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Build update query
    const fields: string[] = [];
    const values: any[] = [];

    if (validated.name_en !== undefined) fields.push('name_en = ?'), values.push(validated.name_en);
    if (validated.name_sv !== undefined) fields.push('name_sv = ?'), values.push(validated.name_sv);
    if (validated.slug !== undefined) fields.push('slug = ?'), values.push(validated.slug);
    if (validated.description_en !== undefined) fields.push('description_en = ?'), values.push(validated.description_en);
    if (validated.description_sv !== undefined) fields.push('description_sv = ?'), values.push(validated.description_sv);
    if (validated.category_id !== undefined) fields.push('category_id = ?'), values.push(validated.category_id);
    if (validated.price !== undefined) fields.push('price = ?'), values.push(validated.price);
    if (validated.compare_at_price !== undefined) fields.push('compare_at_price = ?'), values.push(validated.compare_at_price);
    if (validated.sku !== undefined) fields.push('sku = ?'), values.push(validated.sku);
    if (validated.status !== undefined) fields.push('status = ?'), values.push(validated.status);
    if (validated.featured !== undefined) fields.push('featured = ?'), values.push(validated.featured ? 1 : 0);
    if (validated.stock_quantity !== undefined) fields.push('stock_quantity = ?'), values.push(validated.stock_quantity);
    if (validated.track_inventory !== undefined) fields.push('track_inventory = ?'), values.push(validated.track_inventory ? 1 : 0);

    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    fields.push('updated_at = unixepoch()');
    values.push(id);

    await executeDB(
      db,
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    // Handle variants if provided
    if (validated.variants !== undefined) {
      const existingVariants = await getProductVariants(db, id);
      const existingVariantIds = new Set(existingVariants.map(v => v.id));
      const providedVariantIds = new Set(
        validated.variants
          .filter(v => v.id && !v._delete)
          .map(v => v.id!)
      );

      // Delete variants that are marked for deletion or no longer in the list
      for (const existingVariant of existingVariants) {
        if (!providedVariantIds.has(existingVariant.id)) {
          await deleteProductVariant(db, existingVariant.id);
        }
      }

      // Create or update variants
      for (const variantData of validated.variants) {
        if (variantData._delete) {
          if (variantData.id) {
            await deleteProductVariant(db, variantData.id);
          }
          continue;
        }

        if (variantData.id && existingVariantIds.has(variantData.id)) {
          // Update existing variant
          await updateProductVariant(db, variantData.id, {
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
        } else {
          // Create new variant
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
    }

    const updatedProduct = await queryOne<Product>(
      db,
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    const variants = await getProductVariants(db, id);

    return NextResponse.json({ product: updatedProduct, variants });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if product exists
    const product = await queryOne<Product>(
      db,
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to archived
    await executeDB(
      db,
      'UPDATE products SET status = ?, updated_at = unixepoch() WHERE id = ?',
      ['archived', id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

