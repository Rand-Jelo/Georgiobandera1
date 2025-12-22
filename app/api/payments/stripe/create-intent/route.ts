import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { getDB } from '@/lib/db/client';
import { getCartItems } from '@/lib/db/queries/cart';
import { getProductById, getProductVariant } from '@/lib/db/queries/products';
import { calculateTaxFromInclusive } from '@/lib/utils/tax';
import {
  validateDiscountCode,
  calculateDiscountAmount,
} from '@/lib/db/queries/discount-codes';
import { getShippingRegionById, calculateShippingCost } from '@/lib/db/queries/shipping';

const createIntentSchema = z.object({
  shippingRegionId: z.string().optional(),
  discountCode: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      httpClient: Stripe.createFetchHttpClient(), // Required for Cloudflare Workers/Pages
    });

    const body = await request.json();
    const validated = createIntentSchema.parse(body);

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
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

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

      lineItems.push({
        price_data: {
          currency: 'sek',
          product_data: {
            name: product.name_en,
            description: variant?.name_en || product.description_en || undefined,
          },
          unit_amount: Math.round(price * 100), // Convert to öre (cents)
        },
        quantity,
      });
    }

    // Calculate shipping
    let shippingCost = 0;
    if (validated.shippingRegionId) {
      const region = await getShippingRegionById(db, validated.shippingRegionId);
      if (region) {
        shippingCost = calculateShippingCost(region, subtotal);
        if (shippingCost > 0) {
          lineItems.push({
            price_data: {
              currency: 'sek',
              product_data: {
                name: 'Shipping',
              },
              unit_amount: Math.round(shippingCost * 100),
            },
            quantity: 1,
          });
        }
      }
    }

    // Apply discount if provided
    let discountAmount = 0;
    if (validated.discountCode) {
      const userEmail = session?.email || undefined;
      const validation = await validateDiscountCode(db, validated.discountCode, subtotal, session?.userId || undefined, userEmail);
      if (validation.valid && validation.discountCode) {
        discountAmount = calculateDiscountAmount(validation.discountCode, subtotal);
        if (discountAmount > 0) {
          // Add discount as a negative line item
          lineItems.push({
            price_data: {
              currency: 'sek',
              product_data: {
                name: `Discount: ${validation.discountCode.code}`,
              },
              unit_amount: -Math.round(discountAmount * 100), // Negative for discount
            },
            quantity: 1,
          });
        }
      }
    }

    // Calculate tax (prices are tax-inclusive, so we extract tax)
    const taxRate = 0.25; // 25% VAT
    const tax = calculateTaxFromInclusive(subtotal, taxRate);

    const total = subtotal - discountAmount + shippingCost;

    // Validate total amount
    const amountInCents = Math.round(total * 100);
    if (amountInCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid order total. Amount must be greater than zero.' },
        { status: 400 }
      );
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents, // Convert to öre (cents)
      currency: 'sek', // Stripe uses lowercase currency codes
      metadata: {
        subtotal: subtotal.toString(),
        shipping: shippingCost.toString(),
        tax: tax.toString(),
        discount: discountAmount.toString(),
        discountCode: validated.discountCode || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create Stripe payment intent error:', error);
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment intent',
        details: errorMessage,
        // Only include stack in development
        ...(process.env.NODE_ENV === 'development' && { stack: errorDetails })
      },
      { status: 500 }
    );
  }
}

