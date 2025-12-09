# Cloudflare Pages Deployment Guide

## Option 1: Deploy via Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard**
   - Navigate to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Go to **Workers & Pages** → **Pages**
   - Click **Create application** → **Pages** → **Connect to Git**

2. **Connect GitHub Repository**
   - Authorize Cloudflare to access your GitHub account
   - Select repository: `Rand-Jelo/Georgiobandera1`
   - Click **Begin setup**

3. **Configure Build Settings**
   - **Framework preset**: Select "Next.js (Static HTML Export)" or "None"
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: `/` (leave as default)

4. **Environment Variables**
   Add the following environment variables in Cloudflare Pages:
   - `NODE_VERSION`: `18` or `20`
   - Any other environment variables your app needs

5. **D1 Database Setup**
   - Go to **Workers & Pages** → **D1**
   - Create a new database: `georgiobandera-db`
   - Copy the database ID
   - Update `wrangler.toml` with the database ID
   - In Pages settings, go to **Settings** → **Functions** → **D1 database bindings**
   - Add binding: `DB` → Select your database

6. **R2 Bucket Setup** (for images)
   - Go to **Workers & Pages** → **R2**
   - Create bucket: `georgiobandera-images`
   - In Pages settings, go to **Settings** → **Functions** → **R2 bucket bindings**
   - Add binding: `IMAGES` → Select your bucket

7. **Deploy**
   - Click **Save and Deploy**
   - Your site will be available at `https://your-project.pages.dev`

## Option 2: Deploy via Wrangler CLI

1. **Install Wrangler** (if not already installed)
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Create D1 Database**
   ```bash
   npm run db:create
   ```
   - Copy the database ID and update `wrangler.toml`

4. **Run Migrations**
   ```bash
   npm run db:migrate
   ```

5. **Build and Deploy**
   ```bash
   npm run build
   wrangler pages deploy .next
   ```

## Important Notes

- For Next.js 16 with API routes, Cloudflare Pages may require additional configuration
- Make sure all environment variables are set in Cloudflare Pages dashboard
- D1 database bindings must be configured in Pages settings
- R2 bucket bindings must be configured in Pages settings

