// Background script for JobStalker AI Chrome Extension
console.log('JobStalker AI extension background script loaded');

// Configuration
const CONFIG = {
  // Deployed frontend URL
  WEB_APP_URL: 'https://jobstalker-ai.com',
  // Use your deployed backend URL so the extension can reach the API
  // Update this if your Railway domain is different
  API_BASE_URL: 'https://jobstalker2-production.up.railway.app',
  TOKEN_KEY: 'jobstalker_auth_token',
  TOKEN_EXPIRY_KEY: 'jobstalker_token_expiry',
  EXTENSION_ID: chrome.runtime.id,
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'checkAuth':
      handleCheckAuth(sendResponse);
      return true; // Keep message channel open for async response
      
    case 'openAuth':
      handleOpenAuth(sendResponse);
      return true;
      
    case 'signOut':
      handleSignOut(sendResponse);
      return true;
      
    case 'openDashboard':
      handleOpenDashboard(sendResponse);
      return true;
      
    case 'getJobs':
      handleGetJobs(sendResponse);
      return true;
      
    case 'saveJob':
      handleSaveJob(request.data, sendResponse);
      return true;
      

    case 'authCompleted':
      // no-op for now; sidepanel will re-check auth on next open
      sendResponse({ success: true });
      return true;
      
    case 'testBackend':
      handleTestBackend(sendResponse);
      return true;
      
    case 'refreshDashboard':
      handleRefreshDashboard(sendResponse);
      return true;
      
    default:
      console.log('Unknown action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Check if user is authenticated
async function handleCheckAuth(sendResponse) {
  try {
    console.log('Checking authentication status...');
    
    // Get stored token and expiry
    const result = await chrome.storage.local.get([CONFIG.TOKEN_KEY, CONFIG.TOKEN_EXPIRY_KEY]);
    const token = result[CONFIG.TOKEN_KEY];
    const expiry = result[CONFIG.TOKEN_EXPIRY_KEY];
    
    console.log('Stored token exists:', !!token);
    console.log('Token expiry:', expiry);
    
    if (!token) {
      console.log('No token found');
      sendResponse({ 
        authenticated: false, 
        error: 'No authentication token found' 
      });
      return;
    }
    
    // Check if token is expired
    if (expiry && Date.now() > expiry) {
      console.log('Token expired, removing...');
      await chrome.storage.local.remove([CONFIG.TOKEN_KEY, CONFIG.TOKEN_EXPIRY_KEY]);
      sendResponse({ 
        authenticated: false, 
        error: 'Authentication token has expired' 
      });
      return;
    }
    
    // Verify token with backend
    console.log('Verifying token with backend...');
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const authData = await response.json();
        if (authData.valid) {
          console.log('Token is valid, user authenticated');
          sendResponse({ 
            authenticated: true, 
            user: { 
              id: authData.user_id, 
              email: authData.email 
            }
          });
        } else {
          console.log('Token invalid, removing...');
          await chrome.storage.local.remove([CONFIG.TOKEN_KEY, CONFIG.TOKEN_EXPIRY_KEY]);
          sendResponse({ 
            authenticated: false, 
            error: authData.error || 'Invalid authentication token' 
          });
        }
      } else {
        console.log('Token verification failed, removing...');
        await chrome.storage.local.remove([CONFIG.TOKEN_KEY, CONFIG.TOKEN_EXPIRY_KEY]);
        sendResponse({ 
          authenticated: false, 
          error: 'Token verification failed' 
        });
      }
    } catch (error) {
      console.log('Backend not accessible, checking token locally...');
      // If backend is not running, just check if token exists and is not expired
      // This allows the extension to work even when backend is down
      if (token && (!expiry || Date.now() < expiry)) {
        console.log('Token exists and not expired, assuming authenticated');
        sendResponse({ 
          authenticated: true, 
          user: { message: 'Backend not accessible, using cached authentication' }
        });
      } else {
        console.log('No valid token found');
        sendResponse({ 
          authenticated: false, 
          error: 'No valid authentication token found' 
        });
      }
    }
  } catch (error) {
    console.error('Auth check error:', error);
    sendResponse({ 
      authenticated: false, 
      error: `Authentication check failed: ${error.message}` 
    });
  }
}

