# Domain Migration Guide: jobstalker-ai.com

This guide covers all the changes needed in Supabase, Vercel, and Railway to migrate from the old domain to `jobstalker-ai.com`.

## ✅ Code Changes Completed

All code references have been updated:
- Frontend HTML title and meta descriptions
- Extension manifest (name, description, domain permissions)
- Extension UI text (sidepanel.html, auth.html)
- React component alt texts and branding
- Backend API title
- Extension JavaScript files (domain references)
- Backend CORS settings

---

## 🔧 Configuration Changes Required

### 1. **Vercel Configuration**

#### A. Add Custom Domain
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your frontend project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter: `jobstalker-ai.com`
6. Also add: `www.jobstalker-ai.com` (optional but recommended)
7. Follow DNS configuration instructions:
   - Add a CNAME record: `jobstalker-ai.com` → `cname.vercel-dns.com`
   - Or add an A record if CNAME is not supported

#### B. Update Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Verify these are set correctly:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `VITE_API_BASE_URL` - Your Railway backend URL (should already be set)

#### C. Update Redirect URLs (if using Vercel redirects)
- Check **Settings** → **Redirects** for any hardcoded domain references

---

### 2. **Supabase Configuration**

#### A. Update Site URL
1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Update **Site URL** to: `https://jobstalker-ai.com`
5. Add to **Redirect URLs**:
   - `https://jobstalker-ai.com/**`
   - `https://www.jobstalker-ai.com/**`
   - `https://jobstalker-ai.com/auth/callback`
   - `https://www.jobstalker-ai.com/auth/callback`
   - Keep localhost URLs for development:
     - `http://localhost:5173/**`
     - `http://localhost:5173/auth/callback`

#### B. Update OAuth Provider Redirect URLs
For each OAuth provider (Google, GitHub, LinkedIn):

1. **Google OAuth** (Google Cloud Console):
   - Go to: https://console.cloud.google.com/apis/credentials
   - Edit your OAuth 2.0 Client ID
   - Add to **Authorized redirect URIs**:
     - `https://[your-supabase-project].supabase.co/auth/v1/callback`
     - (Supabase handles the callback, so you mainly need to ensure the Site URL is correct)

2. **GitHub OAuth** (GitHub Settings):
   - Go to: https://github.com/settings/developers
   - Edit your OAuth App
   - Update **Authorization callback URL**:
     - `https://[your-supabase-project].supabase.co/auth/v1/callback`

3. **LinkedIn OAuth** (LinkedIn Developer Portal):
   - Go to: https://www.linkedin.com/developers/apps
   - Edit your app
   - Add to **Authorized redirect URLs**:
     - `https://[your-supabase-project].supabase.co/auth/v1/callback`

#### C. Update CORS Settings (if applicable)
- In Supabase Dashboard → **Settings** → **API**
- Ensure CORS origins include:
  - `https://jobstalker-ai.com`
  - `https://www.jobstalker-ai.com`

---

### 3. **Railway Configuration**

#### A. Update Environment Variables
1. Go to Railway Dashboard: https://railway.app
2. Select your backend project
3. Go to **Variables** tab
4. Verify these environment variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `DATABASE_URL` - Your Supabase database URL (if used)
   - `ENVIRONMENT=production`

#### B. Update Custom Domain (if using Railway domain)
If you're using Railway's custom domain feature:
1. Go to **Settings** → **Networking**
2. Add custom domain: `api.jobstalker-ai.com` (or your preferred subdomain)
3. Update DNS records as instructed
4. Update `VITE_API_BASE_URL` in Vercel to point to this new domain

#### C. Verify CORS Settings
The backend CORS has been updated in code to include:
- `https://jobstalker-ai.com`
- `https://www.jobstalker-ai.com`

Make sure Railway redeploys the backend after code changes.

---

### 4. **DNS Configuration**

#### Required DNS Records

**For jobstalker-ai.com:**
```
Type: A or CNAME
Name: @ (or jobstalker-ai.com)
Value: [Vercel's IP or CNAME target]
TTL: 3600 (or auto)
```

**For www.jobstalker-ai.com (optional):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com (or Vercel's provided value)
TTL: 3600
```

**For API subdomain (if using Railway custom domain):**
```
Type: CNAME
Name: api
Value: [Railway's CNAME target]
TTL: 3600
```

---

### 5. **Extension Updates**

After deploying:
1. Update the extension's `WEB_APP_URL` in `extension/background.js` (already done)
2. Repackage the extension:
   ```bash
   cd extension
   zip -r jobstalker-ai-extension.zip . -x "*.DS_Store"
   ```
3. Upload to Chrome Web Store (if published)
4. Update extension description and screenshots if needed

---

### 6. **Testing Checklist**

After making all changes:

- [ ] Frontend loads at `https://jobstalker-ai.com`
- [ ] Authentication (Google/GitHub/LinkedIn) works
- [ ] OAuth redirects work correctly
- [ ] API calls from frontend to backend work
- [ ] Extension can connect to the new domain
- [ ] Extension can save jobs successfully
- [ ] All images and assets load correctly
- [ ] SSL certificate is valid (should auto-provision via Vercel)

---

### 7. **Rollback Plan**

If something goes wrong:
1. **Vercel**: Revert domain settings or use old domain temporarily
2. **Supabase**: Revert Site URL and Redirect URLs to old values
3. **Railway**: No changes needed (uses environment variables)
4. **Extension**: Revert `WEB_APP_URL` in `background.js` to old domain

---

### 8. **Important Notes**

- **SSL Certificates**: Vercel automatically provisions SSL certificates for custom domains
- **Propagation Time**: DNS changes can take 24-48 hours to fully propagate
- **Cache**: Clear browser cache and test in incognito mode
- **Extension**: Users may need to update the extension if it's already installed
- **Old Domain**: Consider setting up a redirect from old domain to new domain

---

### 9. **Post-Migration**

After successful migration:
1. Update any external documentation
2. Update social media links
3. Update email templates (if any)
4. Update any marketing materials
5. Monitor error logs for any missed references
6. Set up monitoring/alerts for the new domain

---

## 🆘 Troubleshooting

### Frontend not loading
- Check DNS propagation: https://dnschecker.org
- Verify Vercel domain configuration
- Check SSL certificate status in Vercel

### Authentication not working
- Verify Supabase Site URL matches new domain
- Check Redirect URLs in Supabase
- Verify OAuth provider redirect URLs
- Check browser console for errors

### API calls failing
- Verify `VITE_API_BASE_URL` in Vercel environment variables
- Check Railway backend is running
- Verify CORS settings in backend
- Check Network tab in browser DevTools

### Extension not connecting
- Verify `WEB_APP_URL` in `background.js`
- Check extension manifest domain permissions
- Clear extension storage and re-authenticate
- Check extension console for errors

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Railway logs
3. Check Supabase logs
4. Check browser console errors
5. Check extension console errors

