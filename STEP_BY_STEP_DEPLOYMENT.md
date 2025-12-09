# Step-by-Step Cloudflare Pages Deployment Guide

Follow these steps carefully to deploy your e-commerce website to Cloudflare Pages.

---

## Step 1: Access Cloudflare Dashboard

1. Open your web browser and go to: **https://dash.cloudflare.com/**
2. Log in with your Cloudflare account (or create one if you don't have it)
3. Once logged in, you'll see the Cloudflare dashboard

---

## Step 2: Navigate to Pages

1. In the left sidebar, look for **"Workers & Pages"**
2. Click on **"Workers & Pages"**
3. You'll see tabs at the top - click on the **"Pages"** tab
4. Click the **"Create application"** button (usually a blue button in the top right)
5. In the modal that appears, make sure the **"Pages"** tab is selected (not Workers)
6. Click **"Connect to Git"**

---

## Step 3: Connect Your GitHub Repository

1. You'll see a list of Git providers - click **"GitHub"**
2. If this is your first time, Cloudflare will ask you to authorize access to your GitHub account
   - Click **"Authorize Cloudflare"**
   - You may need to enter your GitHub password
   - Review the permissions and click **"Authorize"**
3. After authorization, you'll see a list of your GitHub repositories
4. Find and select: **`Rand-Jelo/Georgiobandera1`**
5. Click **"Begin setup"** button

---

## Step 4: Configure Project Settings

You'll now see the project configuration page. Fill in the following:

### Project Name
- **Project name**: `georgiobandera` (or any name you prefer)
- This will be used in your URL: `https://georgiobandera.pages.dev`

### Production Branch
- **Production branch**: `main`
- This is the branch that will be deployed to production

### Build Settings
1. **Framework preset**: 
   - Click the dropdown
   - Select **"None"** (we're configuring manually)

2. **Build command**:
   - Enter: `npm install && npm run build:cf`
   - This installs dependencies and builds for Cloudflare

3. **Build output directory**:
   - Enter: `.open-next`
   - This is where OpenNext outputs the build

4. **Root directory**:
   - Leave as `/` (default)

5. **Node.js version**:
   - Click the dropdown
   - Select **"20"** (or "18" if 20 is not available)

### Environment Variables (Production)
Click **"Add variable"** and add:
- **Variable name**: `NODE_VERSION`
- **Value**: `20`
- Click **"Save"**

> **Note**: You can add more environment variables later (like JWT_SECRET, etc.) in the project settings.

---

## Step 5: Create D1 Database

**IMPORTANT**: Do this BEFORE clicking "Save and Deploy"

1. In a new tab, go back to Cloudflare Dashboard
2. Navigate to **Workers & Pages** → **D1** (in the left sidebar)
3. Click **"Create database"** button
4. Fill in:
   - **Database name**: `georgiobandera-db`
   - **Region**: Choose closest to your users (e.g., "Western North America" or "Western Europe")
5. Click **"Create"**
6. **IMPORTANT**: Copy the **Database ID** (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
7. Keep this tab open - you'll need it in the next step

---

## Step 6: Update Wrangler Configuration

1. Go back to your local project
2. Open `wrangler.toml` file
3. Find the line that says:
   ```toml
   database_id = "" # Will be set after creating the database
   ```
4. Replace the empty string with your Database ID:
   ```toml
   database_id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"  # Your actual ID
   ```
5. Save the file
6. Commit and push to GitHub:
   ```bash
   git add wrangler.toml
   git commit -m "Add D1 database ID"
   git push
   ```

---

## Step 7: Run Database Migrations

1. Open your terminal in the project directory
2. Make sure you're logged into Cloudflare:
   ```bash
   npx wrangler login
   ```
   - This will open a browser window for authentication
   - Click "Allow" to authorize

3. Run the migrations to create your database tables:
   ```bash
   npm run db:migrate
   ```
   - Or: `npx wrangler d1 migrations apply georgiobandera-db`

4. You should see output like:
   ```
   ✅ Successfully applied migration 001_initial_schema.sql
   ```

---

## Step 8: Configure D1 Database Binding in Pages

1. Go back to the Cloudflare Pages project setup page (where you configured build settings)
2. **DON'T click "Save and Deploy" yet!**
3. Scroll down to find **"Functions"** section
4. Look for **"D1 database bindings"** or **"Bindings"**
5. Click **"Add binding"** or **"Add D1 database"**
6. Fill in:
   - **Variable name**: `DB` (must be exactly "DB" - case sensitive)
   - **D1 database**: Select `georgiobandera-db` from the dropdown
7. Click **"Save"**

---

## Step 9: Create R2 Bucket (for Product Images)

1. In Cloudflare Dashboard, go to **Workers & Pages** → **R2** (in the left sidebar)
2. Click **"Create bucket"** button
3. Fill in:
   - **Bucket name**: `georgiobandera-images`
   - **Location**: Choose a region (e.g., "Auto" or closest to your users)
4. Click **"Create bucket"**
5. The bucket is now created - you don't need to copy any ID for this

---

## Step 10: Configure R2 Bucket Binding in Pages

1. Go back to the Cloudflare Pages project setup page
2. Still in the **"Functions"** or **"Bindings"** section
3. Look for **"R2 bucket bindings"**
4. Click **"Add binding"** or **"Add R2 bucket"**
5. Fill in:
   - **Variable name**: `IMAGES` (must be exactly "IMAGES" - case sensitive)
   - **R2 bucket**: Select `georgiobandera-images` from the dropdown
6. Click **"Save"**

---

## Step 11: Final Review and Deploy

Before deploying, double-check:

✅ **Build Settings**:
- Framework preset: None
- Build command: `npm install && npm run build:cf`
- Build output directory: `.open-next`
- Node version: 20

✅ **Environment Variables**:
- NODE_VERSION: 20

✅ **D1 Database Binding**:
- Variable name: `DB`
- Database: `georgiobandera-db`

✅ **R2 Bucket Binding**:
- Variable name: `IMAGES`
- Bucket: `georgiobandera-images`

✅ **Database Migrations**: Already run

---

## Step 12: Deploy!

1. Scroll to the bottom of the configuration page
2. Click the big blue **"Save and Deploy"** button
3. Cloudflare will now:
   - Clone your repository
   - Install dependencies
   - Run the build command
   - Deploy your site

4. You'll see a deployment progress screen
5. The first deployment may take **5-10 minutes**
6. You can watch the build logs in real-time

---

## Step 13: Wait for Deployment

1. You'll see build logs streaming in
2. Look for messages like:
   - "Installing dependencies..."
   - "Running build command..."
   - "Deploying to Cloudflare Pages..."

3. If you see any errors, check:
   - Build logs for specific error messages
   - Environment variables are set correctly
   - Database and R2 bindings are configured

4. When successful, you'll see:
   - ✅ "Deployment successful"
   - A URL like: `https://georgiobandera.pages.dev`

---

## Step 14: Access Your Site

1. Once deployment is complete, click on your project name
2. You'll see the deployment details
3. Click on the **"View site"** button or the URL
4. Your site should now be live! 🎉

---

## Step 15: Set Up Custom Domain (Optional)

1. In your Pages project, go to **"Custom domains"**
2. Click **"Set up a custom domain"**
3. Enter your domain: `georgiobandera.se`
4. Follow the DNS configuration instructions
5. Cloudflare will automatically configure SSL

---

## Troubleshooting Common Issues

### Build Fails
- **Check build logs** for specific errors
- Verify Node version is set to 20
- Ensure `build:cf` script works locally: `npm run build:cf`

### Database Connection Errors
- Verify D1 database binding is named exactly `DB`
- Check that migrations were run successfully
- Ensure database ID is correct in `wrangler.toml`

### R2 Access Errors
- Verify R2 bucket binding is named exactly `IMAGES`
- Check bucket name matches: `georgiobandera-images`

### Environment Variables Not Working
- Go to **Settings** → **Environment variables**
- Add variables for both **Production** and **Preview** environments
- Redeploy after adding variables

---

## Next Steps After Deployment

1. **Test your site**:
   - Visit the homepage
   - Test product pages
   - Try adding items to cart
   - Test checkout flow

2. **Add more environment variables** if needed:
   - JWT_SECRET (for authentication)
   - Stripe keys (when integrating payments)
   - PayPal keys (when integrating payments)

3. **Set up automatic deployments**:
   - Every push to `main` branch will automatically deploy
   - Preview deployments are created for pull requests

---

## Quick Reference Commands

```bash
# Login to Cloudflare
npx wrangler login

# Create database (if not done via dashboard)
npm run db:create

# Run migrations
npm run db:migrate

# Build for Cloudflare locally
npm run build:cf

# Preview locally (optional)
npm run preview:cf
```

---

**Congratulations!** Your e-commerce website is now deployed to Cloudflare Pages! 🚀

