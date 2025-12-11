import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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

    // Calculate shipping
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

    // Calculate tax from tax-inclusive prices
    // Prices already include tax, so we extract it: tax = subtotal * (tax_rate / (1 + tax_rate))
    const tax = calculateTaxFromInclusive(subtotal, taxRate);
    
    // Total = subtotal (tax-inclusive) + shipping
    // Tax is stored separately for record-keeping
    const total = subtotal + shippingCost;

    // Create order
    const order = await createOrder(db, {
      userId: session?.userId,
      email: session?.email || validated.shippingName, // Fallback, should have email
      paymentMethod: validated.paymentMethod,
      paymentIntentId: validated.paymentIntentId,
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
      items: orderItems,
    });

    // Clear cart after successful order creation
    await clearCart(db, session?.userId, sessionId);

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
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
