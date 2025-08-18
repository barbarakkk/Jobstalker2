# LinkedIn OAuth Integration PRD for JobStalker2

## **Project Overview**
**Project Name**: JobStalker2 LinkedIn OAuth Integration  
**Date**: December 2024  
**Version**: 1.0  
**Status**: In Development  

---

## **1. Executive Summary**

### **1.1 Objective**
Integrate LinkedIn OAuth authentication into JobStalker2 to allow users to sign up and log in using their LinkedIn accounts, providing a seamless authentication experience alongside existing Google OAuth.

### **1.2 Business Value**
- **User Acquisition**: Lower barrier to entry for job seekers
- **User Experience**: One-click login with professional profile data
- **Data Quality**: Access to verified professional information
- **Market Reach**: Tap into LinkedIn's 900M+ professional users

### **1.3 Success Metrics**
- LinkedIn login success rate > 95%
- User registration conversion increase by 20%
- Reduced authentication friction (time to login < 10 seconds)

---

## **2. Technical Requirements**

### **2.1 OAuth 2.0 Flow**
```
User clicks LinkedIn Login → LinkedIn OAuth → Callback to Supabase → Create/Update User → Redirect to Dashboard
```

### **2.2 Required Scopes**
- `r_liteprofile` - Basic profile information
- `r_emailaddress` - Email address access
- `r_basicprofile` - Public profile information

### **2.3 Data Fields to Capture**
- **Required**: Email, First Name, Last Name, LinkedIn Profile ID
- **Optional**: Profile Picture, Company, Job Title, Location
- **System**: Created Date, Last Login, Authentication Provider

---

## **3. Implementation Steps**

### **Phase 1: LinkedIn Developer Setup (Day 1)**

#### **3.1.1 Create LinkedIn OAuth App**
1. **Go to LinkedIn Developer Portal**
   - URL: https://www.linkedin.com/developers/
   - Sign in with your LinkedIn account

2. **Create New App**
   - Click "Create App"
   - App Name: `JobStalker2`
   - LinkedIn Page: Your company page or personal profile
   - App Logo: Upload JobStalker2 logo (120x120px)

3. **Configure OAuth Settings**
   - Go to "Auth" tab
   - **Redirect URLs**: Add `https://your-project.supabase.co/auth/v1/callback`
   - **OAuth 2.0 Scopes**: Select required scopes
   - **Application Permissions**: Request access to required scopes

4. **Get Credentials**
   - **Client ID**: Copy from app overview
   - **Client Secret**: Generate and copy
   - **Store securely** (don't commit to git)

#### **3.1.2 LinkedIn App Configuration**
```json
{
  "app_name": "JobStalker2",
  "app_description": "Professional job tracking and management platform",
  "redirect_urls": [
    "https://your-project.supabase.co/auth/v1/callback"
  ],
  "scopes": [
    "r_liteprofile",
    "r_emailaddress"
  ]
}
```

### **Phase 2: Supabase Configuration (Day 1-2)**

#### **3.2.1 Enable LinkedIn Provider**
1. **Access Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Select your JobStalker2 project

2. **Authentication Settings**
   - Go to **Authentication** → **Providers**
   - Find **LinkedIn** in the list
   - Toggle **ON**

3. **Configure LinkedIn Provider**
   - **Client ID**: Paste your LinkedIn Client ID
   - **Client Secret**: Paste your LinkedIn Client Secret
   - **Save Configuration**

#### **3.2.2 Environment Variables**
```bash
# .env.local (Frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# .env (Backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

### **Phase 3: Frontend Implementation (Day 2-3)**

#### **3.3.1 Update Login Component**
```typescript
// frontend/src/components/Auth/Login.tsx
const handleLinkedInLogin = async () => {
  setError(null);
  setLinkedinLoading(true);
  
  try {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'linkedin',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        scopes: 'r_liteprofile r_emailaddress'
      }
    });
    
    if (error) {
      setError('LinkedIn login failed. Please try again.');
    }
  } catch (err) {
    setError('An unexpected error occurred. Please try again.');
  } finally {
    setLinkedinLoading(false);
  }
};
```

#### **3.3.2 LinkedIn Login Button**
```tsx
<Button 
  onClick={handleLinkedInLogin}
  disabled={loading || githubLoading || linkedinLoading}
  className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
  variant="outline"
