import { NextRequest, NextResponse } from 'next/server';
import { getProductBySlug, getProductVariants, getProductImages } from '@/lib/db/queries/products';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = (request as any).env?.DB;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const product = await getProductBySlug(db, slug);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get variants and images
    const [variants, images] = await Promise.all([
      getProductVariants(db, product.id),
      getProductImages(db, product.id),
    ]);

    return NextResponse.json({
      product: {
        ...product,
        variants,
        images,
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

