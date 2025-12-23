import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { getSession } from '@/lib/auth/session';
import { getDB } from '@/lib/db/client';
import { getCartItems } from '@/lib/db/queries/cart';
import { getProductById, getProductVariant } from '@/lib/db/queries/products';
import { createOrder } from '@/lib/db/queries/orders';
import { clearCart } from '@/lib/db/queries/cart';
import { getShippingRegionById } from '@/lib/db/queries/shipping';
import { calculateShippingCost } from '@/lib/db/queries/shipping';
import { getStoreSettings } from '@/lib/db/queries/settings';
import { calculateTaxFromInclusive, getDefaultTaxRate } from '@/lib/utils/tax';
import {
  validateDiscountCode,
  calculateDiscountAmount,
  recordDiscountCodeUsage,
} from '@/lib/db/queries/discount-codes';
import { sendOrderConfirmationEmail } from '@/lib/email/order-confirmation';
import { getOrderItems } from '@/lib/db/queries/orders';

const createOrderSchema = z.object({
  shippingName: z.string().min(1),
  shippingAddressLine1: z.string().min(1),
  shippingAddressLine2: z.string().optional(),
  shippingCity: z.string().min(1),
  shippingPostalCode: z.string().min(1),
  shippingCountry: z.string().min(1),
  shippingPhone: z.string().optional(),
  shippingRegionId: z.string().optional(),
  paymentMethod: z.enum(['stripe', 'paypal']).optional(),
  paymentIntentId: z.string().optional(),
  paypalOrderId: z.string().optional(),
  discountCode: z.string().nullable().optional(),
  orderNotes: z.string().optional(),
  giftMessage: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    const db = getDB();

    // Get cart items
    const sessionId = request.cookies.get('session-id')?.value || undefined;
    const cartItems = await getCartItems(db, session?.userId, sessionId);

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Calculate subtotal and prepare order items
    let subtotal = 0;
    const orderItems = [];

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

      orderItems.push({
        productId: product.id,
        variantId: variant?.id,
        productName: product.name_en, // Will be stored in order
        variantName: variant?.name_en || undefined,
        sku: variant?.sku || product.sku || undefined,
        price,
        quantity,
      });
    }

    // Validate and apply discount code if provided
    let discountAmount = 0;
    let discountCodeId: string | null = null;
    if (validated.discountCode) {
      const userEmail = session?.email || validated.shippingName; // Fallback email
      const validation = await validateDiscountCode(
        db,
        validated.discountCode,
        subtotal,
        session?.userId || undefined,
        userEmail
      );

      if (validation.valid && validation.discountCode) {
        discountAmount = calculateDiscountAmount(validation.discountCode, subtotal);
        discountCodeId = validation.discountCode.id;
      } else {
        // If discount code is invalid, return error
        return NextResponse.json(
          { error: validation.error || 'Invalid discount code' },
          { status: 400 }
        );
      }
    }

    // Calculate shipping (on subtotal before discount)
    let shippingCost = 0;
    if (validated.shippingRegionId) {
      const region = await getShippingRegionById(db, validated.shippingRegionId);
      if (region) {
        shippingCost = calculateShippingCost(region, subtotal);
      }
    }

    // Get tax rate from settings
    const settings = await getStoreSettings(db);
    const taxRate = settings?.tax_rate ? settings.tax_rate / 100 : getDefaultTaxRate(); // Convert percentage to decimal

    // Calculate tax from tax-inclusive prices (on subtotal before discount)
    // Prices already include tax, so we extract it: tax = subtotal * (tax_rate / (1 + tax_rate))
    const tax = calculateTaxFromInclusive(subtotal, taxRate);
    
    // Total = subtotal (tax-inclusive) - discount + shipping
    // Tax is stored separately for record-keeping
    const total = subtotal - discountAmount + shippingCost;

    // Verify payment before creating order
    if (validated.paymentMethod === 'stripe' && validated.paymentIntentId) {
      // Verify Stripe payment intent
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return NextResponse.json(
          { error: 'Stripe is not configured' },
          { status: 500 }
        );
      }
      const stripe = new Stripe(stripeSecretKey, {
        httpClient: Stripe.createFetchHttpClient(), // Required for Cloudflare Workers/Pages
      });
      const paymentIntent = await stripe.paymentIntents.retrieve(validated.paymentIntentId);
      // Accept 'succeeded' or 'processing' status (processing means payment is being processed)
      if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing') {
        return NextResponse.json(
          { error: `Payment not completed. Status: ${paymentIntent.status}` },
          { status: 400 }
        );
      }
    } else if (validated.paymentMethod === 'paypal' && validated.paypalOrderId) {
      // PayPal payment is verified during capture, so we trust it here
      // In production, you might want to verify the order status
    }

    // Create order
    const order = await createOrder(db, {
      userId: session?.userId,
      email: session?.email || validated.shippingName, // Fallback, should have email
      paymentMethod: validated.paymentMethod,
      paymentIntentId: validated.paymentIntentId || validated.paypalOrderId || undefined,
      subtotal,
      shippingCost,
      tax,
      total,
      shippingRegionId: validated.shippingRegionId || undefined,
      shippingName: validated.shippingName,
      shippingAddressLine1: validated.shippingAddressLine1,
      shippingAddressLine2: validated.shippingAddressLine2,
      shippingCity: validated.shippingCity,
      shippingPostalCode: validated.shippingPostalCode,
      shippingCountry: validated.shippingCountry,
      shippingPhone: validated.shippingPhone,
      orderNotes: validated.orderNotes,
      giftMessage: validated.giftMessage,
      items: orderItems,
    });

    // Record discount code usage if applied
    if (discountCodeId && discountAmount > 0) {
      await recordDiscountCodeUsage(db, {
        discount_code_id: discountCodeId,
        order_id: order.id,
        user_id: session?.userId || null,
        email: session?.email || validated.shippingName,
        discount_amount: discountAmount,
      });
    }

    // Clear cart after successful order creation
    await clearCart(db, session?.userId, sessionId);

    // Send order confirmation email (async, don't wait)
    const orderItemsForEmail = await getOrderItems(db, order.id);
    sendOrderConfirmationEmail({
      order,
      items: orderItemsForEmail.map(item => ({
        productName: item.product_name,
        variantName: item.variant_name || undefined,
        quantity: item.quantity,
        price: item.price,
      })),
      locale: request.headers.get('accept-language')?.includes('sv') ? 'sv' : 'en',
    }).catch(err => {
      console.error('Failed to send order confirmation email:', err);
    });

    return NextResponse.json({
      order: {
        id: order.id,
        order_number: order.order_number,
        total: order.total,
        status: order.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create order error:', error);
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create order',
        details: errorMessage,
        // Only include stack in development
        ...(process.env.NODE_ENV === 'development' && { stack: errorDetails })
      },
      { status: 500 }
    );
  }
}
