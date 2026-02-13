import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDB } from '@/lib/db/client';
import { getShippingRegionByCountry } from '@/lib/db/queries/shipping';

const detectSchema = z.object({
  country: z.string().length(2), // ISO country code (SE, NO, DE, etc.)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = detectSchema.parse(body);

    const db = getDB();

    // Find the shipping region that matches this country
    const region = await getShippingRegionByCountry(db, validated.country);

    if (!region) {
      return NextResponse.json(
        { error: 'No shipping region found for this country' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      region: {
        id: region.id,
        name_en: region.name_en,
        name_sv: region.name_sv,
        code: region.code,
        base_price: region.base_price,
        free_shipping_threshold: region.free_shipping_threshold,
        shipping_thresholds: region.shipping_thresholds,
        active: region.active,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Detect shipping region error:', error);
    return NextResponse.json(
      { error: 'Failed to detect shipping region' },
      { status: 500 }
    );
  }
}

