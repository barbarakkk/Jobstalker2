# Fix API Key Issue

## Problem
The Supabase API key is invalid, causing "401 Invalid API key" errors.

## Solution

### Step 1: Get Your Correct API Key
1. Go to: https://supabase.com/dashboard/project/aomsclctttvetqpdzwyj
2. Click **"Settings"** in the left sidebar
3. Click **"API"** in the settings menu
4. Copy the **"anon public"** key (it starts with `eyJ...`)

### Step 2: Update the Files

#### Update debug_supabase.html:
1. Open `debug_supabase.html` in a text editor
2. Find this line:
   ```javascript
   const SUPABASE_KEY = 'YOUR_ACTUAL_SUPABASE_ANON_KEY_HERE';
   ```
3. Replace `YOUR_ACTUAL_SUPABASE_ANON_KEY_HERE` with your actual anon key
4. Save the file

#### Update popup.js:
1. Open `popup.js` in a text editor
2. Find this line (around line 113):
   ```javascript
   const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbXNjbGN0dHR2ZXRxcGR6d3lqIixicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMDIzMTYsImV4cCI6MjA2ODU3ODMxNn0.OWuIZDrR6ifCbfQZnl1sdukf72FgEO2JmxdRy0cd1uo";
   ```
3. Replace the entire key with your actual anon key
4. Save the file

### Step 3: Test Again
1. Open `debug_supabase.html` in your browser
2. Click "Test Connection" - should show ✅ Connection successful!
3. If successful, reload the extension in Chrome

## Example
Your anon key should look like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbXNjbGN0dHR2ZXRxcGR6d3lqIixicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMDIzMTYsImV4cCI6MjA2ODU3ODMxNn0.OWuIZDrR6ifCbfQZnl1sdukf72FgEO2JmxdRy0cd1uo
```

Make sure to copy the ENTIRE key, including the `eyJ` at the beginning and the end. 