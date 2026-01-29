
import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db/client';
import { getProductVariants } from '@/lib/db/queries/products';

export const runtime = 'edge';

export async function GET() {
    try {
        const db = getDB();
        // Fetch signature-shampoo
        const productsResult = await db.prepare('SELECT * FROM products WHERE slug = ?').bind('signature-shampoo').all();

        let debugData: any = {
            message: 'Debug Info',
            productFound: false,
        };

        if (productsResult.results.length > 0) {
            const p = productsResult.results[0] as any;
            debugData.productFound = true;
            debugData.product = p;

            const variants = await getProductVariants(db, p.id);
            debugData.variantCount = variants.length;
            debugData.variants = variants;
        } else {
            // List all products if signature-shampoo is missing
            const all = await db.prepare('SELECT slug, id FROM products LIMIT 5').all();
            debugData.availableProducts = all.results;

            if (all.results.length > 0) {
                const first = all.results[0] as any;
                const v = await getProductVariants(db, first.id);
                debugData.firstProductVariants = v;
            }
        }

        return NextResponse.json(debugData);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
