# Cloudflare Pages Build Command Fix

## Current Issue
Cloudflare Pages is running `npm ci` automatically, which fails due to peer dependency conflicts. The error shows missing packages that are actually peer dependencies.

## Solution: Update Build Command

In your Cloudflare Pages dashboard, update the **Build command** to:

```
npm install --legacy-peer-deps && npm run build:cf
```

This will:
1. Install dependencies with legacy peer dependency resolution (more lenient)
2. Build the project for Cloudflare

## Steps to Update

1. Go to your Cloudflare Pages project
2. Click **Settings** tab
3. Scroll to **Builds & deployments** section
4. Find **Build command** field
5. Change from: `npm install && npm run build:cf`
6. Change to: `npm install --legacy-peer-deps && npm run build:cf`
7. Click **Save**
8. Go to **Deployments** tab
9. Click **Retry deployment** on the latest failed deployment

## Why This Works

The `--legacy-peer-deps` flag tells npm to use the legacy (npm v4-v6) algorithm for resolving peer dependencies, which is more lenient and will install packages even if there are minor peer dependency version mismatches.

This is safe to use because:
- Your dependencies are compatible (React 19 works with Next.js 16)
- The peer dependency warnings are just version mismatches, not actual incompatibilities
- This is a common solution for projects with complex dependency trees

