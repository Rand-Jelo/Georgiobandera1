# Payment Setup Guide

This guide explains how to set up test payment integrations for Stripe and PayPal, and how to switch to production keys before going live.

## Test Mode Setup

### Stripe Test Mode

1. **Create a Stripe Account** (if you don't have one):
   - Go to https://stripe.com
   - Sign up for a free account

2. **Get Test API Keys**:
   - Log into Stripe Dashboard: https://dashboard.stripe.com
   - Make sure you're in **Test mode** (toggle in the top right)
   - Go to **Developers** → **API keys**
   - Copy your keys:
     - **Publishable key** (starts with `pk_test_`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
     - **Secret key** (starts with `sk_test_`) → `STRIPE_SECRET_KEY`

3. **Set up Webhook** (for production, optional for testing):
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint**
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

4. **Test Cards**:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`
   - Use any future expiry date, any CVC, any ZIP

### PayPal Sandbox

1. **Create a PayPal Developer Account**:
   - Go to https://developer.paypal.com
   - Sign up or log in with your PayPal account

2. **Create a Sandbox App**:
   - Go to **Dashboard** → **My Apps & Credentials**
   - Click **Create App**
   - Name it (e.g., "Georgio Bandera Test")
   - Select **Merchant** account type
   - Click **Create App**

3. **Get Sandbox Credentials**:
   - Copy the **Client ID** → `NEXT_PUBLIC_PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_ID`
   - Click **Show** next to Secret and copy → `PAYPAL_CLIENT_SECRET`

4. **Test Accounts**:
   - Go to **Dashboard** → **Sandbox** → **Accounts**
   - Use the default test accounts or create new ones
   - Test buyer account: Use any email/password from sandbox accounts

## Environment Variables Setup

1. **Copy the example file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Add your test keys** to `.env.local`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   PAYPAL_CLIENT_ID=...
   PAYPAL_CLIENT_SECRET=...
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
   ```

3. **For Cloudflare Pages** (production):
   - Go to your Cloudflare Pages project
   - Settings → **Environment Variables**
   - Add all the variables from `.env.example`
   - Use **test keys** for testing, **production keys** for live site

## Switching to Production Keys

### Before Going Live:

1. **Stripe Production**:
   - In Stripe Dashboard, switch to **Live mode** (toggle in top right)
   - Go to **Developers** → **API keys**
   - Copy **Live keys** (start with `pk_live_` and `sk_live_`)
   - Update environment variables in Cloudflare Pages
   - Set up production webhook endpoint

2. **PayPal Production**:
   - In PayPal Developer Dashboard, create a **Live App**
   - Get production **Client ID** and **Secret**
   - Update environment variables in Cloudflare Pages
   - Complete PayPal business verification if required

3. **Important**:
   - ✅ Test thoroughly with test keys first
   - ✅ Never commit production keys to Git
   - ✅ Use Cloudflare Pages environment variables for production
   - ✅ Set up webhooks for production
   - ✅ Test a small real transaction first

## Testing Payments

### Stripe Test Flow:
1. Add products to cart
2. Go to checkout
3. Select "Stripe" payment method
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. Check Stripe Dashboard → **Payments** to see test transaction

### PayPal Test Flow:
1. Add products to cart
2. Go to checkout
3. Select "PayPal" payment method
4. Click "Place Order"
5. You'll be redirected to PayPal sandbox
6. Log in with a sandbox test account
7. Complete payment
8. Check PayPal Dashboard to see test transaction

## Troubleshooting

- **Stripe errors**: Check that keys start with `pk_test_` and `sk_test_` for test mode
- **PayPal errors**: Ensure you're using sandbox credentials, not live
- **Webhook issues**: For local testing, use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- **CORS errors**: Make sure `NEXT_PUBLIC_APP_URL` is set correctly

## Security Notes

- ⚠️ Never expose secret keys in client-side code
- ⚠️ Always use environment variables
- ⚠️ Test keys are safe to use in development
- ⚠️ Production keys must be kept secure
- ⚠️ Rotate keys if they're ever exposed

