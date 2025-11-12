# JobStalker Browser Extension System

## Overview

The JobStalker browser extension is a Chrome/Edge extension that allows users to save job postings directly from LinkedIn (and other job sites) to their JobStalker dashboard with a single click. It provides a side panel interface for quick job saving and dashboard access.

## Architecture

### Technology Stack

- **Platform**: Chrome Extension Manifest V3
- **Language**: Vanilla JavaScript (ES6+)
- **Storage**: Chrome Storage API (local)
- **UI**: HTML5 + CSS3
- **Authentication**: Supabase Auth (JWT tokens)
- **API**: REST API calls to JobStalker backend

### Extension Structure

```
extension/
├── manifest.json       # Extension configuration
├── background.js       # Service worker (background script)
├── sidepanel.html      # Side panel UI
├── sidepanel.js        # Side panel logic
├── auth.html           # Authentication callback page
├── auth.js             # Auth callback handler
└── icons/              # Extension icons (16px, 48px, 128px)
```

## Key Features

### 1. Side Panel Interface

The extension uses Chrome's Side Panel API to provide a persistent interface:

- **Auto-detection**: Detects when user is on a LinkedIn job page
- **Job Save Interface**: Shows when on job pages
- **Dashboard View**: Shows when authenticated on regular pages
- **Authentication Prompt**: Shows when not authenticated

### 2. Job Saving

**Workflow**:
1. User navigates to LinkedIn job posting
2. Extension detects job page and shows save interface
3. User clicks "Save Job" button
4. Extension extracts HTML content and basic job data
5. Content sent to backend for AI processing
6. Job saved to user's dashboard
7. Dashboard tabs auto-reload to show new job

**Data Extraction**:
- HTML content extraction via content script injection
- Basic job data extraction (title, company, location, salary)
- Canonical URL detection
- Fallback data for immediate display

### 3. Authentication

**Flow**:
1. User clicks "Sign In" in extension
2. Opens web app login page in new tab
3. User authenticates via Supabase
4. Token passed back to extension via redirect URL
5. Token stored in Chrome local storage
6. Extension validates token with backend

**Token Management**:
- Stored in `chrome.storage.local`
- Includes expiry timestamp
- Automatic validation on use
- Auto-cleanup on expiry

### 4. Background Service Worker

The background script (`background.js`) handles:

- **Message Routing**: Routes messages between components
- **Authentication**: Token verification and management
- **API Communication**: Communicates with backend API
- **Tab Management**: Opens dashboard, handles tab reloads
- **Storage Management**: Manages token storage

## Components

### manifest.json

Extension configuration:

```json
{
  "manifest_version": 3,
  "name": "JobStalker Job Search Companion",
  "version": "1.0.4",
  "permissions": [
    "activeTab",
    "storage",
    "identity",
    "scripting",
    "sidePanel",
    "tabs"
  ],
  "host_permissions": [
    "<all_urls>",
    "https://*.jobstalker.com/*"
  ]
}
```

**Key Permissions**:
- `activeTab`: Access current tab content
- `storage`: Store authentication tokens
- `scripting`: Inject content scripts
- `sidePanel`: Show side panel interface
- `tabs`: Manage browser tabs

### background.js

Service worker that handles:

**Message Handlers**:
- `checkAuth` - Verify authentication status
- `openAuth` - Open authentication page
- `signOut` - Sign out user
- `openDashboard` - Open web app dashboard
- `getJobs` - Fetch user's jobs
- `saveJob` - Save job to backend
- `testBackend` - Test backend connectivity
- `refreshDashboard` - Reload dashboard tabs

**Key Functions**:
- `handleCheckAuth()` - Verify token validity
- `handleSaveJob()` - Process job save request
- `reloadDashboardTabs()` - Auto-reload dashboard after save
- `handleSetAuthToken()` - Store authentication token

**Configuration**:
```javascript
const CONFIG = {
  WEB_APP_URL: 'https://jobstalker.vercel.app',
  API_BASE_URL: 'https://jobstalker2-production.up.railway.app',
  TOKEN_KEY: 'jobstalker_auth_token',
  TOKEN_EXPIRY_KEY: 'jobstalker_token_expiry'
};
```

### sidepanel.js

Side panel logic that handles:

**UI States**:
- Loading state
- Not signed in state
- Signed in state
- LinkedIn job page state
- Dashboard state

**Key Functions**:
- `checkStatus()` - Determine current UI state
- `setupJobSaveInterface()` - Initialize job save UI
- `handleSaveJob()` - Process job save
- `extractJobDataFromPage()` - Extract job data from page
- `setupUrlChangeDetection()` - Monitor URL changes

**Job Data Extraction**:
- Injects content script into current tab
- Extracts HTML content
- Parses DOM for job information
- Detects login pages
- Handles dynamic content loading

### auth.js

Authentication callback handler:

- Extracts token from URL (hash or query params)
- Calculates token expiry
- Stores token in Chrome storage
- Notifies background script
- Closes callback tab

## User Flows

### 1. First-Time Setup

1. User installs extension
2. Extension opens welcome page
3. User clicks "Sign In"
4. Redirected to web app login
5. User authenticates
6. Token stored in extension
7. Extension ready to use

### 2. Saving a Job

1. User navigates to LinkedIn job posting
2. Extension icon shows notification
3. User clicks extension icon
4. Side panel opens with job save interface
5. Job URL pre-filled
6. User selects status and excitement level
7. User clicks "Save Job"
8. Extension extracts page data
9. Data sent to backend for AI processing
10. Job saved successfully
11. Dashboard tabs auto-reload

