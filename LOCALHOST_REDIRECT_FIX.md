# Fix Localhost Redirect Issue

## Problem
When accessing `/dashboard` on localhost, it redirects to `https://jobstalker-ai.com/dashboard` instead of staying on localhost.

## Root Cause
Supabase is configured with the production domain as the Site URL, and localhost URLs might not be properly configured in Redirect URLs.

## Solution

### Step 1: Update Supabase Redirect URLs

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. In **Redirect URLs**, make sure you have ALL of these:

```
http://localhost:3000/**
http://localhost:3000/auth/callback
http://localhost:5173/**
http://localhost:5173/auth/callback
http://127.0.0.1:3000/**
http://127.0.0.1:3000/auth/callback
http://127.0.0.1:5173/**
http://127.0.0.1:5173/auth/callback
https://jobstalker-ai.com/**
https://jobstalker-ai.com/auth/callback
https://www.jobstalker-ai.com/**
https://www.jobstalker-ai.com/auth/callback
```

**Important:** Add each URL on a separate line, one per line.

### Step 2: Verify Site URL

The **Site URL** should be set to your production domain:
```
https://jobstalker-ai.com
```

This is fine - Supabase will use the `redirectTo` parameter from your code, which uses `window.location.origin` (localhost in dev, production in prod).

### Step 3: Clear Browser Cache/Cookies

1. Open your browser's Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Clear:
   - **Cookies** for `localhost:3000` and `localhost:5173`
   - **Local Storage** for these domains
   - **Session Storage** for these domains

Or use Incognito/Private mode to test.

### Step 4: Test

1. Start your dev server: `npm run dev` (should run on port 3000 or 5173)
2. Go to: `http://localhost:3000` (or `http://localhost:5173`)
3. Try to login
4. After OAuth, you should be redirected back to `http://localhost:3000/dashboard` (not production)

### Step 5: Check Console Logs

The code now logs the redirect URL. Check your browser console:
- You should see: `Google OAuth redirect URL: http://localhost:3000/auth/callback`
- If you see the production URL, there's a configuration issue

## Troubleshooting

### Still redirecting to production?

1. **Check Supabase Redirect URLs again**
   - Make sure localhost URLs are EXACTLY as shown above
   - No trailing slashes (except `/**`)
   - Include both `localhost` and `127.0.0.1`

2. **Check your `.env` file**
   - Make sure `VITE_SUPABASE_URL` points to your Supabase project
   - Not a production URL

3. **Clear Supabase session**
   ```javascript
   // In browser console on localhost
   localStorage.clear();
   sessionStorage.clear();
   ```

4. **Check if you're using the right port**
   - Vite default: `5173`
   - Check your `vite.config.ts` or `package.json` scripts
   - Make sure the port matches what's in Supabase Redirect URLs

### Still not working?

The issue might be that Supabase is validating redirects against the Site URL. Try:

1. Temporarily set Site URL to: `http://localhost:3000` (or `5173`)
2. Test if it works
3. If it works, the issue is Supabase validation
4. Set Site URL back to production
5. Contact Supabase support or check their docs for localhost development

## Code Changes Made

The code has been updated to:
- Explicitly use `window.location.origin` for redirects
- Add console logging to debug redirect URLs
- Ensure redirects work in both development and production

The code should now work correctly once Supabase Redirect URLs are properly configured.

