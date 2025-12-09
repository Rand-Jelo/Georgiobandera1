# Cloudflare Pages Deployment Instructions

Your project is now configured for Cloudflare Pages deployment. Here are the steps to deploy:

## Quick Start: Deploy via Cloudflare Dashboard

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com/
   - Navigate to **Workers & Pages** → **Pages**
   - Click **Create application** → **Pages** → **Connect to Git**

2. **Connect Your GitHub Repository**
   - Authorize Cloudflare to access your GitHub account
   - Select repository: `Rand-Jelo/Georgiobandera1`
   - Click **Begin setup**

3. **Configure Build Settings**
   - **Framework preset**: Select "None" (we'll configure manually)
   - **Production branch**: `main`
   - **Build command**: `npm install && npm run build:cf`
   - **Build output directory**: `.open-next`
   - **Root directory**: `/` (leave as default)
   - **Node version**: `20` (or `18`)

4. **Set Environment Variables**
   In the **Environment variables** section, add:
   - `NODE_VERSION`: `20`
   - Any other environment variables your app needs (JWT_SECRET, etc.)

5. **Configure D1 Database**
   - Go to **Workers & Pages** → **D1**
   - Click **Create database**
   - Name: `georgiobandera-db`
   - Copy the database ID
   - Update `wrangler.toml` with the database ID:
     ```toml
     [[d1_databases]]
     binding = "DB"
     database_name = "georgiobandera-db"
     database_id = "YOUR_DATABASE_ID_HERE"
     ```
   - In Pages project settings → **Settings** → **Functions** → **D1 database bindings**
   - Add binding: Name `DB`, Database: `georgiobandera-db`

6. **Run Database Migrations**
   After the database is created, run migrations:
   ```bash
   npm run db:migrate
   ```
   Or use Wrangler CLI:
   ```bash
   wrangler d1 migrations apply georgiobandera-db
   ```

7. **Configure R2 Bucket** (for product images)
   - Go to **Workers & Pages** → **R2**
   - Click **Create bucket**
   - Name: `georgiobandera-images`
   - In Pages project settings → **Settings** → **Functions** → **R2 bucket bindings**
   - Add binding: Name `IMAGES`, Bucket: `georgiobandera-images`

8. **Deploy**
   - Click **Save and Deploy**
   - Cloudflare will build and deploy your site
   - Your site will be available at `https://your-project.pages.dev`

## Alternative: Deploy via Wrangler CLI

If you prefer using the command line:

1. **Login to Cloudflare**
   ```bash
   npx wrangler login
   ```

2. **Create D1 Database**
   ```bash
   npm run db:create
   ```
   Copy the database ID and update `wrangler.toml`

3. **Run Migrations**
   ```bash
   npm run db:migrate
   ```

4. **Build and Deploy**
   ```bash
   npm run build:cf
   npx wrangler pages deploy .open-next
   ```

## Important Notes

- The project uses OpenNext Cloudflare adapter for Next.js 16 compatibility
- Make sure all environment variables are configured in Cloudflare Pages
- D1 database and R2 bucket bindings must be configured in Pages settings
- The build process may take several minutes on first deployment

## Troubleshooting

- If build fails, check the build logs in Cloudflare Pages dashboard
- Ensure Node.js version is set correctly (18 or 20)
- Verify all environment variables are set
- Check that D1 and R2 bindings are properly configured

