import { D1Database } from '@cloudflare/workers-types';
import { queryDB, queryOne, executeDB } from '../client';
import type { ProductReview } from '@/types/database';

/**
 * Get reviews for a product
 */
export async function getProductReviews(
  db: D1Database,
  productId: string,
  options: {
    status?: 'pending' | 'approved' | 'rejected';
    limit?: number;
    offset?: number;
  } = {}
): Promise<ProductReview[]> {
  try {
    let sql = 'SELECT * FROM product_reviews WHERE product_id = ?';
    const params: any[] = [productId];

    if (options.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY created_at DESC';

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const result = await queryDB<ProductReview>(db, sql, params);
    return result.results || [];
  } catch (error: any) {
    // If table doesn't exist, return empty array
    if (error?.message?.includes('no such table: product_reviews')) {
      return [];
    }
    throw error;
  }
}

/**
 * Get all reviews (admin)
 */
export async function getAllReviews(
  db: D1Database,
  options: {
    status?: 'pending' | 'approved' | 'rejected';
    productId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<ProductReview[]> {
  try {
    let sql = 'SELECT * FROM product_reviews WHERE 1=1';
    const params: any[] = [];

    if (options.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    if (options.productId) {
      sql += ' AND product_id = ?';
      params.push(options.productId);
    }

    if (options.search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR review_text LIKE ?)';
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY created_at DESC';

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const result = await queryDB<ProductReview>(db, sql, params);
    return result.results || [];
  } catch (error: any) {
    // If table doesn't exist, return empty array
    if (error?.message?.includes('no such table: product_reviews')) {
      return [];
    }
    throw error;
  }
}

/**
 * Get review by ID
 */
export async function getReviewById(
  db: D1Database,
  id: string
): Promise<ProductReview | null> {
  return await queryOne<ProductReview>(
    db,
    'SELECT * FROM product_reviews WHERE id = ?',
    [id]
  );
}

/**
 * Get product review statistics
 */
export async function getProductReviewStats(
  db: D1Database,
  productId: string
): Promise<{
  total: number;
  average: number;
  ratingDistribution: { rating: number; count: number }[];
}> {
  try {
    const reviewsResult = await queryDB<{ rating: number }>(
      db,
      'SELECT rating FROM product_reviews WHERE product_id = ? AND status = ?',
      [productId, 'approved']
    );

    const reviews = reviewsResult.results || [];
    const total = reviews.length;

    if (total === 0) {
      return {
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
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / total;

    // Count ratings
    const distribution: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: distribution[rating] || 0,
    }));

    return {
      total,
      average: Math.round(average * 10) / 10, // Round to 1 decimal
      ratingDistribution,
    };
  } catch (error: any) {
    // If table doesn't exist, return default stats
    if (error?.message?.includes('no such table: product_reviews')) {
      return {
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
    }
    throw error;
  }
}

/**
 * Create a product review
 */
export async function createReview(
  db: D1Database,
  data: {
    product_id: string;
    user_id?: string | null;
    name: string;
    email: string;
    rating: number;
    title?: string | null;
    review_text: string;
  }
): Promise<ProductReview> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await executeDB(
    db,
    `INSERT INTO product_reviews (
      id, product_id, user_id, name, email, rating, title, review_text, status,
      helpful_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.product_id,
      data.user_id || null,
      data.name,
      data.email,
      data.rating,
      data.title || null,
      data.review_text,
      'pending', // New reviews need approval
      0,
      now,
      now,
    ]
  );

  const created = await getReviewById(db, id);
  if (!created) {
    throw new Error('Failed to create review');
  }
  return created;
}

/**
 * Update review status
 */
export async function updateReviewStatus(
  db: D1Database,
  id: string,
  status: 'pending' | 'approved' | 'rejected'
): Promise<ProductReview> {
  const now = Math.floor(Date.now() / 1000);

  await executeDB(
    db,
    'UPDATE product_reviews SET status = ?, updated_at = ? WHERE id = ?',
    [status, now, id]
  );

  const updated = await getReviewById(db, id);
  if (!updated) {
    throw new Error('Review not found');
  }
  return updated;
}

/**
 * Delete review
 */
export async function deleteReview(
  db: D1Database,
  id: string
): Promise<void> {
  await executeDB(db, 'DELETE FROM product_reviews WHERE id = ?', [id]);
}

/**
 * Increment helpful count
 */
export async function markReviewHelpful(
  db: D1Database,
  id: string
): Promise<ProductReview> {
  const now = Math.floor(Date.now() / 1000);

  await executeDB(
    db,
    'UPDATE product_reviews SET helpful_count = helpful_count + 1, updated_at = ? WHERE id = ?',
    [now, id]
  );

  const updated = await getReviewById(db, id);
  if (!updated) {
    throw new Error('Review not found');
  }
  return updated;
}

