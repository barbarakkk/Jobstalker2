# GitHub OAuth Setup for JobStalker

This guide will help you set up GitHub authentication for your JobStalker application.

## Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: `JobStalker`
   - **Homepage URL**: `http://localhost:5173` (for development)
   - **Application description**: `Job tracking application`
   - **Authorization callback URL**: `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret** (you'll need these for Supabase)

## Step 2: Configure Supabase Authentication

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **GitHub** in the list and click to expand
5. Enable GitHub authentication by toggling the switch
6. Enter your GitHub OAuth credentials:
   - **Client ID**: (from GitHub OAuth app)
   - **Client Secret**: (from GitHub OAuth app)
7. Click **Save**

## Step 3: Update Environment Variables (Optional)

If you want to customize the redirect URLs, you can add these to your Supabase project settings:

1. Go to **Authentication** → **URL Configuration**
2. Set your **Site URL** to: `http://localhost:5173` (for development)
3. Add redirect URLs if needed

## Step 4: Test the Integration

1. Start your frontend application: `npm run dev`
2. Go to the login page
3. Click "Continue with GitHub"
4. You should be redirected to GitHub for authorization
5. After authorizing, you'll be redirected back to your dashboard

## Features Added

✅ **GitHub Login Button**: Added to both Login and Register pages
✅ **GitHub Profile Display**: Shows GitHub avatar and username in dashboard
✅ **Provider Detection**: Displays "Signed in with GitHub" in profile dropdown
✅ **Loading States**: Proper loading indicators for GitHub authentication
✅ **Error Handling**: Graceful error handling for failed GitHub logins

## User Experience

- Users can now sign in with either Google or GitHub
- GitHub users will see their profile picture and username
- The profile dropdown shows authentication provider information
- Consistent styling with the existing Google authentication

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error**:
   - Make sure the callback URL in GitHub matches your Supabase project URL exactly
   - Check that your Supabase project reference is correct

2. **"Client ID not found" error**:
   - Verify the Client ID and Client Secret are correctly entered in Supabase
   - Make sure GitHub OAuth app is properly configured

3. **"Authorization callback URL mismatch"**:
   - Ensure the callback URL in GitHub OAuth app matches: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### For Production:

1. Update the GitHub OAuth app URLs to your production domain
2. Update Supabase site URL to your production domain
3. Consider adding additional redirect URLs for different environments

## Security Notes

- Never commit your GitHub Client Secret to version control
- Use environment variables for sensitive configuration in production
- Regularly rotate your OAuth app secrets
- Monitor your GitHub OAuth app usage in GitHub Developer Settings
