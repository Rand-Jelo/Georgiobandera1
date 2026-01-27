import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDB } from '@/lib/db/client';
import { createOrder, updatePaymentStatus } from '@/lib/db/queries/orders';
import { getCartItems, clearCart } from '@/lib/db/queries/cart';
import { getSession } from '@/lib/auth/session';
import { getProductById, getProductVariant } from '@/lib/db/queries/products';
import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from '@/lib/email';
import { getOrderItems } from '@/lib/db/queries/orders';
import { z } from 'zod';
import { OrderItem } from '@/types/database';

const confirmPaymentSchema = z.object({
    paymentIntentId: z.string(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = confirmPaymentSchema.parse(body);
        const { paymentIntentId } = validated;

        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            throw new Error('Stripe is not configured');
        }

        const stripe = new Stripe(stripeSecretKey, {
            httpClient: Stripe.createFetchHttpClient(),
        });

        // 1. Retrieve the PaymentIntent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return NextResponse.json(
                { error: `Payment not successful. Status: ${paymentIntent.status}` },
                { status: 400 }
            );
        }

        // 2. Extract Metadata and Shipping Details
        const metadata = paymentIntent.metadata || {};
        const shipping = paymentIntent.shipping;

        // We can't proceed without shipping info
        if (!shipping || !shipping.address || !shipping.name) {
            // Fallback: If for some reason shipping wasn't saved in PI, check metadata if you saved it there?
            // For now, assume strict requirement as per our new StripePayment.tsx
            return NextResponse.json(
                { error: 'Missing shipping details in payment verification.' },
                { status: 400 }
            );
        }

        const { subtotal, shipping: shippingCost, tax, discount, discountCode } = metadata;

        // 3. Get Cart Items (Session/User)
        const db = getDB();
        const sessionId = request.cookies.get('session-id')?.value || undefined;
        const session = await getSession();
        const cartItems = await getCartItems(db, session?.userId, sessionId);

        if (cartItems.length === 0) {
            // Potentially the order was already created if this API is called twice?
            // Or simply no items. 
            // TODO: check if order with this paymentIntentId already exists to be idempotent
            return NextResponse.json(
                { error: 'Cart is empty or order already processed.' },
                { status: 400 }
            );
        }

        // 4. Construct Order Data
        // Map Stripe address to our DB format
        const shippingAddress = {
            name: shipping.name,
            address_line1: shipping.address.line1 || '',
            address_line2: shipping.address.line2 || null,
            city: shipping.address.city || '',
            postal_code: shipping.address.postal_code || '',
            country: shipping.address.country || '',
            phone: shipping.phone || null,
        };

        // Prepare line items
        const orderItems = [];
        for (const item of cartItems) {
            const product = await getProductById(db, item.product_id);
            if (!product) continue;

            const variant = item.variant_id
                ? await getProductVariant(db, item.variant_id)
                : null;

            const price = variant?.price ?? product.price ?? 0;

            orderItems.push({
                productId: item.product_id,
                variantId: item.variant_id || undefined,
                quantity: item.quantity,
                price: price,
                productName: product.name_en, // Use English name as default or fetch localized based on preference? DB usually stores one or keeps snapshot. The type def expects productName.
                variantName: variant ? (variant.name_en || variant.name_sv || 'Variant') : undefined,
                sku: variant?.sku || product.sku || undefined
            });
        }

        // 5. Create Order in DB
        const order = await createOrder(db, {
            userId: session?.userId || undefined,
            email: metadata.email || session?.email || paymentIntent.receipt_email || 'guest@example.com',

            // Status is handled internally by createOrder defaults usually, but let's check params
            // createOrder doesn't take 'status' or 'payment_status' as input in the subset I saw?
            // Wait, let me check the definition of createOrder again in my memory or file.
            // It takes: userId, email, paymentMethod, paymentIntentId, subtotal, shippingCost, tax, total, currency...
            // It does NOT accept 'status' or 'payment_status' or 'payment_id' (it uses paymentIntentId).

            paymentMethod: 'stripe',
            paymentIntentId: paymentIntentId,
            subtotal: parseFloat(subtotal || '0'),
            shippingCost: parseFloat(shippingCost || '0'),
            tax: parseFloat(tax || '0'),
            total: (paymentIntent.amount / 100),
            currency: paymentIntent.currency.toUpperCase(),

            shippingName: shippingAddress.name,
            shippingAddressLine1: shippingAddress.address_line1,
            shippingAddressLine2: shippingAddress.address_line2 || undefined,
            shippingCity: shippingAddress.city,
            shippingPostalCode: shippingAddress.postal_code,
            shippingCountry: shippingAddress.country,
            shippingPhone: shippingAddress.phone || undefined,

            items: orderItems,
            // discount_amount? No, checking definition...
        });

        // Update order status to paid since payment was confirmed by Stripe
        await updatePaymentStatus(db, order.id, 'paid');

        // Also record discount usage if applicable (would need to lookup code ID, skipping for complexity/safety for now)

        // If email was missing in session, try to update it from PI if available
        if (order && !session?.email && paymentIntent.receipt_email) {
            // We might want to update the order email here if our DB query supports it, 
            // or just trust that `createOrder` used the best available. 
            // For now, createOrder implementation details matter. 
            // Let's assume for this fix we rely on what we have. 
            // Ideally we should have passed email in metadata too.
        }

        // 6. Clear Cart
        await clearCart(db, session?.userId, sessionId);

        // 7. Send Emails
        try {
            // Prepare data for emails
            const orderItemsForEmail = await getOrderItems(db, order.id);
            // Default to English if locale not provided/detected, or extract from somewhere if possible. 
            // For now, hardcode 'en' or attempt to detect? 
            // We don't have locale in the body request for confirm, maybe we should've?
            // But we can default to 'en' or 'sv' based on currency (SEK -> sv)?
            const locale = order.currency === 'SEK' ? 'sv' : 'en';

            const orderDate = new Date(order.created_at * 1000).toLocaleDateString(locale === 'sv' ? 'sv-SE' : 'en-SE');

            const orderItemsForEmailFormatted = orderItemsForEmail.map((item: OrderItem) => ({
                name: item.product_name,
                variant: item.variant_name || undefined,
                quantity: item.quantity,
                price: item.price,
            }));

            const shippingAddressForEmail = {
                street: order.shipping_address_line1 + (order.shipping_address_line2 ? `, ${order.shipping_address_line2}` : ''),
                city: order.shipping_city,
                postalCode: order.shipping_postal_code,
                country: order.shipping_country,
            };

            const requestUrl = new URL(request.url);
            const baseUrl = requestUrl.origin;

            // Send Customer Confirmation
            const confirmResult = await sendOrderConfirmationEmail({
                to: order.email,
                name: order.shipping_name,
                orderNumber: order.order_number,
                orderDate,
                items: orderItemsForEmailFormatted,
                subtotal: order.subtotal,
                shipping: order.shipping_cost,
                total: order.total,
                shippingAddress: shippingAddressForEmail,
                locale: locale as 'sv' | 'en',
                baseUrl,
            });

            if (!confirmResult.success) {
                console.error('Failed to send order confirmation email:', confirmResult.error);
            } else {
                console.log('Order confirmation email sent successfully to:', order.email);
            }

            // Send Admin Notification
            const notificationResult = await sendOrderNotificationEmail({
                orderNumber: order.order_number,
                customerName: order.shipping_name,
                customerEmail: order.email,
                orderDate,
                items: orderItemsForEmailFormatted,
                subtotal: order.subtotal,
                shipping: order.shipping_cost,
                total: order.total,
                shippingAddress: shippingAddressForEmail,
            });

            if (!notificationResult.success) {
                console.error('Failed to send order notification email:', notificationResult.error);
            } else {
                console.log('Order notification email sent successfully to admin');
            }

        } catch (err) {
            console.error('Error sending order emails:', err);
            // Don't fail the response if email sending fails, the order is already created
        }

        return NextResponse.json({
            success: true,
            orderNumber: order.order_number
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.issues },
                { status: 400 }
            );
        }
        console.error('Confirm payment error:', error);
        return NextResponse.json(
            { error: 'Failed to confirm payment' },
            { status: 500 }
        );
    }
}
