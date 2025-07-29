// Constants
const API_BASE_URL = 'https://jobstalker.com/api';
const AUTH_URL = 'https://jobstalker.com/login';

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  // Clear any existing auth data on install/update
  chrome.storage.local.remove(['authToken', 'userEmail']);
});

// Listen for messages from the popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'parseJobWithLLM') {
    parseJobWithLLM(request.jobHtml)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep the message channel open for async response
  }
});

// Listen for auth callback
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.url.startsWith('https://jobstalker.com/auth/callback')) {
    try {
      // Extract token from URL or page
      const token = await extractAuthToken(details.tabId);
      if (token) {
        // Validate token and get user info
        const userInfo = await validateToken(token);
        if (userInfo) {
          // Store auth data
          await chrome.storage.local.set({
            authToken: token,
            userEmail: userInfo.email
          });
          
          // Close the auth tab
          chrome.tabs.remove(details.tabId);
          
          // Notify any open popup
          chrome.runtime.sendMessage({ action: 'authSuccess' });
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error);
    }
  }
}, {
  url: [{
    urlPrefix: 'https://jobstalker.com/auth/callback'
  }]
});

// Helper function to extract auth token
async function extractAuthToken(tabId) {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Look for token in various places
        return {
          urlToken: new URLSearchParams(window.location.search).get('token'),
          localToken: localStorage.getItem('authToken'),
          sessionToken: sessionStorage.getItem('authToken')
        };
      }
    });

    if (result && result[0] && result[0].result) {
      const { urlToken, localToken, sessionToken } = result[0].result;
      return urlToken || localToken || sessionToken;
    }
  } catch (error) {
    console.error('Error extracting token:', error);
  }
  return null;
}

// Helper function to validate token and get user info
async function validateToken(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Token validation error:', error);
  }
  return null;
}

// Helper function to parse job with LLM
async function parseJobWithLLM(jobHtml) {
  try {
    const token = await chrome.storage.local.get('authToken');
    if (!token.authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/parse-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.authToken}`
      },
      body: JSON.stringify({ jobHtml })
    });

    if (!response.ok) {
      throw new Error('Failed to parse job details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error parsing job with LLM:', error);
    throw error;
  }
}

// Helper function to check if token is expired
function isTokenExpired(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const { exp } = JSON.parse(jsonPayload);
    return exp * 1000 < Date.now();
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}

// Periodically check token expiration
setInterval(async () => {
  try {
    const { authToken } = await chrome.storage.local.get('authToken');
    if (authToken && isTokenExpired(authToken)) {
      // Clear expired token
      await chrome.storage.local.remove(['authToken', 'userEmail']);
      // Notify any open popup
      chrome.runtime.sendMessage({ action: 'authExpired' });
    }
  } catch (error) {
    console.error('Error in token expiration check:', error);
  }
}, 60000); // Check every minute 