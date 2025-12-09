# Fix for Cloudflare Pages Build Command

## Issue
Cloudflare Pages runs `npm ci` automatically, which requires `package-lock.json` to be perfectly in sync. If there are peer dependency issues, the build fails.

## Solution
Update the build command in Cloudflare Pages settings to:

```
rm -f package-lock.json && npm install && npm run build:cf
```

This will:
1. Remove the existing lock file
2. Install dependencies fresh (which will create a new lock file)
3. Run the Cloudflare build

## Alternative Solution
If the above doesn't work, try:

```
npm install --legacy-peer-deps && npm run build:cf
```

This uses `--legacy-peer-deps` flag which is more lenient with peer dependency resolution.

## Steps to Update
1. Go to Cloudflare Pages project → **Settings** → **Builds & deployments**
2. Edit the **Build command** field
3. Replace with one of the commands above
4. Click **Save**
5. Trigger a new deployment

