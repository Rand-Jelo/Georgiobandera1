import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getProducts, getCategoryById, getProductImages } from '@/lib/db/queries/products';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const categoryIds = searchParams.get('categoryIds'); // Comma-separated list
    const status = searchParams.get('status') as 'draft' | 'active' | 'archived' | null;
    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const inStock = searchParams.get('inStock') === 'true' ? true : searchParams.get('inStock') === 'false' ? false : undefined;
    const sortBy = searchParams.get('sortBy') as 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'popularity' | undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const db = getDB();

    // Parse categoryIds if provided
    const categoryIdsArray = categoryIds ? categoryIds.split(',').filter(id => id.trim()) : undefined;

    const products = await getProducts(db, {
      categoryId: categoryId || undefined,
      categoryIds: categoryIdsArray,
      status: status || 'active',
      featured: featured || undefined,
      search,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
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
