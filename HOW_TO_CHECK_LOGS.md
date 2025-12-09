# How to Check Function Logs in Cloudflare Pages

## Method 1: Through Deployments (Recommended)

1. **Go to your Cloudflare Pages project**
   - Navigate to: https://dash.cloudflare.com/
   - Go to **Workers & Pages** → **Pages**
   - Click on your project: **georgiobandera1**

2. **Open the Deployments tab**
   - Click on the **"Deployments"** tab at the top
   - You'll see a list of all deployments

3. **Select a deployment**
   - Click on the latest deployment (or any deployment you want to check)
   - This opens the deployment details page

4. **View Function Logs**
   - In the deployment details page, look for:
     - **"Functions"** tab or section
     - **"Runtime logs"** or **"Logs"** button
     - **"View logs"** link
   - Click on it to see the function execution logs

## Method 2: Through Analytics & Logs

1. **Go to Analytics & Logs**
   - In the left sidebar, click **"Analytics & logs"**
   - Or go directly to: https://dash.cloudflare.com/?to=/:account/workers/analytics

2. **Select your Pages project**
   - Find **"georgiobandera1"** in the list
   - Click on it

3. **View Logs**
   - You'll see tabs like:
     - **"Metrics"** - Performance metrics
     - **"Logs"** - Real-time function logs
     - **"Traces"** - Request traces
   - Click on **"Logs"** to see function execution logs

## Method 3: Real-time Logs (Tail)

1. **Go to your project**
   - Workers & Pages → Pages → georgiobandera1

2. **Look for "Logs" or "Tail" option**
   - Some Cloudflare Pages projects have a **"Tail"** or **"Live logs"** option
   - This shows real-time logs as requests come in

## What to Look For in Logs

When checking logs for 404 errors, look for:

1. **Request information:**
   - URL path (e.g., `/sv`, `/en/products`)
   - HTTP method (GET, POST, etc.)
   - Status code (404, 500, etc.)

2. **Error messages:**
   - Route not found errors
   - Middleware errors
   - Worker initialization errors
   - Database connection errors

3. **Execution flow:**
   - Whether middleware executed
   - Whether the route handler was called
   - Any exceptions or timeouts

## Example Log Entries

Good logs might show:
```
[INFO] Request: GET /en
[INFO] Middleware executed
[INFO] Route matched: /[locale]
[INFO] Response: 200 OK
```

Error logs might show:
```
[ERROR] Route not found: /sv
[ERROR] No route handler for path: /sv
[ERROR] Worker initialization failed
```

## Tips

- **Filter logs** by time range, status code, or path
- **Search logs** for specific error messages or paths
- **Export logs** if needed for debugging
- **Check both Production and Preview** environments if applicable

## If You Can't Find Logs

1. Make sure you're looking at the correct deployment
2. Check if the deployment has Functions enabled
3. Verify you have the right permissions
4. Try accessing the site to generate some logs first
5. Check the **"Metrics"** tab for error rates

