# Cloudflare Pages Final Setup Checklist

## ✅ Completed Changes

1. **Next.js Downgrade**: `16.0.8` → `15.5.7` (better Cloudflare compatibility)
2. **React Downgrade**: `19.2.1` → `18.3.1` (matches Next.js 15)
3. **Compatibility Date**: Updated to `2025-12-09` in `wrangler.toml`
4. **Compatibility Flags**: Already set in `wrangler.toml` as `["nodejs_compat"]`

## ⚠️ Important: Cloudflare Pages Dashboard Settings

### Compatibility Flags (CRITICAL)
The compatibility flags in `wrangler.toml` are good, but **you MUST also set them in the Cloudflare Pages dashboard**:

1. Go to **Cloudflare Dashboard** → **Pages** → Your Project
2. Click **Settings** → **Runtime**
3. Find **"Compatibility flags"**
4. Add: `nodejs_compat`
5. Click **Save**

**Why?** Cloudflare Pages needs this flag in the dashboard to properly execute the worker and detect Functions.

## 📝 About `[[functions]]` Section

**You DON'T need a `[[functions]]` section in `wrangler.toml` for Cloudflare Pages.**

- `[[functions]]` is for **Cloudflare Workers** (standalone workers)
- **Cloudflare Pages** auto-detects functions from the `.open-next` output
- The compatibility flags at the top level of `wrangler.toml` are sufficient

## 🔄 Middleware

The current middleware using `next-intl` is correct and handles:
- Root path (`/`) → redirects to `/en`
- Locale routing (`/en/*`, `/sv/*`)
- Static file exclusions
- API route exclusions

**No changes needed** - `next-intl`'s middleware is the right approach for i18n.

## 🧪 Testing Steps After Deployment

1. **Check Build Logs**: Should see "Next.js 15.5.7" (no warnings about Next.js 16)
2. **Check Functions Detection**: 
   - Go to **Deployments** → Latest deployment
   - Should NOT see "static site" error
   - Should be able to tail logs
3. **Test Routes**:
   - `https://your-site.pages.dev/` → Should redirect to `/en`
   - `https://your-site.pages.dev/en` → Should show homepage
   - `https://your-site.pages.dev/sv` → Should show Swedish homepage
   - `https://your-site.pages.dev/en/shop` → Should show shop page
   - `https://your-site.pages.dev/api/categories` → Should return JSON
4. **Purge Cache** (if needed):
   - **Dashboard** → **Caching** → **Purge Everything**
5. **Check Real-time Logs**:
   - **Pages** → **Functions** → **Stream logs**
   - Test a route and watch for errors

## 🐛 If Still Having Issues

### Local Testing
```bash
npm run build:cf
npx wrangler pages dev .open-next
# Test on http://localhost:8787
```

### Verify API Routes
```bash
curl https://your-site.pages.dev/api/categories
# Should return JSON, not 404
```

### Check Function Logs
- Go to **Pages** → **Functions** → **Stream logs**
- Look for "No matching route" or fetch errors
- Check if requests are reaching the worker

## 📊 Expected Behavior

After these changes:
- ✅ Build completes without Next.js 16 warnings
- ✅ Functions are detected (not "static site")
- ✅ Routes work (`/en`, `/sv`, `/en/shop`, etc.)
- ✅ API routes work (`/api/categories`, etc.)
- ✅ Real-time logs are available

## 🎯 Next Steps

1. Wait for deployment to complete
2. Verify compatibility flags are set in dashboard
3. Test all routes
4. Check function logs
5. If everything works, proceed with:
   - Stripe integration
   - PayPal integration
   - Admin panel setup
   - R2 image uploads

