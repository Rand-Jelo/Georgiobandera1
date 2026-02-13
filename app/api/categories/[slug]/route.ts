import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getCategoryBySlug, getProducts, getProductImages, getProductsVariantCounts } from '@/lib/db/queries/products';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getDB();

    const category = await getCategoryBySlug(db, slug);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get products in this category
    const products = await getProducts(db, {
      categoryId: category.id,
      status: 'active',
    });

    // Get variant counts for hasVariants flag
    const productIds = products.map(p => p.id);
    const variantCounts = await getProductsVariantCounts(db, productIds);

    // Enrich with images and hasVariants
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const images = await getProductImages(db, product.id);
        const variantCount = variantCounts.get(product.id) || 0;
        return {
          ...product,
          images: images.slice(0, 1),
          hasVariants: variantCount > 1,
        };
      })
    );

    return NextResponse.json({
      category,
      products: productsWithImages,
    });
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { error: 'Failed to get category' },
      { status: 500 }
    );
  }
}
