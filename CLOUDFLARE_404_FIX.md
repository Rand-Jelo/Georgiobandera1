# Cloudflare Pages 404 Fix Guide

## Current Status
✅ Build succeeds
✅ Worker.js is generated
✅ Routes are being created
❌ Pages return 404

## Critical Fix: Add Compatibility Flags

**This is the most likely cause of the 404 errors.**

1. Go to Cloudflare Pages → **Settings** → **Runtime** section
2. Click the **pencil icon** next to **"Compatibility flags"**
3. Add: `nodejs_compat`
4. Click **Save**
5. **Redeploy** your site (go to Deployments → Retry deployment)

## Why This Matters

OpenNext Cloudflare requires Node.js compatibility to run Next.js server-side code. Without `nodejs_compat`, the worker may fail to execute routes properly, resulting in 404 errors.

## Verify After Adding Flags

After adding the compatibility flag and redeploying:

1. Visit your site root: `https://your-site.pages.dev/`
   - Should redirect to `/en`

2. Visit `/en` directly
   - Should show the homepage

3. Visit `/sv` directly
   - Should show the Swedish homepage

4. Check browser console for errors
   - Should not see 404 errors

## Alternative: Check Function Logs

If 404s persist after adding compatibility flags:

1. Go to **Deployments** → Latest deployment
2. Click on the deployment
3. Go to **Functions** tab
4. Check **Runtime logs** for errors
5. Look for:
   - Route matching errors
   - Middleware execution errors
   - Worker initialization errors

## Current Configuration Checklist

- ✅ Build command: `npm install --legacy-peer-deps && npm run build:cf`
- ✅ Build output: `.open-next`
- ✅ `_routes.json` in build output
- ✅ D1 binding: `DB` → `georgiobandera-db`
- ✅ R2 binding: `IMAGES` → `georgiobandera-images`
- ⚠️ **Compatibility flags: MUST ADD `nodejs_compat`**

## Next Steps

1. **Add `nodejs_compat` flag** in Cloudflare Pages Settings → Runtime
2. **Redeploy** (or wait for auto-deploy)
3. **Test** the site
4. If still 404, check Function logs for specific errors

