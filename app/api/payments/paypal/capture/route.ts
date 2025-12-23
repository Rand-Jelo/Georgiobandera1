import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const captureSchema = z.object({
  orderId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // Prefer server-side PAYPAL_CLIENT_ID, but fall back to NEXT_PUBLIC_PAYPAL_CLIENT_ID
    // Cloudflare Pages often exposes the client ID as NEXT_PUBLIC_PAYPAL_CLIENT_ID only.
    const paypalClientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!paypalClientId || !paypalClientSecret) {
      return NextResponse.json(
        { error: 'PayPal is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validated = captureSchema.parse(body);

    // Get PayPal access token
    const auth = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64');
    const isProduction = !paypalClientId.includes('sandbox') && !paypalClientId.includes('test');
    const baseUrl = isProduction
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

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

    // Capture the PayPal order
    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${validated.orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json() as { message?: string; error?: string };
      return NextResponse.json(
        { error: errorData.message || errorData.error || 'Failed to capture payment' },
        { status: 400 }
      );
    }

    const captureData = await captureResponse.json() as { status: string; id: string };

    return NextResponse.json({
      success: true,
      orderId: captureData.id,
      status: captureData.status,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Capture PayPal payment error:', error);
    return NextResponse.json(
      { error: 'Failed to capture payment' },
      { status: 500 }
    );
  }
}

