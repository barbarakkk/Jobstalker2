// Function to check auth state
function checkAuthState() {
  // Get the Supabase auth token key
  const key = `sb-${window.location.hostname}-auth-token`;
  const sessionData = localStorage.getItem(key);

  if (!sessionData) {
    console.log('No session data found');
    clearStorage();
    return;
  }

  try {
    const data = JSON.parse(sessionData);
    if (data?.user?.id && data?.user?.email) {
      console.log('Found valid user data');
      saveAuthData(data.user);
    } else {
      console.log('Invalid user data');
      clearStorage();
    }
  } catch (error) {
    console.error('Error parsing session data:', error);
    clearStorage();
  }
}

// Helper function to save auth data
function saveAuthData(user) {
  chrome.storage.local.set({
    authToken: user.id,
    userEmail: user.email,
    lastChecked: Date.now()
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Failed to save auth data:', chrome.runtime.lastError);
    } else {
      console.log('Auth data saved successfully');
    }
  });
}

// Helper function to clear storage
function clearStorage() {
  chrome.storage.local.remove(['authToken', 'userEmail', 'lastChecked'], () => {
    if (chrome.runtime.lastError) {
      console.error('Failed to clear auth data:', chrome.runtime.lastError);
    } else {
      console.log('Auth data cleared');
    }
  });
}

// Export functions
window.authCheck = {
  checkAuthState,
  saveAuthData,
  clearStorage
}; 