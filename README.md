# Georgio Bandera - Premium Headless E-commerce

A high-performance, dual-language e-commerce platform built for scale. This project replaces generic platforms with a bespoke **Next.js 14** architecture, offering sub-second page loads, complex product logic, and a completely custom admin dashboard.

## Project Overview

**Georgio Bandera** is a modern fashion e-commerce store designed to provide a premium user experience. It features a custom-built backend using **Cloudflare D1** (SQLite at the Edge) and **Next.js App Router**, ensuring global low-latency access. 

Unlike standard Shopify themes, this solution offers:
- **Zero monthly platform fees** (Self-hosted on Cloudflare Pages).
- **Complex Variant Logic**: Smart inventory tracking for Size/Color combinations.
- **Dynamic Shipping**: Multi-threshold shipping rates per region (e.g., Free shipping over 1000 SEK).
- **Bilingual Support**: Native English & Swedish content management.

## Key Features

### Storefront Experience
- **Ultra-Fast Navigation**: Built with Next.js Server Components and extensive caching.
- **Smart Search & Filtering**: Instant product filtering by category, price, and stock status.
- **Dynamic "Ingredients" Tab**: Custom product attributes for transparent product details.
- **Wishlist & Cart**: Persistent cart state and local-storage wishlist.
- **Optimized Checkout**: Integrated Stripe and PayPal for secure, seamless payments.

### Custom Admin Dashboard
- **Product Management**: Create, edit, and archive products with rich text descriptions.
- **Inventory Control**: Track stock levels per variant (SKU level).
- **Order Processing**: View and manage customer orders in real-time.
- **Shipping Configuration**: Set dynamic shipping rules and free-shipping thresholds per country.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS + Headless UI
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (Image hosting)
- **Deploy**: Cloudflare Pages
- **Payments**: Stripe & PayPal
- **i18n**: next-intl (EN/SV)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Cloudflare account
- Stripe account
- PayPal account

### Installation

1. Clone the repository:
```bash
git clone <https://github.com/Rand-Jelo/Georgiobandera1>
cd georgiobandera1
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Open `.env` and configure the following required variables:
- **Stripe**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Email (Resend)**: `RESEND_API_KEY`
- **Auth**: `NEXTAUTH_SECRET` (any random long string is fine for development)
- **URLs**: `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000` for dev)
- **Email**: `ADMIN_NOTIFICATION_EMAIL` (your email address)

4. Set up Cloudflare D1 database:
```bash
# Create the database
npm run db:create

# Run migrations
npm run db:migrate
```

5. Update `wrangler.toml` with your database ID after creation.

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

### Deployment

Deploy to Cloudflare Pages:
```bash
npm run cf:deploy
```

Or connect your GitHub repository to Cloudflare Pages for automatic deployments.

## Project Structure

```
georgiobandera1/
├── app/                    # Next.js App Router
│   ├── [locale]/          # i18n routes (en, sv)
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── cart/              # Cart components
│   ├── product/           # Product components
│   └── layout/            # Layout components
├── lib/                   # Utilities and helpers
│   ├── db/                # D1 database client
│   ├── stripe/            # Stripe integration
│   ├── paypal/            # PayPal integration
│   ├── i18n/              # i18n configuration
│   └── email/             # Email utilities
├── admin/                 # AdminJS configuration
├── public/                # Static assets
├── migrations/            # D1 database migrations
└── types/                 # TypeScript types
```

## Database Migrations

Database migrations are located in the `migrations/` directory. To apply migrations:

```bash
npm run db:migrate
```

## Environment Variables

See `.env.example` for all required environment variables.

## Git Workflow

- `main` → Production (auto-deploy to Cloudflare Pages)
- `dev` → Staging environment
- `feature/*` → Feature development
- `hotfix/*` → Urgent fixes

## License

Private - All rights reserved
# Trigger redeploy
