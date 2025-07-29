import { API_BASE_URL, AUTH_URL } from './config.js';

// DOM Elements
const authContainer = document.getElementById('auth-container');
const notAuthenticatedDiv = document.getElementById('not-authenticated');
const authenticatedDiv = document.getElementById('authenticated');
const userEmailSpan = document.getElementById('user-email');
const jobForm = document.getElementById('job-form');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const statusMessage = document.getElementById('status-message');

// Check authentication status when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  await getCurrentTab();
});

// Event Listeners
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
document.getElementById('save-job-form').addEventListener('submit', handleSubmit);

// Authentication Functions
async function checkAuthStatus() {
  try {
    const token = await chrome.storage.local.get('authToken');
    if (token.authToken) {
      const userInfo = await chrome.storage.local.get('userEmail');
      showAuthenticatedUI(userInfo.userEmail);
      return true;
    } else {
      showNotAuthenticatedUI();
      return false;
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    showNotAuthenticatedUI();
    return false;
  }
}

function showAuthenticatedUI(email) {
  notAuthenticatedDiv.style.display = 'none';
  authenticatedDiv.style.display = 'block';
  jobForm.style.display = 'block';
  userEmailSpan.textContent = email;
}

function showNotAuthenticatedUI() {
  notAuthenticatedDiv.style.display = 'block';
  authenticatedDiv.style.display = 'none';
  jobForm.style.display = 'none';
}

async function handleLogin() {
  const authUrl = AUTH_URL;
  await chrome.tabs.create({ url: authUrl });
  window.close();
}

async function handleLogout() {
  await chrome.storage.local.remove(['authToken', 'userEmail']);
  showNotAuthenticatedUI();
}

// Form Handling
async function handleSubmit(event) {
  event.preventDefault();
  
  try {
    const formData = {
      title: document.getElementById('title').value,
      company: document.getElementById('company').value,
      location: document.getElementById('location').value,
      salary: document.getElementById('salary').value,
      url: document.getElementById('url').value,
      stage: document.getElementById('stage').value,
      excitement: getSelectedRating(),
      notes: document.getElementById('notes').value
    };

    const token = await chrome.storage.local.get('authToken');
    if (!token.authToken) {
      showError('Not authenticated. Please sign in.');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.authToken}`
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    
    if (data.success) {
      showSuccess('Job saved successfully!');
      setTimeout(() => window.close(), 2000);
    } else {
      showError(data.error || 'Failed to save job.');
    }
  } catch (error) {
    console.error('Error saving job:', error);
    showError('An error occurred while saving the job.');
  }
}

// Helper Functions
function getSelectedRating() {
  const selectedStar = document.querySelector('input[name="excitement"]:checked');
  return selectedStar ? selectedStar.value : '3';
}

async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.includes('linkedin.com/jobs')) {
      // Send message to content script to get job details
      chrome.tabs.sendMessage(tab.id, { action: 'getJobDetails' }, (response) => {
        if (response && !chrome.runtime.lastError) {
          fillFormWithJobDetails(response);
        }
      });
    }
    document.getElementById('url').value = tab?.url || '';
  } catch (error) {
    console.error('Error getting current tab:', error);
  }
}

function fillFormWithJobDetails(details) {
  if (details.title) document.getElementById('title').value = details.title;
  if (details.company) document.getElementById('company').value = details.company;
  if (details.location) document.getElementById('location').value = details.location;
  if (details.salary) document.getElementById('salary').value = details.salary;
}

function showSuccess(message) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message success';
  statusMessage.style.display = 'block';
}

function showError(message) {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message error';
  statusMessage.style.display = 'block';
} 