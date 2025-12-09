import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getShippingRegionByCode, calculateShippingCost } from '@/lib/db/queries/shipping';

const calculateSchema = z.object({
  regionCode: z.string(),
  subtotal: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = calculateSchema.parse(body);

    const db = (request as any).env?.DB;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const region = await getShippingRegionByCode(db, validated.regionCode);
    if (!region) {
      return NextResponse.json(
        { error: 'Shipping region not found' },
        { status: 404 }
      );
    }

    const shippingCost = calculateShippingCost(region, validated.subtotal);

    return NextResponse.json({
      shippingCost,
      region: {
        id: region.id,
        name_en: region.name_en,
        name_sv: region.name_sv,
        code: region.code,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Calculate shipping error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping' },
      { status: 500 }
    );
  }
}