// Handle opening authentication
async function handleOpenAuth(sendResponse) {
  try {
    console.log('Opening authentication page...');
    const redirectUri = `chrome-extension://${CONFIG.EXTENSION_ID}/auth.html`;
    const loginUrl = `${CONFIG.WEB_APP_URL}/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
    await chrome.tabs.create({ url: loginUrl });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Open auth error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle sign out
async function handleSignOut(sendResponse) {
  try {
    console.log('Signing out user...');
    
    // Clear stored tokens
    await chrome.storage.local.remove([CONFIG.TOKEN_KEY, CONFIG.TOKEN_EXPIRY_KEY]);
    
    console.log('User signed out successfully');
    sendResponse({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle opening dashboard
async function handleOpenDashboard(sendResponse) {
  try {
    console.log('Opening JobStalker AI dashboard...');
    
    // Open dashboard in new tab
    await chrome.tabs.create({ url: CONFIG.WEB_APP_URL });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Open dashboard error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle getting jobs
async function handleGetJobs(sendResponse) {
  try {
    console.log('Getting jobs...');
    
    // Get stored token
    const result = await chrome.storage.local.get([CONFIG.TOKEN_KEY]);
    const token = result[CONFIG.TOKEN_KEY];
    
    if (!token) {
      sendResponse({ success: false, error: 'Not authenticated' });
      return;
    }
    
    // Fetch jobs from backend
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/jobs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const jobs = await response.json();
      sendResponse({ success: true, jobs: jobs });
    } else {
      sendResponse({ success: false, error: 'Failed to fetch jobs' });
    }
  } catch (error) {
    console.error('Get jobs error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle saving job
async function handleSaveJob(data, sendResponse) {
  try {
    console.log('🚀 STEP 5: Background script handling job save request...');
    console.log('🚀 STEP 5.1: Job data received:', {
      url: data.url,
      canonical_url: data.canonical_url,
      stage: data.stage,
      excitement: data.excitement,
      html_content_length: data.html_content?.length || 0,
      fallback_data: data.fallback_data
    });
    
    // Get stored token
    console.log('🚀 STEP 5.2: Retrieving authentication token...');
    const result = await chrome.storage.local.get([CONFIG.TOKEN_KEY]);
    const token = result[CONFIG.TOKEN_KEY];
    console.log('🚀 STEP 5.3: Token found:', !!token);
    
    if (!token) {
      console.log('❌ STEP 5.4: No authentication token found');
      sendResponse({ success: false, error: 'Not authenticated' });
      return;
    }
    
    // Send job data to backend for AI scraping
    console.log('🚀 STEP 5.5: Determining backend endpoint based on URL...');
    const isLinkedIn = (data.url || '').includes('linkedin.com');
    const isGlassdoor = (data.url || '').includes('glassdoor.com');
    
    // Use LinkedIn endpoint for LinkedIn, universal endpoint for all others (including Glassdoor)
    const endpoint = isLinkedIn 
      ? `${CONFIG.API_BASE_URL}/api/jobs/scrape-linkedin`
      : `${CONFIG.API_BASE_URL}/api/jobs/ingest-html`;
    console.log('🚀 STEP 5.6: API endpoint:', endpoint);
    console.log('🚀 STEP 5.6.1: Site detected:', isLinkedIn ? 'LinkedIn' : (isGlassdoor ? 'Glassdoor' : 'Other'));

    // Build request payload - universal format for all sites
    const payload = isLinkedIn
      ? {
          url: data.url,
          canonical_url: data.canonical_url,
          stage: data.stage,
          excitement: data.excitement,
          html_content: data.html_content,
          fallback_data: data.fallback_data
        }
      : {
          html: data.html_content || '',
          source_url: data.url || data.canonical_url || '',
          url: data.url || data.canonical_url || '',
          canonical_url: data.canonical_url,
          stage: data.stage || "Bookmarked",
          excitement: data.excitement || 0,
          fallback_data: data.fallback_data
        };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('🚀 STEP 5.7: Backend response status:', response.status);
    console.log('🚀 STEP 5.8: Backend response ok:', response.ok);
    
    if (response.ok) {
      console.log('✅ STEP 5.9: Backend request successful, parsing response...');
      const result = await response.json();
      console.log('✅ STEP 5.10: Backend response data:', result);
      
      // Auto-reload dashboard tabs after successful job save (with delay for backend processing)
      console.log('🔄 STEP 5.10.1: Auto-reloading dashboard tabs in 2 seconds...');
      setTimeout(async () => {
        await reloadDashboardTabs();
      }, 2000); // Wait 2 seconds for backend to process the job
      
      sendResponse({ success: true, data: result });
    } else {
      console.log('❌ STEP 5.11: Backend request failed, handling error...');
      // Check for authentication errors
      if (response.status === 401) {
        console.log('❌ STEP 5.12: Authentication error (401), clearing token...');
        // Token is invalid or expired, clear it
        await chrome.storage.local.remove([CONFIG.TOKEN_KEY, CONFIG.TOKEN_EXPIRY_KEY]);
        sendResponse({ success: false, error: 'Token has expired. Please log in again.' });
      } else {
        console.log('❌ STEP 5.13: Other error, parsing error response...');
        const error = await response.json();
        console.log('❌ STEP 5.14: Error details:', error);
        sendResponse({ success: false, error: error.detail || 'Failed to save job' });
      }
    }
  } catch (error) {
    console.error('❌ STEP 5.15: Critical error in background job save:', error);
    sendResponse({ success: false, error: error.message });
  }
}


// Listen for token updates from web app
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setAuthToken') {
    handleSetAuthToken(request.token, request.expiry, sendResponse);
    return true;
  }
});

// Listen for messages from content scripts (web app)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'authCompleted') {
    console.log('Auth completed message received, checking for token...');
    // Check if we have a token in storage
    chrome.storage.local.get([CONFIG.TOKEN_KEY, CONFIG.TOKEN_EXPIRY_KEY]).then((result) => {
      if (result[CONFIG.TOKEN_KEY]) {
        console.log('Token found in storage after auth completion');
        sendResponse({ success: true, hasToken: true });
      } else {
        console.log('No token found after auth completion');
        sendResponse({ success: true, hasToken: false });
      }
    });
    return true;
  }
});

// Handle setting auth token (called from web app)
async function handleSetAuthToken(token, expiry, sendResponse) {
  try {
    console.log('Setting authentication token...');
    
    // Store token and expiry
    await chrome.storage.local.set({
      [CONFIG.TOKEN_KEY]: token,
      [CONFIG.TOKEN_EXPIRY_KEY]: expiry
    });
    
    console.log('Authentication token saved successfully');
    sendResponse({ success: true });
  } catch (error) {
    console.error('Set auth token error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Test backend connectivity
async function handleTestBackend(sendResponse) {
  try {
    console.log('Testing backend connectivity...');
    
    // Test health endpoint first
    const healthResponse = await fetch(`${CONFIG.API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    
    console.log('Health check response:', healthData);
    
    // Test auth verify endpoint
    const authResponse = await fetch(`${CONFIG.API_BASE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    const authData = await authResponse.json();
    
    console.log('Auth verify response:', authData);
    
    sendResponse({ 
      success: true, 
      health: healthData,
      auth: authData,
      backendUrl: CONFIG.API_BASE_URL
    });
  } catch (error) {
    console.error('Backend test error:', error);
    sendResponse({ 
      success: false, 
      error: error.message,
      backendUrl: CONFIG.API_BASE_URL
    });
  }
}

// Handle manual dashboard refresh
async function handleRefreshDashboard(sendResponse) {
  try {
    console.log('Manual dashboard refresh requested...');
    await reloadDashboardTabs();
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error in manual dashboard refresh:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Auto-reload dashboard tabs after job save
async function reloadDashboardTabs() {
  try {
    console.log('🔄 Starting dashboard reload process...');
    
    // Find all tabs
    const tabs = await chrome.tabs.query({});
    console.log(`🔄 Found ${tabs.length} total tabs`);
    
    // Log all tab URLs for debugging
    tabs.forEach((tab, index) => {
      console.log(`🔄 Tab ${index}: ${tab.url || 'No URL'}`);
    });
    
    // Find JobStalker AI tabs (more flexible matching)
  const jobstalkerTabs = tabs.filter(tab => 
      tab.url && (
        tab.url.includes('jobstalker-ai.com') ||
        tab.url.includes('jobstalker.vercel.app') ||
        tab.url.includes('localhost:3000') || 
        tab.url.includes('127.0.0.1:3000') ||
        tab.url.includes('localhost:5173') ||
        tab.url.includes('127.0.0.1:5173')
      )
    );
    
    console.log(`🔄 Found ${jobstalkerTabs.length} JobStalker AI tabs:`, jobstalkerTabs.map(t => t.url));
    
    if (jobstalkerTabs.length === 0) {
      console.log('⚠️ No JobStalker AI tabs found to reload');
      return;
    }
    
    // Reload each JobStalker AI tab
    for (const tab of jobstalkerTabs) {
      try {
        console.log(`🔄 Attempting to reload tab ${tab.id}: ${tab.url}`);
        await chrome.tabs.reload(tab.id);
        console.log(`✅ Successfully reloaded tab: ${tab.url}`);
      } catch (error) {
        console.error(`❌ Failed to reload tab ${tab.id} (${tab.url}):`, error);
        
        // Fallback: Try to send a refresh message to the tab
        try {
          console.log(`🔄 Fallback: Sending refresh message to tab ${tab.id}`);
          await chrome.tabs.sendMessage(tab.id, { action: 'refreshDashboard' });
          console.log(`✅ Fallback message sent to tab: ${tab.url}`);
        } catch (messageError) {
          console.error(`❌ Fallback message also failed for tab ${tab.id}:`, messageError);
        }
      }
    }
    
    console.log('✅ Dashboard reload process complete');
  } catch (error) {
    console.error('❌ Error in dashboard reload process:', error);
  }
}

// Handle extension icon click - open side panel instantly
chrome.action.onClicked.addListener(async (tab) => {
  try {
    console.log('Extension icon clicked, opening side panel for tab:', tab.id);
    
    // Open the side panel directly
    await chrome.sidePanel.open({ tabId: tab.id });
    
    console.log('Side panel opened successfully');
  } catch (error) {
    console.error('Error opening side panel:', error);
    
    // Fallback: try to open without tabId
    try {
      await chrome.sidePanel.open();
      console.log('Side panel opened without tabId');
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      
      // Last resort: open web app
      chrome.tabs.create({ url: CONFIG.WEB_APP_URL });
    }
  }
});

// Handle installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('JobStalker AI extension installed:', details);
  
  // Configure side panel globally
  try {
    await chrome.sidePanel.setOptions({
      path: 'sidepanel.html',
      enabled: true
    });
    console.log('Side panel configured globally');
  } catch (error) {
    console.error('Error configuring side panel:', error);
  }
  
  if (details.reason === 'install') {
    // Open welcome page
    chrome.tabs.create({ url: CONFIG.WEB_APP_URL });
  }
});
