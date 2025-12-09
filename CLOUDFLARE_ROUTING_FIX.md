# Cloudflare Pages Routing Fix

## Issue
Pages are showing 404 errors even though the build succeeds.

## Solution Steps

### 1. Update Compatibility Flags in Cloudflare Pages Settings

In your Cloudflare Pages dashboard:
1. Go to **Settings** → **Runtime** section
2. Click the pencil icon next to **"Compatibility flags"**
3. Add: `nodejs_compat`
4. Click **Save**

### 2. Verify _routes.json is in Build Output

The `_routes.json` file should be in `.open-next/` (the build output root). Our build script already handles this, but verify it's there after build.

### 3. Check Build Output Structure

After building, `.open-next/` should contain:
- `worker.js` (the main worker file)
- `_routes.json` (routing configuration)
- `assets/` (static assets)
- Other OpenNext generated files

### 4. Alternative: Check if Routes Need Exclusions

If the issue persists, try updating `_routes.json` to exclude API routes:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/api/*"]
}
```

However, for Next.js with API routes, we typically want to include everything.

### 5. Verify Middleware is Working

The middleware should handle locale redirects. If it's not working, check:
- Middleware matcher is correct
- OpenNext config has middleware set to `external: true`

## Current Configuration

- ✅ Build command: `npm install --legacy-peer-deps && npm run build:cf`
- ✅ Build output: `.open-next`
- ✅ D1 binding: `DB` → `georgiobandera-db`
- ✅ R2 binding: `IMAGES` → `georgiobandera-images`
- ⚠️ Compatibility flags: Need to add `nodejs_compat` in Pages settings

