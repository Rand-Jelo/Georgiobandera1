import { NextRequest, NextResponse } from 'next/server';
import { getDB, queryDB } from '@/lib/db/client';

/**
 * GET /api/products/related?productId=xxx&limit=4
 *
 * Returns related products using multi-signal scoring:
 *  - Same collection (weight 5)
 *  - Same category (weight 3)
 *  - Sibling category (same parent) (weight 2)
 *  - Similar price range ±30% (weight 1)
 *  - Featured products (weight 2)
 * Falls back to featured products if not enough results.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const limit = parseInt(searchParams.get('limit') || '4');

        if (!productId) {
            return NextResponse.json({ error: 'productId is required' }, { status: 400 });
        }

        const db = getDB();

        // 1. Get the current product's info
        const currentResult = await queryDB<{
            id: string;
            category_id: string | null;
            price: number;
            featured: number;
        }>(db, `SELECT id, category_id, price, featured FROM products WHERE id = ? AND status = 'active'`, [productId]);

        const currentProducts = currentResult.results || [];
        if (currentProducts.length === 0) {
            return NextResponse.json({ products: [] });
        }

        const current = currentProducts[0];
        const priceMin = current.price * 0.7;
        const priceMax = current.price * 1.3;

        // 2. Get the category's parent_id for sibling matching
        let parentCategoryId: string | null = null;
        if (current.category_id) {
            const catResult = await queryDB<{ parent_id: string | null }>(
                db, `SELECT parent_id FROM categories WHERE id = ?`, [current.category_id]
            );
            const cats = catResult.results || [];
            if (cats.length > 0) {
                parentCategoryId = cats[0].parent_id;
            }
        }

        // 3. Get sibling category IDs
        let siblingCategoryIds: string[] = [];
        if (parentCategoryId) {
            const sibResult = await queryDB<{ id: string }>(
                db, `SELECT id FROM categories WHERE parent_id = ? AND id != ?`,
                [parentCategoryId, current.category_id || '']
            );
            siblingCategoryIds = (sibResult.results || []).map((s: { id: string }) => s.id);
        }

        // 4. Get collections the current product belongs to
        const collResult = await queryDB<{ collection_id: string }>(
            db, `SELECT collection_id FROM product_collections WHERE product_id = ?`, [productId]
        );
        const collectionIds = (collResult.results || []).map((c: { collection_id: string }) => c.collection_id);

        // 5. Build scoring query using a CTE so the score expression is only evaluated once
        const scoreParts: string[] = [];
        const scoreParams: (string | number)[] = [];

        if (collectionIds.length > 0) {
            const placeholders = collectionIds.map(() => '?').join(',');
            scoreParts.push(`(CASE WHEN EXISTS (
        SELECT 1 FROM product_collections pc2
        WHERE pc2.product_id = p.id
        AND pc2.collection_id IN (${placeholders})
      ) THEN 5 ELSE 0 END)`);
            scoreParams.push(...collectionIds);
        }

        if (current.category_id) {
            scoreParts.push(`(CASE WHEN p.category_id = ? THEN 3 ELSE 0 END)`);
            scoreParams.push(current.category_id);
        }

        if (siblingCategoryIds.length > 0) {
            const placeholders = siblingCategoryIds.map(() => '?').join(',');
            scoreParts.push(`(CASE WHEN p.category_id IN (${placeholders}) THEN 2 ELSE 0 END)`);
            scoreParams.push(...siblingCategoryIds);
        }

        scoreParts.push(`(CASE WHEN p.price BETWEEN ? AND ? THEN 1 ELSE 0 END)`);
        scoreParams.push(priceMin, priceMax);

        scoreParts.push(`(CASE WHEN p.featured = 1 THEN 2 ELSE 0 END)`);

        const scoreExpression = scoreParts.join(' + ');

        // Use a CTE (WITH clause) so the score is computed once and filtered in outer query
        const sql = `
      WITH scored AS (
        SELECT
          p.id, p.name_en, p.name_sv, p.slug, p.price, p.compare_at_price,
          p.featured, p.category_id, p.created_at,
          (${scoreExpression}) as relevance_score
        FROM products p
        WHERE p.id != ?
          AND p.status = 'active'
      )
      SELECT * FROM scored
      WHERE relevance_score > 0
      ORDER BY relevance_score DESC, featured DESC, created_at DESC
      LIMIT ?
    `;

        const allParams = [...scoreParams, productId, limit + 4];

        interface CandidateProduct {
            id: string;
            name_en: string;
            name_sv: string;
            slug: string;
            price: number;
            compare_at_price: number | null;
            featured: number;
            category_id: string | null;
            created_at: number;
            relevance_score: number;
        }

        const candidateResult = await queryDB<CandidateProduct>(db, sql, allParams);
        const candidates = candidateResult.results || [];

        // 6. If not enough results, fill with featured products
        let results: CandidateProduct[] = candidates.slice(0, limit);

        if (results.length < limit) {
            const existingIds = [productId, ...results.map(r => r.id)];
            const excludePlaceholders = existingIds.map(() => '?').join(',');

            const featuredResult = await queryDB<Omit<CandidateProduct, 'relevance_score'>>(
                db,
                `SELECT id, name_en, name_sv, slug, price, compare_at_price, featured, category_id, created_at
         FROM products
         WHERE id NOT IN (${excludePlaceholders})
           AND status = 'active'
         ORDER BY featured DESC, created_at DESC
         LIMIT ?`,
                [...existingIds, limit - results.length]
            );

            const featuredFill = featuredResult.results || [];
            results = [
                ...results,
                ...featuredFill.map(f => ({ ...f, relevance_score: 0 }))
            ];
        }

        // 7. Enrich with images and category info
        const enriched = await Promise.all(
            results.map(async (product) => {
                const imgResult = await queryDB<{ url: string; alt_text: string | null; position: number }>(
                    db,
                    `SELECT url, alt_text, position FROM product_images WHERE product_id = ? ORDER BY position ASC LIMIT 2`,
                    [product.id]
                );

                let category: { name_en: string; name_sv: string; slug: string } | null = null;
                if (product.category_id) {
                    const catResult = await queryDB<{ name_en: string; name_sv: string; slug: string }>(
                        db, `SELECT name_en, name_sv, slug FROM categories WHERE id = ?`, [product.category_id]
                    );
                    const catRows = catResult.results || [];
                    if (catRows.length > 0) category = catRows[0];
                }

                return {
                    id: product.id,
                    name_en: product.name_en,
                    name_sv: product.name_sv,
                    slug: product.slug,
                    price: product.price,
                    compare_at_price: product.compare_at_price,
                    featured: product.featured === 1,
                    category,
                    images: imgResult.results || [],
                };
            })
        );

        return NextResponse.json({ products: enriched });
    } catch (error) {
        console.error('Error fetching related products:', error);
        return NextResponse.json({ products: [] });
    }
}
