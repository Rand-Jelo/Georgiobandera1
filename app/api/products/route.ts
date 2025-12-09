import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getCategories, getCategoryById } from '@/lib/db/queries/products';
import { getProductImages } from '@/lib/db/queries/products';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status') as 'draft' | 'active' | 'archived' | null;
    const featured = searchParams.get('featured') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const db = (request as any).env?.DB;
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const products = await getProducts(db, {
      categoryId: categoryId || undefined,
      status: status || 'active',
      featured: featured || undefined,
      limit,
      offset,
    });

    // Enrich with images and category
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const images = await getProductImages(db, product.id);
        const category = product.category_id
          ? await getCategoryById(db, product.category_id)
          : null;
        return {
          ...product,
          images: images.slice(0, 1), // Get first image for listing
          category: category ? {
            id: category.id,
            name_en: category.name_en,
            name_sv: category.name_sv,
            slug: category.slug,
          } : null,
        };
      })
    );

    return NextResponse.json({ products: productsWithImages });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Failed to get products' },
      { status: 500 }
    );
  }
}