### 3. Viewing Dashboard

1. User clicks extension icon on any page
2. Side panel opens
3. If authenticated, shows dashboard view
4. Displays recent jobs
5. User can open full dashboard in new tab

## API Integration

### Backend Endpoints Used

- `POST /api/jobs/scrape-linkedin` - Save LinkedIn job
- `POST /api/jobs/ingest-html` - Save job from HTML
- `GET /api/jobs` - Fetch user's jobs
- `GET /api/auth/verify` - Verify authentication token
- `GET /health` - Backend health check

### Request Format

**Save Job Request**:
```javascript
{
  url: "https://linkedin.com/jobs/view/123",
  canonical_url: "https://linkedin.com/jobs/view/123",
  stage: "Bookmarked",
  excitement: 3,
  html_content: "<html>...</html>",
  fallback_data: {
    job_title: "Software Engineer",
    company: "Tech Corp",
    location: "San Francisco, CA",
    salary: "$100k - $150k"
  }
}
```

## Storage

### Chrome Storage API

**Keys Used**:
- `jobstalker_auth_token` - JWT authentication token
- `jobstalker_token_expiry` - Token expiry timestamp

**Storage Type**: `chrome.storage.local` (persists across sessions)

## Error Handling

### Authentication Errors

- Token expiry detection
- Automatic token cleanup
- User-friendly error messages
- Re-authentication prompts

### Network Errors

- Backend connectivity checks
- Graceful degradation
- Error messages to user
- Retry mechanisms

### Content Extraction Errors

- Timeout handling (5 seconds)
- Fallback data usage
- Login page detection
- Error logging

## Security Considerations

### Token Security

- Tokens stored in Chrome local storage (not synced)
- Automatic expiry validation
- Secure token transmission (HTTPS only)
- No token logging in production

### Content Script Security

- Minimal permissions requested
- Content scripts isolated from page context
- No access to sensitive page data
- HTML content only extracted

### API Security

- All API calls use HTTPS
- Bearer token authentication
- CORS protection on backend
- Rate limiting on backend

## Development

### Prerequisites

- Chrome or Edge browser
- Backend API running
- Web app deployed (for authentication)

### Local Development

1. **Load Extension**:
   - Open Chrome/Edge
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `extension/` directory

2. **Update Configuration**:
   - Edit `background.js` CONFIG object
   - Set `API_BASE_URL` to local backend if testing locally
   - Set `WEB_APP_URL` to local frontend if testing locally

3. **Test Authentication**:
   - Click extension icon
   - Click "Sign In"
   - Complete authentication flow
   - Verify token storage

4. **Test Job Saving**:
   - Navigate to LinkedIn job posting
   - Click extension icon
   - Fill in job details
   - Click "Save Job"
   - Verify job appears in dashboard

### Debugging

**Background Script**:
- Open `chrome://extensions/`
- Click "Inspect views: service worker"
- View console logs

**Side Panel**:
- Right-click side panel
- Select "Inspect"
- View console logs

**Content Script**:
- Open DevTools on page
- View console logs (content script logs appear here)

### Console Logging

The extension uses detailed console logging for debugging:

- `🔍 STEP X`: Step-by-step process tracking
- `✅`: Success indicators
- `❌`: Error indicators
- `🚀`: Process start indicators
- `💾`: Save operation indicators

## Deployment

### Chrome Web Store

1. **Prepare Package**:
   - Ensure all files are present
   - Update version in `manifest.json`
   - Test thoroughly

2. **Create ZIP**:
   ```bash
   zip -r jobstalker-extension.zip extension/ -x "*.DS_Store"
   ```

3. **Upload to Chrome Web Store**:
   - Go to Chrome Web Store Developer Dashboard
   - Create new item or update existing
   - Upload ZIP file
   - Fill in store listing details
   - Submit for review

### Version Management

- Update `version` in `manifest.json`
- Follow semantic versioning (MAJOR.MINOR.PATCH)
- Document changes in release notes

## Known Limitations

1. **LinkedIn Login Required**: User must be logged into LinkedIn to extract job data
2. **Single Tab Limitation**: Side panel tied to current active tab
3. **No Offline Support**: Requires backend connectivity
4. **Chrome/Edge Only**: Manifest V3 Chrome extension (not Firefox)

## Future Enhancements

- [ ] Support for more job sites (Indeed, Glassdoor, etc.)
- [ ] Offline job queuing
- [ ] Batch job saving
- [ ] Job search within extension
- [ ] Notification system for job updates
- [ ] Keyboard shortcuts
- [ ] Dark mode support
- [ ] Firefox extension version
- [ ] Safari extension version

## Troubleshooting

### Extension Not Loading

- Check manifest.json syntax
- Verify all files present
- Check browser console for errors
- Ensure Manifest V3 compatibility

### Authentication Not Working

- Verify backend API is accessible
- Check token storage in Chrome storage
- Verify redirect URL configuration
- Check network tab for API calls

### Job Save Failing

- Verify user is logged into LinkedIn
- Check backend API connectivity
- Verify authentication token valid
- Check console logs for errors
- Ensure on actual job details page (not search results)

### Side Panel Not Opening

- Verify side panel permission in manifest
- Check if side panel API supported (Chrome 114+)
- Try clicking extension icon again
- Check background script for errors