>
  {linkedinLoading ? (
    <div className="flex items-center">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      Signing in...
    </div>
  ) : (
    <>
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      Continue with LinkedIn
    </>
  )}
</Button>
```

### **Phase 4: Backend Integration (Day 3-4)**

#### **3.4.1 User Profile Handling**
```python
# backend/main.py
@app.post("/api/auth/linkedin-profile")
async def get_linkedin_profile(user_id: str = Depends(get_current_user)):
    """Get LinkedIn profile data for authenticated user"""
    try:
        # Get user from Supabase auth
        user_response = supabase.auth.get_user(user_id)
        
        if user_response and user_response.user:
            # Extract LinkedIn-specific data
            user_metadata = user_response.user.user_metadata or {}
            linkedin_data = {
                "user_id": user_id,
                "email": user_response.user.email,
                "linkedin_id": user_metadata.get("sub"),
                "first_name": user_metadata.get("given_name"),
                "last_name": user_metadata.get("family_name"),
                "profile_picture": user_metadata.get("picture"),
                "provider": "linkedin"
            }
            return linkedin_data
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### **3.4.2 Database Schema Updates**
```sql
-- Add LinkedIn-specific fields to users table
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS linkedin_id VARCHAR(255);
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'google';
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Create index for LinkedIn ID lookups
CREATE INDEX IF NOT EXISTS idx_users_linkedin_id ON auth.users(linkedin_id);
```

### **Phase 5: Testing & Validation (Day 4-5)**

#### **3.5.1 Test Cases**
1. **LinkedIn Login Flow**
   - User clicks LinkedIn login
   - Redirects to LinkedIn OAuth
   - User authorizes app
   - Redirects back to dashboard
   - User data is properly stored

2. **User Data Validation**
   - Email is captured correctly
   - Profile information is extracted
   - User can access protected routes
   - Session persists across page reloads

3. **Error Handling**
   - Invalid credentials
   - Network failures
   - User denies permissions
   - OAuth callback errors

#### **3.5.2 Testing Checklist**
- [ ] LinkedIn OAuth app created successfully
- [ ] Supabase LinkedIn provider enabled
- [ ] Frontend login button works
- [ ] OAuth flow completes successfully
- [ ] User data is stored in database
- [ ] User can access dashboard
- [ ] Error messages display correctly
- [ ] Session management works properly

---

## **4. Security Considerations**

### **4.1 OAuth Security**
- **HTTPS Only**: All OAuth callbacks must use HTTPS
- **State Parameter**: Implement CSRF protection with state parameter
- **Scope Validation**: Only request necessary scopes
- **Token Storage**: Store tokens securely in Supabase

### **4.2 Data Privacy**
- **GDPR Compliance**: Handle user data according to regulations
- **Data Minimization**: Only collect necessary information
- **User Consent**: Clear consent for data collection
- **Data Retention**: Define data retention policies

### **4.3 Rate Limiting**
- **OAuth Requests**: Limit LinkedIn API calls
- **Login Attempts**: Prevent brute force attacks
- **API Endpoints**: Implement rate limiting on auth endpoints

---

## **5. Deployment Checklist**

### **5.1 Pre-Deployment**
- [ ] LinkedIn OAuth app configured
- [ ] Supabase provider enabled
- [ ] Environment variables set
- [ ] Frontend code updated
- [ ] Backend endpoints implemented
- [ ] Database schema updated

### **5.2 Deployment Steps**
1. **Update Environment Variables**
   ```bash
   # Production environment
   export LINKEDIN_CLIENT_ID="your-production-client-id"
   export LINKEDIN_CLIENT_SECRET="your-production-client-secret"
   ```

2. **Deploy Backend**
   ```bash
   cd backend
   python main.py
   ```

