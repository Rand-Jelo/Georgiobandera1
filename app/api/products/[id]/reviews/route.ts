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
    const reviews = await getProductReviews(db, id, {
      status: 'approved',
      limit: 50,
    });

    const response: { reviews: typeof reviews; stats?: any } = { reviews };

    if (includeStats) {
      const stats = await getProductReviewStats(db, id);
      response.stats = stats;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to get reviews' },
      { status: 500 }
    );
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

