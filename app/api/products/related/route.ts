import { NextRequest, NextResponse } from 'next/server';
import { getDB, queryDB } from '@/lib/db/client';

/**
 * GET /api/products/related?productId=xxx&limit=4
 *
 * Multi-signal scoring for related products:
 *  - Same collection (weight 5)
 *  - Same category (weight 3)
 *  - Sibling category (weight 2)
 *  - Featured (weight 2)
 *  - Similar price ±30% (weight 1)
 * Falls back to featured/newest products if not enough results.
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

        // 1. Get the current product
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

        // 2. Get parent category for sibling matching
        let parentCategoryId: string | null = null;
        if (current.category_id) {
            const catResult = await queryDB<{ parent_id: string | null }>(
                db, `SELECT parent_id FROM categories WHERE id = ?`, [current.category_id]
            );
            const cats = catResult.results || [];
            if (cats.length > 0) parentCategoryId = cats[0].parent_id;
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

        // 4. Get collections (resilient to missing table)
        let collectionIds: string[] = [];
        try {
            const collResult = await queryDB<{ collection_id: string }>(
                db, `SELECT collection_id FROM product_collections WHERE product_id = ?`, [productId]
            );
            collectionIds = (collResult.results || []).map((c: { collection_id: string }) => c.collection_id);
        } catch {
            // table may not exist
        }

        // 5. Score candidates using simple individual queries
        const candidateMap = new Map<string, number>();

        const addScore = async (sql: string, params: (string | number)[], score: number) => {
            try {
                const result = await queryDB<{ id: string }>(db, sql, params);
                for (const row of (result.results || [])) {
                    candidateMap.set(row.id, (candidateMap.get(row.id) || 0) + score);
                }
            } catch {
                // skip on error
            }
        };

        // Same collection (5)
        if (collectionIds.length > 0) {
            const ph = collectionIds.map(() => '?').join(',');
            await addScore(
                `SELECT DISTINCT p.id FROM products p
         JOIN product_collections pc ON pc.product_id = p.id
         WHERE pc.collection_id IN (${ph}) AND p.id != ? AND p.status = 'active'`,
                [...collectionIds, productId], 5
            );
        }

        // Same category (3)
        if (current.category_id) {
            await addScore(
                `SELECT id FROM products WHERE category_id = ? AND id != ? AND status = 'active'`,
                [current.category_id, productId], 3
            );
        }

        // Sibling categories (2)
        if (siblingCategoryIds.length > 0) {
            const ph = siblingCategoryIds.map(() => '?').join(',');
            await addScore(
                `SELECT id FROM products WHERE category_id IN (${ph}) AND id != ? AND status = 'active'`,
                [...siblingCategoryIds, productId], 2
            );
        }

        // Similar price (1)
        await addScore(
            `SELECT id FROM products WHERE price BETWEEN ? AND ? AND id != ? AND status = 'active'`,
            [priceMin, priceMax, productId], 1
        );

        // Featured (2)
        await addScore(
            `SELECT id FROM products WHERE featured = 1 AND id != ? AND status = 'active'`,
            [productId], 2
        );

        // 6. Sort by score, pick top N
        const sorted = Array.from(candidateMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id]) => id);

        // 7. Fill with other products if needed
        let finalIds = sorted;
        if (finalIds.length < limit) {
            const excludeIds = [productId, ...finalIds];
            const ph = excludeIds.map(() => '?').join(',');
            const fillResult = await queryDB<{ id: string }>(
                db,
                `SELECT id FROM products WHERE id NOT IN (${ph}) AND status = 'active'
         ORDER BY featured DESC, created_at DESC LIMIT ?`,
                [...excludeIds, limit - finalIds.length]
            );
            finalIds = [...finalIds, ...(fillResult.results || []).map((r: { id: string }) => r.id)];
        }

        if (finalIds.length === 0) {
            return NextResponse.json({ products: [] });
        }

        // 8. Fetch full product data
        const idPh = finalIds.map(() => '?').join(',');
        const productsResult = await queryDB<{
            id: string; name_en: string; name_sv: string; slug: string;
            price: number; compare_at_price: number | null;
            featured: number; category_id: string | null;
        }>(db, `SELECT id, name_en, name_sv, slug, price, compare_at_price, featured, category_id FROM products WHERE id IN (${idPh})`, finalIds);
        const products = productsResult.results || [];

        // 9. Enrich with images and category
        const enriched = await Promise.all(
            products.map(async (p) => {
                const imgResult = await queryDB<{ url: string; alt_text_en: string | null; alt_text_sv: string | null; sort_order: number }>(
                    db,
                    `SELECT url, alt_text_en, alt_text_sv, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 2`,
                    [p.id]
                );

                let category: { name_en: string; name_sv: string; slug: string } | null = null;
                if (p.category_id) {
                    const catResult = await queryDB<{ name_en: string; name_sv: string; slug: string }>(
                        db, `SELECT name_en, name_sv, slug FROM categories WHERE id = ?`, [p.category_id]
                    );
                    const catRows = catResult.results || [];
                    if (catRows.length > 0) category = catRows[0];
                }

                return {
                    id: p.id,
                    name_en: p.name_en,
                    name_sv: p.name_sv,
                    slug: p.slug,
                    price: p.price,
                    compare_at_price: p.compare_at_price,
                    featured: p.featured === 1,
                    category,
                    images: (imgResult.results || []).map((img) => ({
                        url: img.url,
                        alt_text: img.alt_text_en,
                        sort_order: img.sort_order,
                    })),
                };
            })
        );

        // Re-sort by original score order
        const idOrder = new Map(finalIds.map((id, i) => [id, i]));
        enriched.sort((a, b) => (idOrder.get(a.id) ?? 99) - (idOrder.get(b.id) ?? 99));

        return NextResponse.json({ products: enriched });
    } catch (error) {
        console.error('Error fetching related products:', error);
        return NextResponse.json({ products: [], error: String(error) });
    }
}