3. **Deploy Frontend**
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```

4. **Update LinkedIn App Settings**
   - Add production redirect URLs
   - Update app status to production

### **5.3 Post-Deployment**
- [ ] Test LinkedIn login in production
- [ ] Monitor authentication logs
- [ ] Verify user data storage
- [ ] Check error rates
- [ ] Validate security measures

---

## **6. Monitoring & Maintenance**

### **6.1 Key Metrics**
- **Login Success Rate**: Target > 95%
- **OAuth Response Time**: Target < 2 seconds
- **Error Rate**: Target < 1%
- **User Registration**: Track conversion rates

### **6.2 Logging**
```python
# Log LinkedIn OAuth events
import logging

logger = logging.getLogger(__name__)

@app.post("/api/auth/linkedin-callback")
async def linkedin_callback():
    logger.info("LinkedIn OAuth callback received")
    # Process callback
    logger.info("LinkedIn OAuth completed successfully")
```

### **6.3 Error Handling**
```typescript
// Frontend error handling
try {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin'
  });
  
  if (error) {
    console.error('LinkedIn OAuth error:', error);
    // Handle specific error types
    if (error.message.includes('provider not enabled')) {
      setError('LinkedIn login is temporarily unavailable');
    } else {
      setError('LinkedIn login failed. Please try again.');
    }
  }
} catch (err) {
  console.error('Unexpected error:', err);
  setError('An unexpected error occurred');
}
```

---

## **7. Future Enhancements**

### **7.1 Advanced Features**
- **Profile Sync**: Periodic LinkedIn profile updates
- **Company Matching**: Match users with company profiles
- **Network Integration**: Leverage LinkedIn connections
- **Job Recommendations**: Use LinkedIn data for job matching

### **7.2 Integration Opportunities**
- **LinkedIn Jobs API**: Direct job posting integration
- **Company Pages**: Company information enrichment
- **Skills Endorsements**: Professional skill validation
- **Recommendations**: Professional reference integration

---

## **8. Resources & References**

### **8.1 Documentation**
- [LinkedIn OAuth 2.0 Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/rfc6819)

### **8.2 Tools & Libraries**
- **Frontend**: Supabase Auth Helpers
- **Backend**: Supabase Python Client
- **Testing**: Jest, React Testing Library
- **Monitoring**: Supabase Logs, Application Insights

### **8.3 Support Channels**
- **LinkedIn Developer Support**: https://developer.linkedin.com/support
- **Supabase Support**: https://supabase.com/support
- **Community Forums**: GitHub Discussions, Stack Overflow

---

## **9. Timeline & Milestones**

| Phase | Duration | Deliverables | Status |
|-------|----------|--------------|---------|
| LinkedIn Setup | Day 1 | OAuth app, credentials | 🔄 In Progress |
| Supabase Config | Day 1-2 | Provider enabled, env vars | ⏳ Pending |
| Frontend Dev | Day 2-3 | Login component, button | ⏳ Pending |
| Backend Dev | Day 3-4 | API endpoints, user handling | ⏳ Pending |
| Testing | Day 4-5 | Test cases, validation | ⏳ Pending |
| Deployment | Day 5 | Production deployment | ⏳ Pending |

---

## **10. Risk Assessment**

### **10.1 High Risk**
- **OAuth Configuration Errors**: Could prevent all LinkedIn logins
- **Data Privacy Violations**: GDPR compliance issues
- **Security Vulnerabilities**: OAuth implementation flaws

### **10.2 Medium Risk**
- **API Rate Limits**: LinkedIn API restrictions
- **User Experience Issues**: Complex OAuth flow
- **Integration Failures**: Supabase-LinkedIn compatibility

### **10.3 Mitigation Strategies**
- **Thorough Testing**: Comprehensive test coverage
- **Security Review**: Code security audit
- **Monitoring**: Real-time error tracking
- **Rollback Plan**: Quick reversion capability

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Next Review**: After Phase 1 completion  
**Approved By**: Development Team  
**Status**: Ready for Implementation
