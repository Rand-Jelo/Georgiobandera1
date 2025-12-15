import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getProductBySlug, getProductVariants, getProductImages, getCategoryById } from '@/lib/db/queries/products';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getDB();

    const product = await getProductBySlug(db, slug);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get variants, images, and category
    const [variants, images, category] = await Promise.all([
      getProductVariants(db, product.id),
      getProductImages(db, product.id),
      product.category_id ? getCategoryById(db, product.category_id) : null,
    ]);

    return NextResponse.json({
      product: {
        ...product,
        variants,
        images,
        category: category ? {
          id: category.id,
          name_en: category.name_en,
          name_sv: category.name_sv,
          slug: category.slug,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'Failed to get product' },
      { status: 500 }
    );
  }
}
