# Setup Instructions for JobStalker Extension

## 🔑 **Adding Your Supabase API Key**

Before using the extension, you need to add your Supabase API key to the following files:

### **1. Update popup.js**
Open `popup.js` and replace:
```javascript
const supabaseKey = "YOUR_SUPABASE_ANON_KEY_HERE";
```
With your actual Supabase anon key from your Supabase dashboard.

### **2. Update debug_supabase.html**
Open `debug_supabase.html` and replace:
```javascript
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';
```
With your actual Supabase anon key.

### **3. Update test_supabase.html**
Open `test_supabase.html` and replace:
```javascript
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';
```
With your actual Supabase anon key.

## 🗄️ **Getting Your Supabase API Key**

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/aomsclctttvetqpdzwyj
2. Click **"Settings"** in the left sidebar
3. Click **"API"** in the settings menu
4. Copy the **"anon public"** key (starts with `eyJ...`)

## 🚀 **After Adding API Keys**

1. **Test the connection**: Open `debug_supabase.html` in your browser and click "Test Connection"
2. **Load the extension**: Go to `chrome://extensions/` and load the extension
3. **Test on LinkedIn**: Go to a LinkedIn job page and click the extension icon

## ⚠️ **Security Note**

- Never commit API keys to Git
- Keep your API keys private
- The files with `_safe` in the name are safe to commit (they contain placeholders)

## 🔧 **Troubleshooting**

If you get connection errors:
1. Check that your API key is correct
2. Make sure your Supabase project is active
3. Verify the table schema matches your database
4. Check the browser console for detailed error messages 