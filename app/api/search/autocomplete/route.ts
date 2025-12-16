import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getProducts, getProductImages } from '@/lib/db/queries/products';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const db = getDB();

    // Get products matching the search query
    const products = await getProducts(db, {
      search: query,
      status: 'active',
      limit: limit,
    });

    // Enrich with images
    const suggestions = await Promise.all(
      products.map(async (product) => {
        const images = await getProductImages(db, product.id);
        return {
          id: product.id,
          name_en: product.name_en,
          name_sv: product.name_sv,
          slug: product.slug,
          price: product.price,
          image: images[0]?.url || null,
        };
      })
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Search autocomplete error:', error);
    return NextResponse.json(
      { error: 'Failed to get search suggestions' },
      { status: 500 }
    );
  }
}

