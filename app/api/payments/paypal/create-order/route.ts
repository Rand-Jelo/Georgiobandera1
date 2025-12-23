import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDB } from '@/lib/db/client';
import { getCartItems } from '@/lib/db/queries/cart';
import { getProductById, getProductVariant } from '@/lib/db/queries/products';
import { calculateTaxFromInclusive } from '@/lib/utils/tax';
import {
  validateDiscountCode,
  calculateDiscountAmount,
} from '@/lib/db/queries/discount-codes';
import { getShippingRegionById, calculateShippingCost } from '@/lib/db/queries/shipping';

const createOrderSchema = z.object({
  shippingRegionId: z.string().optional(),
  discountCode: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check if PayPal is configured
    // Prefer server-side PAYPAL_CLIENT_ID, but fall back to NEXT_PUBLIC_PAYPAL_CLIENT_ID
    // Cloudflare Pages often exposes the client ID as NEXT_PUBLIC_PAYPAL_CLIENT_ID only.
    const paypalClientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
    
    if (!paypalClientId || !paypalClientSecret) {
      return NextResponse.json(
        { error: 'PayPal is not configured. Please add PayPal credentials to environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    const db = getDB();
    const sessionId = request.cookies.get('session-id')?.value || undefined;
    const { getSession } = await import('@/lib/auth/session');
    const session = await getSession();

    // Get cart items
    const cartItems = await getCartItems(db, session?.userId, sessionId);

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Calculate subtotal
    let subtotal = 0;
    const items: Array<{
      name: string;
      quantity: string;
      unit_amount: { currency_code: string; value: string };
    }> = [];

    for (const item of cartItems) {
      const product = await getProductById(db, item.product_id);
      if (!product) continue;

      const variant = item.variant_id
        ? await getProductVariant(db, item.variant_id)
        : null;

      const price = variant?.price ?? product.price;
      const quantity = item.quantity;
      const itemTotal = price * quantity;
      subtotal += itemTotal;

      items.push({
        name: product.name_en,
        quantity: quantity.toString(),
        unit_amount: {
          currency_code: 'SEK',
          value: price.toFixed(2),
        },
      });
    }

    // Calculate shipping
    let shippingCost = 0;
    if (validated.shippingRegionId) {
      const region = await getShippingRegionById(db, validated.shippingRegionId);
      if (region) {
        shippingCost = calculateShippingCost(region, subtotal);
      }
    }

    // Apply discount if provided
    let discountAmount = 0;
    if (validated.discountCode) {
      const userEmail = session?.email || undefined;
      const validation = await validateDiscountCode(db, validated.discountCode, subtotal, session?.userId || undefined, userEmail);
      if (validation.valid && validation.discountCode) {
        discountAmount = calculateDiscountAmount(validation.discountCode, subtotal);
      }
    }

    const total = subtotal - discountAmount + shippingCost;

    // Get PayPal access token
    const auth = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64');
    // For now we always use PayPal Sandbox while testing.
    // When switching to live payments, change this to api-m.paypal.com.
    const baseUrl = 'https://api-m.sandbox.paypal.com';

    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json() as { error?: string; error_description?: string };
      const message = errorData.error_description || errorData.error || 'Failed to get PayPal access token';
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }

    const { access_token } = await tokenResponse.json() as { access_token: string };

    // Create PayPal order
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'SEK',
              value: total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: 'SEK',
                  value: subtotal.toFixed(2),
                },
                shipping: shippingCost > 0 ? {
                  currency_code: 'SEK',
                  value: shippingCost.toFixed(2),
                } : undefined,
                discount: discountAmount > 0 ? {
                  currency_code: 'SEK',
                  value: discountAmount.toFixed(2),
                } : undefined,
              },
            },
            items: items.length > 0 ? items : undefined,
          },
        ],
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json() as { message?: string; error?: string };
      throw new Error(errorData.message || errorData.error || 'Failed to create PayPal order');
    }

    const orderData = await orderResponse.json() as { id: string; status: string };

    return NextResponse.json({
      orderId: orderData.id,
      status: orderData.status,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create PayPal order error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}

