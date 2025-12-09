import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getCategoryBySlug, getProducts, getProductImages } from '@/lib/db/queries/products';

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

    // Enrich with images
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const images = await getProductImages(db, product.id);
        return {
          ...product,
          images: images.slice(0, 1),
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
