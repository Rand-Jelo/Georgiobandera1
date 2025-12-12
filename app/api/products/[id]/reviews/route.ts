import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDB } from '@/lib/db/client';
import { getSession } from '@/lib/auth/session';
import {
  getProductReviews,
  createReview,
  getProductReviewStats,
} from '@/lib/db/queries/reviews';
import { getProductById } from '@/lib/db/queries/products';

const createReviewSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional().nullable(),
  review_text: z.string().min(10).max(2000),
});

/**
 * GET /api/products/[id]/reviews
 * Get reviews for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('stats') === 'true';

    const db = getDB();

    // Verify product exists
    const product = await getProductById(db, id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get approved reviews only for public endpoint
    // Handle case where reviews table doesn't exist yet (migrations not run)
    let reviews: typeof reviews = [];
    try {
      reviews = await getProductReviews(db, id, {
        status: 'approved',
        limit: 50,
      });
    } catch (error: any) {
      // If table doesn't exist, return empty reviews
      if (error?.message?.includes('no such table: product_reviews')) {
        reviews = [];
      } else {
        throw error;
      }
    }

    const response: { reviews: typeof reviews; stats?: any } = { reviews };

    if (includeStats) {
      try {
        const stats = await getProductReviewStats(db, id);
        response.stats = stats;
      } catch (error: any) {
        // If table doesn't exist, return default stats
        if (error?.message?.includes('no such table: product_reviews')) {
          response.stats = {
            total: 0,
            average: 0,
            ratingDistribution: [
              { rating: 5, count: 0 },
              { rating: 4, count: 0 },
              { rating: 3, count: 0 },
              { rating: 2, count: 0 },
              { rating: 1, count: 0 },
            ],
          };
        } else {
          throw error;
        }
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get reviews error:', error);
    // Return empty reviews if there's an error (e.g., table doesn't exist)
    return NextResponse.json({
      reviews: [],
      stats: includeStats ? {
        total: 0,
        average: 0,
        ratingDistribution: [
          { rating: 5, count: 0 },
          { rating: 4, count: 0 },
          { rating: 3, count: 0 },
          { rating: 2, count: 0 },
          { rating: 1, count: 0 },
        ],
      } : undefined,
    });
  }
}

/**
 * POST /api/products/[id]/reviews
 * Create a review for a product
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const db = getDB();

    // Verify product exists
    const product = await getProductById(db, id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Only allow reviews for active products
    if (product.status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot review inactive products' },
        { status: 400 }
      );
    }

    const body = await request.json() as {
      name?: string;
      email?: string;
      rating?: number;
      title?: string | null;
      review_text?: string;
    };

    const validated = createReviewSchema.parse(body);

    // Check if user has already reviewed this product
    if (session?.userId) {
      const existingReviews = await getProductReviews(db, id, {
        status: 'approved',
      });
      const userReview = existingReviews.find((r) => r.user_id === session.userId);
      if (userReview) {
        return NextResponse.json(
          { error: 'You have already reviewed this product' },
          { status: 400 }
        );
      }
    } else {
      // For guest reviews, check by email
      const existingReviews = await getProductReviews(db, id, {
        status: 'approved',
      });
      const emailReview = existingReviews.find((r) => r.email === validated.email);
      if (emailReview) {
        return NextResponse.json(
          { error: 'This email has already reviewed this product' },
          { status: 400 }
        );
      }
    }

    const review = await createReview(db, {
      product_id: id,
      user_id: session?.userId || null,
      name: validated.name,
      email: validated.email,
      rating: validated.rating,
      title: validated.title || null,
      review_text: validated.review_text,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

