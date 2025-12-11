# R2 Bucket Setup Instructions

## Issue: Images not uploading to R2

If images are not being stored in R2, follow these steps:

## Step 1: Verify R2 Bucket Exists

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **R2** (in left sidebar)
3. Check if bucket `georgiobandera-images` exists
4. If it doesn't exist:
   - Click **"Create bucket"**
   - Name: `georgiobandera-images`
   - Location: Choose "Auto" or closest region
   - Click **"Create bucket"**

## Step 2: Configure R2 Binding in Cloudflare Pages

**This is the most important step!** The binding must be configured in the Pages dashboard.

1. Go to your Pages project: **Workers & Pages** → **Pages** → Click on your project
2. Click on **"Settings"** tab (at the top)
3. Scroll down to **"Functions"** section
4. Look for **"R2 bucket bindings"** (or expand **"Bindings"**)
5. Click **"Add binding"** or **"Add R2 bucket"**
6. Fill in:
   - **Variable name**: `IMAGES` (must be exactly "IMAGES" - case sensitive, no quotes)
   - **R2 bucket**: Select `georgiobandera-images` from the dropdown
7. Click **"Save"**

## Step 3: Verify Binding Configuration

After saving, you should see:
- Variable name: `IMAGES`
- R2 bucket: `georgiobandera-images`

## Step 4: Redeploy

After configuring the binding, you need to trigger a new deployment:

1. Go to **Deployments** tab
2. Click **"Retry deployment"** on the latest deployment, OR
3. Make a small commit and push to trigger auto-deployment

## Step 5: Test Upload

1. Go to your admin panel
2. Try uploading an image
3. Check the browser console (F12) for any errors
4. Check Cloudflare Pages logs for error messages
5. Verify the image appears in R2 bucket

## Troubleshooting

### If upload still fails:

1. **Check Cloudflare Pages Logs:**
   - Go to your Pages project → **Deployments** → Click on latest deployment
   - Check the logs for error messages
   - Look for "R2 bucket not available" or similar errors

2. **Verify Binding Name:**
   - The binding name MUST be exactly `IMAGES` (uppercase)
   - Check in Settings → Functions → R2 bucket bindings

3. **Check Bucket Name:**
   - The bucket name should be `georgiobandera-images`
   - Verify it exists in R2 dashboard

4. **Test R2 Access:**
   - The code now includes better error logging
   - Check the console logs when uploading
   - You should see "R2 bucket retrieved successfully" if working

## Important Notes

- The `wrangler.toml` file has the R2 configuration, but **Cloudflare Pages requires the binding to be configured in the dashboard as well**
- The binding name `IMAGES` must match exactly (case-sensitive)
- After configuring the binding, a new deployment is required for changes to take effect
- The bucket must exist before you can bind it

