import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { markReviewHelpful } from '@/lib/db/queries/reviews';

/**
 * POST /api/products/[slug]/reviews/helpful
 * Mark a review as helpful
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const body = await request.json() as { reviewId?: string };
    
    if (!body.reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    const db = getDB();
    const review = await markReviewHelpful(db, body.reviewId);

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Mark review helpful error:', error);
    return NextResponse.json(
      { error: 'Failed to mark review as helpful' },
      { status: 500 }
    );
  }
}

