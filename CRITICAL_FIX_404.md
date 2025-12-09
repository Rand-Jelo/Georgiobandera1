# CRITICAL FIX: 404 Errors on Cloudflare Pages

## ⚠️ IMMEDIATE ACTION REQUIRED

You're getting 404 errors because **Cloudflare Pages cannot execute the worker without compatibility flags set in the dashboard**.

## Step 1: Add Compatibility Flags in Dashboard (DO THIS NOW)

1. Go to **Cloudflare Dashboard** → **Workers & Pages** → **Pages**
2. Click on your project: **georgiobandera1**
3. Click **Settings** tab
4. Scroll down to **Runtime** section
5. Find **"Compatibility flags"** field
6. Click the **pencil icon** (✏️) to edit
7. In the input field, type: `nodejs_compat`
8. Click **Save**

**This is the #1 cause of 404 errors. Without this, Cloudflare Pages treats your site as static HTML only.**

## Step 2: Verify Build Output Structure

After the next deployment, verify these files exist in the build output:

1. Go to **Deployments** → Latest deployment
2. Click **"View build output"** or **"Functions"** tab
3. Verify these files exist:
   - ✅ `worker.js` (main function)
   - ✅ `_routes.json` (routing config)
   - ✅ `assets/` (static files)

## Step 3: Redeploy After Adding Flags

After adding compatibility flags:

1. Go to **Deployments** tab
2. Click **"Retry deployment"** on the latest deployment
3. Wait for deployment to complete (2-3 minutes)
4. The deployment should show **"Success"**

## Step 4: Test After Redeploy

After redeploying with compatibility flags:

### Test 1: API Route (Simplest)
```bash
curl https://ad1498ee.georgiobandera1.pages.dev/api/categories
```
**Expected**: JSON response (not 404)

### Test 2: Root Path
Visit: `https://ad1498ee.georgiobandera1.pages.dev/`
**Expected**: Redirects to `/en` (not 404)

### Test 3: Locale Path
Visit: `https://ad1498ee.georgiobandera1.pages.dev/en`
**Expected**: Shows homepage (not 404)

## Step 5: Check Function Logs

1. Go to **Pages** → **Analytics & logs** → **Real-time Logs**
2. Visit your site
3. You should see log entries appear
4. If you see "static site" error, compatibility flags are still missing

## Why This Happens

Cloudflare Pages needs the `nodejs_compat` flag to:
- Execute Node.js code in Workers
- Run Next.js server-side rendering
- Handle dynamic routes
- Process API routes

**Without this flag, Pages treats your deployment as static HTML files only, which causes 404s on all dynamic routes.**

## Current Configuration Status

✅ **Code Configuration** (Already Done):
- `wrangler.toml` has `compatibility_flags = ["nodejs_compat"]`
- `wrangler.toml` has `[[functions]]` section with compatibility flags
- `_routes.json` is in place
- Next.js 15.5.7 (compatible version)
- Build succeeds

❌ **Dashboard Configuration** (YOU NEED TO DO THIS):
- Compatibility flags NOT set in Pages dashboard
- This is why you're getting 404s

## If Still 404 After Adding Flags

If you've added the flags and redeployed but still get 404s:

1. **Verify flags are saved**: Go back to Settings → Runtime → Check compatibility flags field shows `nodejs_compat`
2. **Check deployment logs**: Look for any errors during deployment
3. **Test API route first**: `/api/categories` should work before pages do
4. **Check function detection**: Deployments → Latest → Should show Functions, not "static site"

## Quick Checklist

- [ ] Added `nodejs_compat` in Pages → Settings → Runtime
- [ ] Saved the settings
- [ ] Retried deployment
- [ ] Waited for deployment to complete
- [ ] Tested `/api/categories` (should return JSON)
- [ ] Tested `/` (should redirect to `/en`)
- [ ] Tested `/en` (should show homepage)

## Need Help?

If you've completed all steps and still get 404s:
1. Share a screenshot of Settings → Runtime showing compatibility flags
2. Share the latest deployment logs
3. Share the result of `curl https://ad1498ee.georgiobandera1.pages.dev/api/categories`

