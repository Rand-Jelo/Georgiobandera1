import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getCollectionProducts } from '@/lib/db/queries/product-collections';
import { queryDB } from '@/lib/db/client';
import { getProductImages, getCategoryById, getProductsVariantCounts } from '@/lib/db/queries/products';

/**
 * GET /api/collections/[id]/products
 * Get all products in a collection (public)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const sortBy = searchParams.get('sortBy') || 'newest';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const productIds = await getCollectionProducts(db, id);

    if (productIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Build ORDER BY clause based on sortBy
    let orderBy = 'p.created_at DESC'; // default: newest
    switch (sortBy) {
      case 'oldest':
        orderBy = 'p.created_at ASC';
        break;
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'name_asc':
        orderBy = 'p.name_en ASC';
        break;
      case 'name_desc':
        orderBy = 'p.name_en DESC';
        break;
      case 'newest':
      default:
        orderBy = 'p.created_at DESC';
        break;
    }

    // Get product details (only active products) with sorting
    const placeholders = productIds.map(() => '?').join(',');
    let query = `SELECT p.id, p.name_en, p.name_sv, p.slug, p.price, p.compare_at_price, 
                        p.status, p.stock_quantity, p.track_inventory, p.category_id
                 FROM products p
                 WHERE p.id IN (${placeholders}) AND p.status = 'active'
                 ORDER BY ${orderBy}`;

    // Add limit and offset if provided
    if (limit !== undefined) {
      query += ` LIMIT ? OFFSET ?`;
      const result = await queryDB<{
        id: string;
        name_en: string;
        name_sv: string;
        slug: string;
        price: number;
        compare_at_price: number | null;
        status: string;
        stock_quantity: number;
        track_inventory: number;
        category_id: string | null;
      }>(
        db,
        query,
        [...productIds, limit, offset]
      );

      // Get variant counts for hasVariants
      const allProductIds = (result.results || []).map(p => p.id);
      const variantCounts = await getProductsVariantCounts(db, allProductIds);

      // Enrich with images, category, and hasVariants
      const productsWithDetails = await Promise.all(
        (result.results || []).map(async (product) => {
          const images = await getProductImages(db, product.id);
          const category = product.category_id
            ? await getCategoryById(db, product.category_id)
            : null;
          const variantCount = variantCounts.get(product.id) || 0;
          return {
            ...product,
            images: images.map(img => ({
              url: img.url,
              alt_text_en: img.alt_text_en,
              alt_text_sv: img.alt_text_sv,
            })),
            category: category ? {
              id: category.id,
              name_en: category.name_en,
              name_sv: category.name_sv,
              slug: category.slug,
            } : null,
            hasVariants: variantCount > 1,
          };
        })
      );

      return NextResponse.json({ products: productsWithDetails });
    } else {
      // No limit/offset - return all products
      const result = await queryDB<{
        id: string;
        name_en: string;
        name_sv: string;
        slug: string;
        price: number;
        compare_at_price: number | null;
        status: string;
        stock_quantity: number;
        track_inventory: number;
        category_id: string | null;
      }>(
        db,
        query,
        productIds
      );

      // Get variant counts for hasVariants
      const allProductIds = (result.results || []).map(p => p.id);
      const variantCounts = await getProductsVariantCounts(db, allProductIds);

      // Enrich with images, category, and hasVariants
      const productsWithDetails = await Promise.all(
        (result.results || []).map(async (product) => {
          const images = await getProductImages(db, product.id);
          const category = product.category_id
            ? await getCategoryById(db, product.category_id)
            : null;
          const variantCount = variantCounts.get(product.id) || 0;
          return {
            ...product,
            images: images.map(img => ({
              url: img.url,
              alt_text_en: img.alt_text_en,
              alt_text_sv: img.alt_text_sv,
            })),
            category: category ? {
              id: category.id,
              name_en: category.name_en,
              name_sv: category.name_sv,
              slug: category.slug,
            } : null,
            hasVariants: variantCount > 1,
          };
        })
      );

      return NextResponse.json({ products: productsWithDetails });
    }
  } catch (error) {
    console.error('Get collection products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection products' },
      { status: 500 }
    );
  }
}

