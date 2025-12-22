# Payment API Keys Setup for Cloudflare Pages

## Quick Setup Guide

### Step 1: Get Your Test API Keys

#### Stripe Test Keys:
1. Go to https://dashboard.stripe.com
2. Sign up or log in
3. **Toggle to Test mode** (switch in top right corner)
4. Go to **Developers** → **API keys**
5. Copy:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"

#### PayPal Sandbox Keys:
1. Go to https://developer.paypal.com
2. Sign up or log in
3. Go to **Dashboard** → **My Apps & Credentials**
4. Click **Create App** (make sure it's Sandbox, not Live)
5. Name it (e.g., "Georgio Bandera Test")
6. Select **Merchant** account type
7. Click **Create App**
8. Copy:
   - **Client ID**
   - **Secret** (click "Show" to reveal)

### Step 2: Add Keys to Cloudflare Pages

1. Go to your Cloudflare Pages dashboard
2. Select your project: **georgiobandera1**
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

#### For Production (or Preview):
```
STRIPE_SECRET_KEY = sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_your_key_here
PAYPAL_CLIENT_ID = your_paypal_client_id
PAYPAL_CLIENT_SECRET = your_paypal_secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID = your_paypal_client_id (same as above)
NEXT_PUBLIC_APP_URL = https://your-domain.pages.dev
```

5. Click **Save**

### Step 3: Test the Integration

1. **Deploy** your site (or wait for automatic deployment)
2. Add a product to cart
3. Go to checkout
4. Fill in shipping address
5. Select payment method:
   - **Stripe**: Use test card `4242 4242 4242 4242` (any future date, any CVC)
   - **PayPal**: Use a PayPal sandbox test account

### Step 4: Verify Payments

- **Stripe**: Check https://dashboard.stripe.com/test/payments
- **PayPal**: Check https://developer.paypal.com/dashboard/notifications/sandbox

## Important Notes

✅ **Test keys are safe** - They don't process real payments
✅ **Works with Cloudflare Pages** - Environment variables are automatically available
✅ **No code changes needed** - Just add the keys in Cloudflare dashboard

## Switching to Production Keys

When ready to go live:

1. **Stripe**:
   - Switch to **Live mode** in Stripe dashboard
   - Get live keys (start with `pk_live_` and `sk_live_`)
   - Update Cloudflare Pages environment variables

2. **PayPal**:
   - Create a **Live App** in PayPal dashboard
   - Get live credentials
   - Update Cloudflare Pages environment variables

3. **Test with small amount first** before going fully live!

## Troubleshooting

- **"Stripe is not configured"**: Check that `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are set
- **"PayPal is not configured"**: Check that `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `NEXT_PUBLIC_PAYPAL_CLIENT_ID` are set
- **Payment form not showing**: Make sure you've completed the shipping address first
- **Keys not working**: Verify you're using test/sandbox keys, not production keys

## Security

- ⚠️ Never commit API keys to Git
- ⚠️ Only use environment variables in Cloudflare Pages
- ⚠️ Test keys are safe to use in development
- ⚠️ Production keys must be kept secure

