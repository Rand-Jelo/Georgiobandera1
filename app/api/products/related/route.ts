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

        // 4. Get collections (wrapped in try-catch in case table doesn't exist)
        let collectionIds: string[] = [];
        try {
            const collResult = await queryDB<{ collection_id: string }>(
                db, `SELECT collection_id FROM product_collections WHERE product_id = ?`, [productId]
            );
            collectionIds = (collResult.results || []).map((c: { collection_id: string }) => c.collection_id);
        } catch {
            // product_collections table may not exist yet
        }

        // 5. Score candidates using individual queries merged in JS
        //    (avoids complex CTE parameter binding issues on D1)
        const candidateMap = new Map<string, { score: number }>();

        // Helper: fetch product IDs and assign score
        const addScore = async (sql: string, params: (string | number)[], score: number) => {
            try {
                const result = await queryDB<{ id: string }>(db, sql, params);
                for (const row of (result.results || [])) {
                    const existing = candidateMap.get(row.id);
                    candidateMap.set(row.id, { score: (existing?.score || 0) + score });
                }
            } catch {
                // Skip this signal on error
            }
        };

        // Same collection (weight 5)
        if (collectionIds.length > 0) {
            const placeholders = collectionIds.map(() => '?').join(',');
            await addScore(
                `SELECT DISTINCT p.id FROM products p
         JOIN product_collections pc ON pc.product_id = p.id
         WHERE pc.collection_id IN (${placeholders})
         AND p.id != ? AND p.status = 'active'`,
                [...collectionIds, productId],
                5
            );
        }

        // Same category (weight 3)
        if (current.category_id) {
            await addScore(
                `SELECT id FROM products WHERE category_id = ? AND id != ? AND status = 'active'`,
                [current.category_id, productId],
                3
            );
        }

        // Sibling categories (weight 2)
        if (siblingCategoryIds.length > 0) {
            const placeholders = siblingCategoryIds.map(() => '?').join(',');
            await addScore(
                `SELECT id FROM products WHERE category_id IN (${placeholders}) AND id != ? AND status = 'active'`,
                [...siblingCategoryIds, productId],
                2
            );
        }

        // Similar price (weight 1)
        await addScore(
            `SELECT id FROM products WHERE price BETWEEN ? AND ? AND id != ? AND status = 'active'`,
            [priceMin, priceMax, productId],
            1
        );

        // Featured (weight 2)
        await addScore(
            `SELECT id FROM products WHERE featured = 1 AND id != ? AND status = 'active'`,
            [productId],
            2
        );

        // 6. Sort by score and pick top N
        const sorted = Array.from(candidateMap.entries())
            .sort((a, b) => b[1].score - a[1].score)
            .slice(0, limit)
            .map(([id]) => id);

        // 7. If not enough, fill with other active products
        let finalIds = sorted;
        if (finalIds.length < limit) {
            const excludeIds = [productId, ...finalIds];
            const excludePlaceholders = excludeIds.map(() => '?').join(',');
            const fillResult = await queryDB<{ id: string }>(
                db,
                `SELECT id FROM products
         WHERE id NOT IN (${excludePlaceholders}) AND status = 'active'
         ORDER BY featured DESC, created_at DESC
         LIMIT ?`,
                [...excludeIds, limit - finalIds.length]
            );
            const fillIds = (fillResult.results || []).map((r: { id: string }) => r.id);
            finalIds = [...finalIds, ...fillIds];
        }

        if (finalIds.length === 0) {
            return NextResponse.json({ products: [] });
        }

        // 8. Fetch full product data for final IDs
        const idPlaceholders = finalIds.map(() => '?').join(',');
        const productsResult = await queryDB<{
            id: string;
            name_en: string;
            name_sv: string;
            slug: string;
            price: number;
            compare_at_price: number | null;
            featured: number;
            category_id: string | null;
        }>(
            db,
            `SELECT id, name_en, name_sv, slug, price, compare_at_price, featured, category_id
       FROM products WHERE id IN (${idPlaceholders})`,
            finalIds
        );
        const products = productsResult.results || [];

        // 9. Enrich with images and category, maintain score order
        const enriched = await Promise.all(
            products.map(async (product) => {
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

        // Re-sort by the original score order
        const idOrder = new Map(finalIds.map((id, i) => [id, i]));
        enriched.sort((a, b) => (idOrder.get(a.id) ?? 99) - (idOrder.get(b.id) ?? 99));

        return NextResponse.json({ products: enriched });
    } catch (error) {
        console.error('Error fetching related products:', error);
        return NextResponse.json({ products: [], error: String(error) });
    }
}
