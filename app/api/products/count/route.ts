import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getProducts } from '@/lib/db/queries/products';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const categoryIds = searchParams.get('categoryIds');
    const status = searchParams.get('status') as 'draft' | 'active' | 'archived' | null;
    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const inStock = searchParams.get('inStock') === 'true' ? true : searchParams.get('inStock') === 'false' ? false : undefined;

    const db = getDB();

    // Parse categoryIds if provided
    const categoryIdsArray = categoryIds ? categoryIds.split(',').filter(id => id.trim()) : undefined;

    // Get all products matching filters (no limit/offset for count)
    const products = await getProducts(db, {
      categoryId: categoryId || undefined,
      categoryIds: categoryIdsArray,
      status: status || 'active',
      featured: featured || undefined,
      search,
      minPrice,
      maxPrice,
      inStock,
    });

    // Add caching headers - count can change, cache for 1 minute
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    
    return NextResponse.json({ count: products.length }, { headers });
  } catch (error) {
    console.error('Get products count error:', error);
    return NextResponse.json(
      { error: 'Failed to get products count' },
      { status: 500 }
    );
  }
}

