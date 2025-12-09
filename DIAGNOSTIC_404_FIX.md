# Diagnostic: 404 Errors on Cloudflare Pages

## Current Status
✅ Build succeeds  
✅ Worker.js generated (`/.open-next/worker.js`)  
✅ _routes.json in place  
✅ Next.js 15.5.7 (compatible version)  
❌ Pages still return 404

## Critical Checklist

### 1. Compatibility Flags (MOST IMPORTANT)
**This is likely the root cause.**

Go to Cloudflare Pages Dashboard:
1. **Pages** → Your Project → **Settings** → **Runtime**
2. Find **"Compatibility flags"** field
3. Click the **pencil icon** to edit
4. Add: `nodejs_compat`
5. Click **Save**
6. **Redeploy** (Deployments → Retry deployment)

**Without this flag, Cloudflare Pages cannot execute the worker.js file.**

### 2. Verify Worker.js Location
The worker should be at: `.open-next/worker.js` (root of build output)

Check in Cloudflare Pages:
- Go to **Deployments** → Latest deployment → **View build output**
- Verify `worker.js` exists in the root
- Verify `_routes.json` exists in the root

### 3. Check Function Detection
After adding compatibility flags and redeploying:
1. Go to **Deployments** → Latest deployment
2. Click on the deployment
3. Look for **"Functions"** tab or section
4. You should see function invocations listed
5. If you see "static site" message, compatibility flags are missing

### 4. Test API Routes First
API routes are simpler and help verify the worker is executing:

```bash
curl https://your-site.pages.dev/api/categories
```

**Expected**: JSON response  
**If 404**: Worker not executing (compatibility flags issue)

### 5. Check Real-time Logs
1. Go to **Pages** → **Analytics & logs** → **Real-time Logs**
2. Visit your site
3. You should see log entries appear
4. If no logs appear, worker isn't executing

### 6. Verify Build Output Structure
After build, `.open-next/` should contain:
```
.open-next/
├── worker.js          ← Main worker (CRITICAL)
├── _routes.json       ← Routing config (CRITICAL)
├── assets/            ← Static files
├── server-functions/  ← Server handlers
├── middleware/        ← Middleware handler
└── cloudflare/        ← Cloudflare-specific code
```

## Common Issues & Solutions

### Issue: "Static site" error in logs
**Solution**: Add `nodejs_compat` compatibility flag in dashboard

### Issue: Worker.js exists but not executing
**Solution**: 
1. Verify compatibility flags
2. Check that `_routes.json` includes `["/*"]`
3. Redeploy after making changes

### Issue: API routes work but pages don't
**Solution**: Check middleware configuration and locale routing

### Issue: Build succeeds but deployment shows errors
**Solution**: Check deployment logs for specific error messages

## Step-by-Step Fix

1. **Add Compatibility Flags** (Dashboard → Settings → Runtime)
   - Add: `nodejs_compat`
   - Save

2. **Redeploy**
   - Go to Deployments
   - Click "Retry deployment" on latest
   - Wait for completion

3. **Test API Route**
   ```bash
   curl https://your-site.pages.dev/api/categories
   ```
   - Should return JSON, not 404

4. **Test Root Route**
   - Visit: `https://your-site.pages.dev/`
   - Should redirect to `/en`
   - Should show homepage, not 404

5. **Check Function Logs**
   - Go to Real-time Logs
   - Visit site
   - Should see log entries

## If Still 404 After All Steps

1. **Check Deployment Logs**
   - Look for any errors during upload
   - Verify all files uploaded successfully

2. **Verify wrangler.toml**
   - `pages_build_output_dir = ".open-next"` ✓
   - `compatibility_flags = ["nodejs_compat"]` ✓
   - `compatibility_date = "2025-12-09"` ✓

3. **Check Build Script**
   - Verify `build:cf` script runs correctly
   - Verify `_routes.json` is copied to `.open-next/`

4. **Contact Cloudflare Support**
   - If all above steps are correct
   - Provide deployment ID and logs

## Verification Commands

After deployment, test these:

```bash
# Test API (should work first)
curl https://your-site.pages.dev/api/categories

# Test root (should redirect)
curl -I https://your-site.pages.dev/

# Test locale route
curl -I https://your-site.pages.dev/en

# Test shop page
curl -I https://your-site.pages.dev/en/shop
```

All should return 200 (or 301/302 for redirects), not 404.

