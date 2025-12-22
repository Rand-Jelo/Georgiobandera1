# Environment Variables Setup

Copy this file to `.env.local` for local development, or add these variables to Cloudflare Pages environment variables for production.

## Required Environment Variables

```env
# Stripe (Test Mode)
# Get from: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# PayPal (Sandbox Mode)
# Get from: https://developer.paypal.com/dashboard/applications/sandbox
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT Secret (for authentication)
# Generate with: openssl rand -base64 32
JWT_SECRET=your_jwt_secret_here
```

## How to Get Test Keys

### Stripe Test Keys:
1. Go to https://dashboard.stripe.com
2. Sign up or log in
3. Toggle to **Test mode** (top right)
4. Go to **Developers** → **API keys**
5. Copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### PayPal Sandbox Keys:
1. Go to https://developer.paypal.com
2. Sign up or log in
3. Go to **Dashboard** → **My Apps & Credentials**
4. Click **Create App** (Sandbox)
5. Copy:
   - **Client ID**
   - **Secret** (click Show)

## For Production

When ready to go live:
1. Switch Stripe to **Live mode** and get live keys
2. Create a **Live App** in PayPal and get live credentials
3. Update environment variables in Cloudflare Pages
4. Set up production webhooks

See `PAYMENT_SETUP.md` for detailed instructions.

