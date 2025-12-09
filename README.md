# Georgio Bandera E-commerce Website

Full-featured e-commerce platform built with Next.js 16, Cloudflare D1, Stripe/PayPal payments, and multilingual support (English/Swedish).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (for images)
- **Payments**: Stripe (Cards + Klarna) & PayPal
- **Admin Panel**: AdminJS
- **i18n**: next-intl
- **Hosting**: Cloudflare Pages

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
git clone <repository-url>
cd georgiobandera1
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

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
