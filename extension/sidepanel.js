// Side panel script for JobStalker AI extension
console.log('JobStalker AI side panel loaded');

// DOM elements
const loading = document.getElementById('loading');
const content = document.getElementById('content');
const notSignedIn = document.getElementById('notSignedIn');
const signedIn = document.getElementById('signedIn');
const linkedinJob = document.getElementById('linkedinJob');
const dashboard = document.getElementById('dashboard');
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const openDashboardBtn = document.getElementById('openDashboardBtn');
const saveJobBtn = document.getElementById('saveJobBtn');
const closePanelBtn = document.getElementById('closePanelBtn');
const searchBtn = document.getElementById('searchBtn');
const menuBtn = document.getElementById('menuBtn');

// Job save elements
const jobLinkInput = document.getElementById('jobLinkInput');
const stageSelect = document.getElementById('stageSelect');
const starsContainer = document.getElementById('starsContainer');
const jobsList = document.getElementById('jobsList');

// Application form elements
const fillApplicationBtn = document.getElementById('fillApplicationBtn');
const applicationData = document.getElementById('applicationData');
const applicationDataForm = document.getElementById('applicationDataForm');
const backToJobBtn = document.getElementById('backToJobBtn');
const loadFromProfileBtn = document.getElementById('loadFromProfileBtn');

// State
let currentRating = 1; // Default to 1 star minimum
let lastUrl = null;
let urlCheckInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  console.log('Initializing side panel');
  
  // Add event listeners
  if (signInBtn) signInBtn.addEventListener('click', handleSignIn);
  if (signOutBtn) signOutBtn.addEventListener('click', handleSignOut);
  if (openDashboardBtn) openDashboardBtn.addEventListener('click', handleOpenDashboard);
  if (saveJobBtn) saveJobBtn.addEventListener('click', handleSaveJob);
  if (closePanelBtn) closePanelBtn.addEventListener('click', closePanel);
  if (searchBtn) searchBtn.addEventListener('click', handleSearch);
  if (menuBtn) menuBtn.addEventListener('click', handleMenu);
  if (fillApplicationBtn) fillApplicationBtn.addEventListener('click', handleFillApplication);
  if (applicationDataForm) applicationDataForm.addEventListener('submit', handleSaveApplicationData);
  if (backToJobBtn) backToJobBtn.addEventListener('click', () => showLinkedInJob());
  if (loadFromProfileBtn) loadFromProfileBtn.addEventListener('click', handleLoadFromProfile);
  
  // Removed test backend and manual refresh buttons
  
  // Check status
  await checkStatus();
  
  // Set up URL change detection
  setupUrlChangeDetection();
  
  // When token is saved (e.g. after sign-in in auth tab), refresh immediately so one click is enough
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'tokenUpdated') {
      console.log('Token updated, refreshing side panel...');
      checkStatus();
    }
  });
  
  // Also refresh when storage changes (auth tab saved token)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.jobstalker_auth_token) {
      console.log('Auth token changed, refreshing side panel...');
      checkStatus();
    }
  });
}

async function checkStatus() {
  try {
    console.log('🔍 STEP 1: Starting status check...');
    showLoading();
    
    // Determine if we're on any job-like page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url || '';
    
    // Detect job sites
    const isLinkedInJobDetails = url.includes('linkedin.com/jobs/search/') && url.includes('currentJobId=');
    const isLinkedInJobView = url.includes('linkedin.com/jobs/view/');
    // Treat any Glassdoor job experience page as a potential job page since many
    // job details are loaded dynamically in the right column on index pages.
    const isGlassdoorJob = url.includes('glassdoor.com');
    const isGenericJobPage = url.includes('/job/') || url.includes('/jobs/') || url.includes('/viewjob');
    
    const isJobPage = isLinkedInJobDetails || isLinkedInJobView || isGlassdoorJob || isGenericJobPage;
    
    console.log('📍 STEP 1.1: Current tab URL:', url);
    console.log('📍 STEP 1.2: Is LinkedIn job page:', isLinkedInJobDetails || isLinkedInJobView);
    console.log('📍 STEP 1.3: Is Glassdoor job page:', isGlassdoorJob);
    console.log('📍 STEP 1.4: Is generic job page:', isGenericJobPage);
    
    if (isJobPage) {
      console.log('🔐 STEP 1.5: Job page detected, checking authentication...');
      // Check if user is authenticated
      const authResponse = await chrome.runtime.sendMessage({ action: 'checkAuth' });
      console.log('🔐 STEP 1.6: Auth response:', authResponse);
      
      if (authResponse && authResponse.authenticated) {
        console.log('✅ STEP 1.7: User authenticated, showing save job interface');
        showLinkedInJob(); // Function name can stay, it's generic now
      } else {
        console.log('❌ STEP 1.8: User not authenticated, showing sign-in prompt');
        console.log('❌ Auth error:', authResponse?.error || 'No response');
        showNotSignedIn();
      }
    } else {
      console.log('🔐 STEP 1.9: Regular page detected, checking authentication...');
      // Check authentication for regular pages
      const authResponse = await chrome.runtime.sendMessage({ action: 'checkAuth' });
      console.log('🔐 STEP 1.10: Auth response:', authResponse);
      
      if (authResponse && authResponse.authenticated) {
        console.log('✅ STEP 1.11: User authenticated, showing dashboard');
        showDashboard();
      } else {
        console.log('❌ STEP 1.12: User not authenticated, showing sign-in prompt');
        console.log('❌ Auth error:', authResponse?.error || 'No response');
        showNotSignedIn();
      }
    }
  } catch (error) {
    console.error('Error checking status:', error);
    showNotSignedIn();
  }
}

function showLoading() {
  loading.style.display = 'block';
  content.style.display = 'none';
}

function showNotSignedIn() {
  loading.style.display = 'none';
  content.style.display = 'block';
  notSignedIn.classList.remove('hidden');
  signedIn.classList.add('hidden');
  linkedinJob.classList.add('hidden');
  dashboard.classList.add('hidden');
  if (applicationData) applicationData.classList.add('hidden');
}

function showSignedIn() {
  loading.style.display = 'none';
  content.style.display = 'block';
  notSignedIn.classList.add('hidden');
  signedIn.classList.remove('hidden');
  linkedinJob.classList.add('hidden');
  dashboard.classList.add('hidden');
  if (applicationData) applicationData.classList.add('hidden');
}

async function showLinkedInJob() {
  loading.style.display = 'none';
  content.style.display = 'block';
  notSignedIn.classList.add('hidden');
  signedIn.classList.add('hidden');
  linkedinJob.classList.remove('hidden');
  dashboard.classList.add('hidden');
  if (applicationData) applicationData.classList.add('hidden');
  
  // Set up job save interface
  await setupJobSaveInterface();
}

async function showDashboard() {
  loading.style.display = 'none';
  content.style.display = 'block';
  notSignedIn.classList.add('hidden');
  signedIn.classList.add('hidden');
  linkedinJob.classList.add('hidden');
  dashboard.classList.remove('hidden');
  if (applicationData) applicationData.classList.add('hidden');
  
  // Load dashboard data
  await loadDashboardData();
}

function showApplicationData() {
  loading.style.display = 'none';
  content.style.display = 'block';
  notSignedIn.classList.add('hidden');
  signedIn.classList.add('hidden');
  linkedinJob.classList.add('hidden');
  dashboard.classList.add('hidden');
  if (applicationData) applicationData.classList.remove('hidden');
  
  // Load application data
  loadApplicationData();
}

async function setupJobSaveInterface() {
  try {
    console.log('🎯 STEP 2: Setting up job save interface...');
    
    // Get current tab URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('🎯 STEP 2.1: Current tab for job save:', tab?.url);
    
    if (tab?.url) {
      if (jobLinkInput) jobLinkInput.value = tab.url;
      console.log('🎯 STEP 2.2: Job URL pre-filled:', tab.url);
    } else {
      console.warn('⚠️ STEP 2.3: No tab URL found for job save');
    }
    
    // Set up star rating
    console.log('🎯 STEP 2.4: Setting up star rating system...');
    setupStarRating();
    // Highlight first star by default
    highlightStars(1);
    console.log('✅ STEP 2.5: Job save interface setup complete');
  } catch (error) {
    console.error('❌ STEP 2.6: Error setting up job save interface:', error);
  }
}

function setupStarRating() {
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      const rating = index + 1;
      setStarRating(rating);
    });
    star.addEventListener('mouseenter', () => {
      highlightStars(index + 1);
    });
  });
  
  // Reset stars on mouse leave
  if (starsContainer) {
    starsContainer.addEventListener('mouseleave', () => {
      highlightStars(currentRating);
    });
  }
}

function setStarRating(rating) {
  currentRating = rating;
  highlightStars(rating);
  console.log('Rating set to:', rating);
}

function highlightStars(rating) {
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.textContent = '★';
      star.classList.add('filled');
    } else {
      star.textContent = '☆';
      star.classList.remove('filled');
    }
  });
}

async function loadDashboardData() {
  try {
    // Load jobs data
    const jobsResponse = await chrome.runtime.sendMessage({ action: 'getJobs' });
    
    if (jobsResponse.success) {
      displayJobs(jobsResponse.jobs || []);
    } else {
      console.error('Failed to load jobs:', jobsResponse.error);
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

function displayJobs(jobs) {
  if (jobs.length === 0) {
    jobsList.innerHTML = '<div style="text-align: center; color: #6b7280; font-size: 12px; padding: 20px;">No jobs saved yet</div>';
    return;
  }
  
  const jobsHtml = jobs.slice(0, 5).map(job => `
    <div class="job-item">
      <div class="job-title">${job.job_title || 'Untitled Job'}</div>
      <div class="job-company">${job.company || 'Unknown Company'} • ${job.location || 'Unknown Location'}</div>
    </div>
  `).join('');
  
  jobsList.innerHTML = jobsHtml;
}

async function handleSignIn() {
  try {
    console.log('Opening sign-in page...');
    const response = await chrome.runtime.sendMessage({ action: 'openAuth' });
    
    if (response.success) {
      // Refresh status after sign in
      setTimeout(() => {
        checkStatus();
      }, 1000);
    } else {
      alert('Failed to open sign-in page. Please try again.');
    }
  } catch (error) {
    console.error('Error opening sign-in:', error);
    alert('Error opening sign-in page. Please try again.');
  }
}

async function handleSignOut() {
  try {
    console.log('Signing out...');
    await chrome.runtime.sendMessage({ action: 'signOut' });
    showNotSignedIn();
  } catch (error) {
    console.error('Error signing out:', error);
    alert('Error signing out. Please try again.');
  }
}

async function handleOpenDashboard() {
  try {
    console.log('Opening dashboard...');
    const response = await chrome.runtime.sendMessage({ action: 'openDashboard' });
    
    if (response.success) {
      // Switch to dashboard view in side panel
      showDashboard();
    } else {
      alert('Failed to open dashboard. Please try again.');
    }
  } catch (error) {
    console.error('Error opening dashboard:', error);
    alert('Error opening dashboard. Please try again.');
  }
}

async function handleSaveJob() {
  try {
    console.log('💾 STEP 3: Starting job save process...');
    
    // Show loading state with progress
    if (saveJobBtn) {
      saveJobBtn.textContent = '⏳ Extracting...';
      saveJobBtn.disabled = true;
    }
    console.log('💾 STEP 3.1: UI updated to loading state');
    
    // Extract HTML content and basic data from the current page
    console.log('💾 STEP 3.2: Starting page data extraction...');
    if (saveJobBtn) saveJobBtn.textContent = '🔍 Analyzing page...';
    
    const pageData = await extractJobDataFromPage();
    console.log('💾 STEP 3.3: Page data extraction complete:', pageData);
    
    if (saveJobBtn) saveJobBtn.textContent = '🤖 Processing...';
    
    // Debug: Check if we got actual job content or login page
    if (pageData.html_content) {
      const isLoginPage = pageData.html_content.includes('Sign in with Apple') || 
                         pageData.html_content.includes('We\'ve emailed a one-time link') ||
                         pageData.html_content.includes('LinkedIn Login');
      console.log('💾 STEP 3.4: Is login page detected:', isLoginPage);
      
      if (isLoginPage) {
        console.log('⚠️ STEP 3.5: Extension detected login page - user needs to be logged into LinkedIn');
      }
    }
    
    // If we are not on a job page AND have no HTML content, stop early
    // Allow saving if we have HTML content even if detection failed (detection might be wrong)
    if (pageData && pageData.is_job_page === false && !pageData.html_content) {
      console.warn('⚠️ STEP 3.6: Not on a job details page and no HTML content. Aborting save.');
      if (saveJobBtn) {
        saveJobBtn.textContent = 'Save Link to JobStalker AI';
        saveJobBtn.disabled = false;
      }
      alert('Please navigate to a job posting page (LinkedIn, Glassdoor, etc.) before saving.');
      return;
    }
    
    // Log job page detection status for debugging
    console.log('💾 STEP 3.6.1: Job page detection:', {
      is_job_page: pageData?.is_job_page,
      has_html: !!pageData?.html_content,
      html_length: pageData?.html_content?.length || 0,
      url: pageData?.canonical_url || jobLinkInput?.value,
      fallback_data: pageData?.fallback_data
    });

    // Prepare job data for AI processing
    console.log('💾 STEP 3.6: Preparing job data for AI processing...');
    const preferredUrl = pageData?.canonical_url || jobLinkInput?.value;
    const jobData = {
      url: preferredUrl,
      canonical_url: pageData?.canonical_url || null,
      stage: stageSelect?.value,
      excitement: currentRating,
      html_content: pageData.html_content,
      fallback_data: pageData.fallback_data
    };
    
    console.log('💾 STEP 3.7: Job data prepared:', {
      url: jobData.url,
      canonical_url: jobData.canonical_url,
      stage: jobData.stage,
      excitement: jobData.excitement,
      html_content_length: jobData.html_content?.length || 0,
      fallback_data: jobData.fallback_data
    });
    
    // Show extracted data immediately if we have it
    if (pageData.fallback_data && pageData.fallback_data.job_title !== 'Unknown Job Title') {
      console.log('💾 STEP 3.7.1: Found job data:', pageData.fallback_data);
      if (saveJobBtn) saveJobBtn.textContent = `📋 Found: ${pageData.fallback_data.job_title} at ${pageData.fallback_data.company}`;
    }
    
    // Update button to show processing
    if (saveJobBtn) saveJobBtn.textContent = '🤖 AI Processing...';
    console.log('💾 STEP 3.8: UI updated to AI processing state');
    
    // Save job via background script
    console.log('💾 STEP 3.9: Sending job data to background script...');
    const response = await chrome.runtime.sendMessage({ 
      action: 'saveJob', 
      data: jobData 
    });
    
    console.log('💾 STEP 3.10: Response from background script:', response);
    
    if (response && response.success) {
      const data = response.data || {};
      const isDuplicate = data.is_duplicate === true || data.status === 'duplicate';
      
      if (isDuplicate) {
        console.log('ℹ️ Job already in dashboard (duplicate)');
        if (saveJobBtn) {
          saveJobBtn.textContent = '✓ Already in dashboard';
          saveJobBtn.style.background = '#6b7280';
        }
        // Still reload dashboard so user sees the job in the list
        setTimeout(() => {
          if (saveJobBtn) {
            saveJobBtn.textContent = 'Save Link to JobStalker AI';
            saveJobBtn.style.background = '#0041C2';
            saveJobBtn.disabled = false;
          }
        }, 2500);
        return;
      }
      
      console.log('✅ STEP 3.11: Job saved successfully!');
      console.log('✅ STEP 3.11.1: Response data:', response.data);
      
      // Show success message with job details (from backend or page fallback)
      const jobInfo = data.extracted_data || (pageData.fallback_data && {
        job_title: pageData.fallback_data.job_title,
        company: pageData.fallback_data.company
      });
      if (jobInfo && (jobInfo.job_title || jobInfo.company)) {
        const jobTitle = jobInfo.job_title || 'Job';
        const company = jobInfo.company || 'Company';
        if (saveJobBtn) saveJobBtn.textContent = `✅ Saved: ${jobTitle} at ${company}`;
        console.log('✅ STEP 3.11.2: Showing job details:', jobTitle, company);
      } else {
        if (saveJobBtn) saveJobBtn.textContent = '✅ Saved!';
      }
      if (saveJobBtn) saveJobBtn.style.background = '#10b981';
      console.log('✅ STEP 3.12: UI updated to success state');
      
      // Show dashboard reload message with countdown so new job appears
      let countdown = 2;
      const countdownInterval = setInterval(() => {
        if (saveJobBtn) {
          saveJobBtn.textContent = `🔄 Reloading in ${countdown}s...`;
          saveJobBtn.style.background = '#0041C2';
        }
        countdown--;
        
        if (countdown < 0) {
          clearInterval(countdownInterval);
          if (saveJobBtn) saveJobBtn.textContent = '🔄 Reloading Dashboard...';
          console.log('🔄 STEP 3.12.1: Showing dashboard reload message');
        }
      }, 1000);
      
      // Reset form after reload completes
      setTimeout(() => {
        clearInterval(countdownInterval);
        console.log('✅ STEP 3.13: Resetting form after success...');
        if (saveJobBtn) {
          saveJobBtn.textContent = 'Save Link to JobStalker AI';
          saveJobBtn.style.background = '#0041C2';
          saveJobBtn.disabled = false;
        }
        if (stageSelect) stageSelect.value = 'Bookmarked';
        currentRating = 1;
        highlightStars(1);
        console.log('✅ STEP 3.14: Form reset complete');
      }, 4000);
    } else {
      console.log('❌ STEP 3.15: Job save failed, handling error...');
      // Reset button state
      if (saveJobBtn) {
        saveJobBtn.textContent = 'Save Link to JobStalker AI';
        saveJobBtn.disabled = false;
      }
      
      // Check if it's a token expiry error
      if (response && response.error && response.error.includes('expired')) {
        console.log('❌ STEP 3.16: Token expired error detected');
        // Show sign-in prompt instead of generic error
        showNotSignedIn();
        alert('Your session has expired. Please sign in again to save jobs.');
      } else if (response && response.error && response.error.includes('log in to LinkedIn')) {
        console.log('❌ STEP 3.17: LinkedIn login required error detected');
        // Show LinkedIn login required error
        alert('🔐 LinkedIn Login Required\n\nPlease log in to LinkedIn first, then try saving this job again.\n\nLinkedIn requires authentication to view job details.');
      } else {
        const errorMsg = response ? (response.error || 'Unknown error') : 'No response from background script';
        console.error('❌ STEP 3.18: Save failed with error:', errorMsg);
        alert('Failed to save job: ' + errorMsg);
      }
    }
  } catch (error) {
    console.error('❌ STEP 3.19: Critical error in job save process:', error);
    
    // Reset button state
    if (saveJobBtn) {
        saveJobBtn.textContent = 'Save Link to JobStalker AI';
      saveJobBtn.disabled = false;
    }
    console.log('❌ STEP 3.20: UI reset after critical error');
    
    alert('Error saving job: ' + error.message);
  }
}

function handleSearch() {
  // Open LinkedIn jobs search
  chrome.tabs.create({ url: 'https://www.linkedin.com/jobs/' });
}

function handleMenu() {
  // Open web app dashboard
  chrome.runtime.sendMessage({ action: 'openDashboard' });
}

async function closePanel() {
  try {
    // Prefer calling with windowId per API signature; fall back to no-arg.
    const currentWindow = await chrome.windows.getCurrent();
    if (chrome?.sidePanel?.close) {
      try {
        if (currentWindow && typeof currentWindow.id === 'number') {
          await chrome.sidePanel.close({ windowId: currentWindow.id });
        } else {
          await chrome.sidePanel.close({});
        }
      } catch (err) {
        // Some Chrome versions accept no-args
        await chrome.sidePanel.close();
      }
    } else {
      // Fallback: close the panel window
      window.close();
    }
  } catch (error) {
    console.error('Error closing side panel:', error);
    try { window.close(); } catch (_) {}
  }
}

// Removed handlers for test backend and manual refresh

// Set up URL change detection
function setupUrlChangeDetection() {
  console.log('Setting up URL change detection');
  
  // Check URL every 2 seconds
  urlCheckInterval = setInterval(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab?.url;
      
      if (currentUrl && currentUrl !== lastUrl) {
        console.log('URL changed from', lastUrl, 'to', currentUrl);
        lastUrl = currentUrl;
        
        // Re-check status when URL changes
        await checkStatus();
      }
    } catch (error) {
      console.error('Error checking URL change:', error);
    }
  }, 2000);
  
  // Store initial URL
  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    lastUrl = tab?.url;
    console.log('Initial URL:', lastUrl);
  });
}

async function extractJobDataFromPage() {
  try {
    console.log('🔍 STEP 4: Starting page data extraction...');
    
    // Set a timeout to prevent extraction from taking too long
    const extractionTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Extraction timeout after 5 seconds')), 5000)
    );
    
    // Get the current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('🔍 STEP 4.1: Current tab found:', tab?.id, tab?.url);
    
    if (!tab) {
      console.error('❌ STEP 4.2: No active tab found');
      return {
        html_content: null,
        fallback_data: {
          job_title: 'Unknown Job Title',
          company: 'Unknown Company',
          location: null,
          salary: null,
          description: null
        }
      };
    }
    
    // Inject a content script to get the HTML content for AI processing
    console.log('🔍 STEP 4.3: Injecting content script into tab:', tab.id);
    
    const contentScriptPromise = chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: async () => {
        try {
          console.log('🔍 CONTENT SCRIPT: Starting page analysis...');
          
          // Get the full HTML content of the page
          const htmlContent = document.documentElement.outerHTML;
          
          // Log what we're getting for debugging
          console.log('🔍 CONTENT SCRIPT: HTML content length:', htmlContent.length);
          console.log('🔍 CONTENT SCRIPT: Page title:', document.title);
          console.log('🔍 CONTENT SCRIPT: Current URL:', window.location.href);
          
          // Also try to extract basic info as fallback
          const jobData = {
            job_title: 'Unknown Job Title',
            company: 'Unknown Company',
            location: null,
            salary: null,
            description: null
          };
          
          // Check if we're actually on a job page (not login/redirect)
          // Detect LinkedIn, Glassdoor, and other job sites
          const isLinkedIn = window.location.href.includes('linkedin.com');
          const isGlassdoor = window.location.href.includes('glassdoor.com');
          
          // For Glassdoor, be very lenient - if we're on glassdoor.com, always try to extract
          // because jobs can be in the right column on search/index pages
          const isJobPage = 
            // LinkedIn job page indicators
            (isLinkedIn && (
              document.querySelector('.jobs-details') || 
              document.querySelector('[data-testid*="job"]') ||
              document.querySelector('.job-details') ||
              document.querySelector('.jobs-unified-top-card') ||
              document.querySelector('.jobs-details__main-content') ||
              window.location.href.includes('/jobs/view/') ||
              window.location.href.includes('currentJobId=')
            )) ||
            // Glassdoor: Always treat as job page if on glassdoor.com (jobs can be in right column)
            // This allows saving jobs from search pages where job details are in the right column
            isGlassdoor ||
            // Generic job page indicators
            window.location.href.includes('/job/') ||
            window.location.href.includes('/jobs/') ||
            window.location.href.includes('/viewjob') ||
            window.location.href.includes('/job-listing');
          
          console.log('🔍 CONTENT SCRIPT: Is job page detected:', isJobPage);
          
          // Check if we're on a login page
          const isLoginPage = document.querySelector('input[type="password"]') ||
                             document.querySelector('input[name="password"]') ||
                             document.querySelector('.login-form') ||
                             document.title.includes('Sign in') ||
                             document.body.textContent.includes('Sign in with Apple') ||
                             document.body.textContent.includes('We\'ve emailed a one-time link');
          
          console.log('🔍 CONTENT SCRIPT: Is login page detected:', isLoginPage);
          
          if (isLoginPage) {
            console.log('🔍 CONTENT SCRIPT: Detected LinkedIn login page, user needs to be logged in');
            return {
              html_content: htmlContent,
              fallback_data: {
                job_title: 'LOGIN_REQUIRED',
                company: 'LOGIN_REQUIRED', 
                location: null,
                salary: null,
                description: null
              },
              is_login_page: true,
              is_job_page: false,
              canonical_url: document.querySelector('link[rel="canonical"]')?.href || null
            };
          }
          
          if (!isJobPage) {
            console.log('🔍 CONTENT SCRIPT: Not on a job page, skipping extraction');
            return {
              html_content: htmlContent,
              fallback_data: {
                job_title: 'Unknown Job Title',
                company: 'Unknown Company', 
                location: null,
                salary: null,
                description: null
              },
              is_login_page: false,
              is_job_page: false,
              canonical_url: document.querySelector('link[rel="canonical"]')?.href || null
            };
          }
          
          // Helper: sleep for dynamic SPA rendering
          const sleep = (ms) => new Promise(r => setTimeout(r, ms));

          // For Glassdoor, wait a bit for dynamic content to load (jobs in right column)
          if (isGlassdoor) {
            console.log('🔍 CONTENT SCRIPT: Glassdoor detected, waiting for dynamic content...');
            await sleep(1500); // Wait 1.5 seconds for right column job details to load
            console.log('🔍 CONTENT SCRIPT: Wait complete, checking for job elements...');
            
            // Log what we can find
            const header = document.querySelector('header[data-test="job-details-header"]');
            const jobWaypoint = document.querySelector('[id^="job-viewed-waypoint-"]');
            const jobTitle = document.querySelector('[data-test="jobTitle"]');
            console.log('🔍 CONTENT SCRIPT: Glassdoor elements found:', {
              hasHeader: !!header,
              hasWaypoint: !!jobWaypoint,
              hasJobTitle: !!jobTitle,
              headerText: header ? header.textContent.substring(0, 100) : null
            });
          }

          // Derive canonical job URL from currentJobId when available
          let canonicalUrlGuess = null;
          try {
            const url = new URL(window.location.href);
            const currentJobId = url.searchParams.get('currentJobId');
            if (currentJobId) {
              canonicalUrlGuess = `https://www.linkedin.com/jobs/view/${currentJobId}`;
            }
          } catch (e) {}

          // Try to find job title with more specific selectors
          // Add Glassdoor selectors first, then LinkedIn, then generic
          const titleSelectors = [
            // Glassdoor header selectors
            'header[data-test="job-details-header"] h1',
            'header[data-test="job-details-header"] [data-test="jobTitle"]',
            // Glassdoor fallback selectors
            '[data-test="jobTitle"]',
            '.JobDetails_jobTitle',
            '.jobTitle',
            'h1[data-test="jobTitle"]',
            '.JobHeader_jobTitle',
            'h1.JobDetails_jobTitle',
            // LinkedIn selectors
            'h1[data-testid="job-title"]',
            '.job-details-jobs-unified-top-card__job-title',
            '.jobs-unified-top-card__job-title',
            '.top-card-layout__title',
            'h1.job-title',
            '.job-details__job-title',
            'h1',
            '[data-testid*="job-title"]',
            '.jobs-details__main-content h1',
            'h1.topcard__title'
          ];
          
          console.log('🔍 CONTENT SCRIPT: Searching for job title...');
          for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim() && 
                !element.textContent.includes('Sign in') && 
                !element.textContent.includes('Login') &&
                element.textContent.length > 3) {
              jobData.job_title = element.textContent.trim();
              console.log('🔍 CONTENT SCRIPT: Found job title:', jobData.job_title);
              break;
            }
          }

          // Glassdoor right-column fallback: if still unknown but header exists,
          // use the full header text as a best-effort job title string.
          if (isGlassdoor && (!jobData.job_title || jobData.job_title === 'Unknown Job Title')) {
            const gdHeader = document.querySelector('header[data-test="job-details-header"]');
            if (gdHeader && gdHeader.textContent.trim().length > 10) {
              const headerText = gdHeader.textContent.replace(/\s+/g, ' ').trim();
              jobData.job_title = headerText;
              console.log('🔍 CONTENT SCRIPT: Using Glassdoor header text as job title fallback:', jobData.job_title);
            }
          }
          
          // Try to find company name with more specific selectors
          const companySelectors = [
            // Glassdoor header selectors
            'header[data-test="job-details-header"] [data-test="employerName"]',
            'header[data-test="job-details-header"] a[href*="/Overview/"]',
            // Glassdoor fallback selectors
            '[data-test="employerName"]',
            '.JobDetails_employerName',
            '.employerName',
            'a[data-test="employerName"]',
            '.JobHeader_employerName',
            '[data-test="jobHeader"] a',
            '.JobDetails_companyName',
            // LinkedIn selectors
            '[data-testid="company-name"]',
            '.job-details-jobs-unified-top-card__company-name',
            '.jobs-unified-top-card__company-name',
            '.topcard__org-name-link',
            'a.topcard__org-name-link',
            '.company-name',
            '.job-details__company-name',
            '[data-testid*="company"]',
            '.jobs-details__main-content .company-name',
            '.jobs-unified-top-card__subtitle-primary-grouping a'
          ];
          
          console.log('🔍 CONTENT SCRIPT: Searching for company name...');
          for (const selector of companySelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim() && element.textContent.length > 1) {
              jobData.company = element.textContent.trim();
              console.log('🔍 CONTENT SCRIPT: Found company:', jobData.company);
              break;
            }
          }
          
          // Try to find location with more specific selectors
          const locationSelectors = [
            // Glassdoor header selectors
            'header[data-test="job-details-header"] [data-test="location"]',
            // Glassdoor fallback selectors
            '[data-test="jobLocation"]',
            '.JobDetails_location',
            '.jobLocation',
            '.JobHeader_location',
            '[data-test="location"]',
            '.JobDetails_jobLocation',
            // LinkedIn selectors
            '[data-testid="job-location"]',
            '.job-details-jobs-unified-top-card__bullet',
            '.jobs-unified-top-card__bullet',
            '.topcard__flavor--bullet',
            '.jobs-unified-top-card__primary-description',
            '.job-location',
            '.job-details__location',
            '[data-testid*="location"]',
            '.jobs-details__main-content .location'
          ];
          
          console.log('🔍 CONTENT SCRIPT: Searching for location...');
          for (const selector of locationSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim() && element.textContent.length > 1) {
              jobData.location = element.textContent.trim();
              console.log('🔍 CONTENT SCRIPT: Found location:', jobData.location);
              break;
            }
          }
          
          // Try to find salary information with comprehensive selectors
          const salarySelectors = [
            // Glassdoor selectors
            '[data-test="detailSalary"]',
            '.JobDetails_salaryEstimate',
            '.salaryEstimate',
            '.JobDetails_salary',
            '[data-test="salary"]',
            '.JobDetails_estimatedSalary',
            '.estimatedSalary',
            // LinkedIn selectors
            '.job-details-jobs-unified-top-card__salary',
            '.jobs-unified-top-card__salary',
            '.jobs-details-top-card__salary',
            '.salary',
            '.compensation',
            '[data-testid*="salary"]',
            '[data-testid*="compensation"]',
            '.job-salary',
            '.pay-range',
            '.salary-range',
            '.compensation-range',
            '.job-pay',
            '.wage',
            '.remuneration',
            '.job-details__salary',
            '.jobs-unified-top-card__primary-description',
            '.jobs-unified-top-card__subtitle-primary-grouping',
            '.jobs-details__main-content .salary',
            '.jobs-details__main-content .compensation',
            'span[class*="salary"]',
            'div[class*="salary"]',
            'span[class*="compensation"]',
            'div[class*="compensation"]',
            'span[class*="pay"]',
            'div[class*="pay"]'
          ];
          
          console.log('🔍 CONTENT SCRIPT: Searching for salary...');
          for (const selector of salarySelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
              jobData.salary = element.textContent.trim();
              console.log('🔍 CONTENT SCRIPT: Found salary:', jobData.salary);
              break;
            }
          }
          
          // If no salary found via selectors, try quick regex patterns (optimized)
          if (!jobData.salary || jobData.salary === 'null') {
            console.log('🔍 CONTENT SCRIPT: No salary found via selectors, trying quick regex...');
            // Use only the most effective regex patterns to speed up processing
            const quickSalaryPatterns = [
              /\$[\d,]+(?:\.\d{2})?\s*(?:-\s*\$?[\d,]+(?:\.\d{2})?)?\s*(?:per\s+(?:year|month|hour|week))?/gi,
              /\$[\d,]+(?:\.\d{2})?\s*(?:k|K)\s*(?:per\s+(?:year|month|hour|week))?/gi
            ];
            
            // Only search in job-related sections to speed up regex processing
            const jobSections = document.querySelectorAll(
              '.jobs-details, .jobs-unified-top-card, .job-details, [data-testid*="job"], ' +
              '.JobDetails, .JobHeader, [data-test="jobHeader"], .JobDetails_jobDescription'
            );
            const searchText = jobSections.length > 0 ? 
              Array.from(jobSections).map(section => section.textContent).join(' ') : 
              document.body.textContent;
            
            for (const pattern of quickSalaryPatterns) {
              const matches = searchText.match(pattern);
              if (matches && matches.length > 0) {
                jobData.salary = matches[0].trim();
                console.log('🔍 CONTENT SCRIPT: Found salary via quick regex:', jobData.salary);
                break;
              }
            }
          }

          // Extract job description with comprehensive selectors
          const descriptionSelectors = [
            // LinkedIn specific - article element and description details (NEW - prioritize these)
            '#main article',
            'article',
            '.jobs-description_details',
            'article .jobs-description_details',
            // LinkedIn specific - main description containers (updated selectors)
            '.jobs-description__text',
            '.jobs-description-content__text',
            '.jobs-description__text--rich',
            '.jobs-description-content__text--rich',
            '.jobs-box__html-content',
            '.jobs-details__main-content',
            '.jobs-details-top-card__job-description',
            '[data-testid="job-details"]',
            '[data-testid*="job-details"]',
            '.job-details__job-description',
            '.jobs-description__text--rich-text',
            '.jobs-description-content__text--rich-text',
            // Glassdoor selectors
            '.JobDetails_jobDescription',
            '.JobDetails_jobDescriptionText',
            '[data-test="jobDescription"]',
            '.jobDescription',
            // Glassdoor dynamic job description container: id="job-viewed-waypoint-<number>"
            '[id^="job-viewed-waypoint-"]',
            // Generic fallbacks
            '.job-description',
            '.description',
            '[class*="description" i]',
            '[class*="Description"]'
          ];

          console.log('🔍 CONTENT SCRIPT: Searching for job description...');

          // Try to click "Show more" / "See more" buttons to expand full description
          const showMoreSelectors = [
            'button[aria-label*="more" i]',
            'button[aria-label*="More" i]',
            '.jobs-description__text button',
            '.jobs-description-content__text button',
            '.jobs-description__text--truncated button',
            '[data-testid*="show-more"]'
          ];

          // Click all "Show more" buttons to expand descriptions
          for (const selector of showMoreSelectors) {
            try {
              const buttons = document.querySelectorAll(selector);
              for (const button of buttons) {
                if (button.offsetParent !== null) { // Check if visible
                  button.click();
                  await sleep(500); // Wait for expansion
                  console.log('🔍 CONTENT SCRIPT: Clicked show more button');
                }
              }
            } catch (e) {
              // Ignore errors
            }
          }

          // Wait for any dynamic content to load after expansion
          await sleep(800);

          let fullDescription = "";
          let descriptionLength = 0;

          // Strategy 1: Try XPath to find article element (NEW - highest priority)
          try {
            const xpathExpressions = [
              '//*[@id="main"]/div/div[2]/div[2]/div/div[2]/div/div[2]/div[1]/div/div[5]/article',
              '//*[@id="main"]//article',
              '//article[contains(@class, "jobs")]',
              '//article'
            ];
            
            for (const xpath of xpathExpressions) {
              try {
                const result = document.evaluate(
                  xpath,
                  document,
                  null,
                  XPathResult.FIRST_ORDERED_NODE_TYPE,
                  null
                );
                
                if (result.singleNodeValue) {
                  const articleElement = result.singleNodeValue;
                  // Clone to avoid modifying original
                  const clone = articleElement.cloneNode(true);
                  
                  // Remove navigation, buttons, and other non-description elements
                  const toRemove = clone.querySelectorAll(
                    'nav, button, .jobs-apply-button, .jobs-save-button, header, footer, aside, .social-share, ' +
                    '.jobs-unified-top-card, .jobs-details-top-card, .job-actions, .job-header, script, style'
                  );
                  toRemove.forEach(el => el.remove());
                  
                  const articleText = clone.textContent || clone.innerText || '';
                  const cleanArticleText = articleText.trim();
                  
                  if (cleanArticleText.length > 200 && cleanArticleText.length > descriptionLength) {
                    fullDescription = cleanArticleText;
                    descriptionLength = cleanArticleText.length;
                    console.log(`🔍 CONTENT SCRIPT: Found description via XPath (${cleanArticleText.length} chars): ${xpath}`);
                    break; // Use the first successful XPath match
                  }
                }
              } catch (e) {
                console.log(`⚠️ CONTENT SCRIPT: XPath evaluation failed for ${xpath}:`, e);
              }
            }
          } catch (e) {
            console.log('⚠️ CONTENT SCRIPT: XPath evaluation error:', e);
          }

          // Strategy 2: Try CSS selectors for article elements and description details
          if (!fullDescription || fullDescription.length < 200) {
            const articleSelectors = [
              '#main article',
              'article',
              '.jobs-description_details',
              'article .jobs-description_details',
              'main article'
            ];
            
            for (const selector of articleSelectors) {
              try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                  for (const element of elements) {
                    // Clone to avoid modifying original
                    const clone = element.cloneNode(true);
                    
                    // Remove navigation, buttons, and other non-description elements
                    const toRemove = clone.querySelectorAll(
                      'nav, button, .jobs-apply-button, .jobs-save-button, header, footer, aside, .social-share, ' +
                      '.jobs-unified-top-card, .jobs-details-top-card, .job-actions, .job-header, script, style'
                    );
                    toRemove.forEach(el => el.remove());
                    
                    const text = clone.textContent || clone.innerText || '';
                    const cleanText = text.trim();
                    
                    if (cleanText.length > 200 && cleanText.length > descriptionLength) {
                      fullDescription = cleanText;
                      descriptionLength = cleanText.length;
                      console.log(`🔍 CONTENT SCRIPT: Found description (${cleanText.length} chars) with article selector: ${selector}`);
                    }
                  }
                }
              } catch (e) {
                // Continue to next selector
              }
            }
          }

          // Strategy 3: Try each selector and combine all found descriptions
          for (const selector of descriptionSelectors) {
            try {
              const elements = document.querySelectorAll(selector);
              if (elements.length > 0) {
                for (const element of elements) {
                  const text = element.textContent || element.innerText || '';
                  const cleanText = text.trim();
                  
                  // Only use if it's substantial (more than 100 chars) and longer than what we have
                  if (cleanText.length > 100 && cleanText.length > descriptionLength) {
                    fullDescription = cleanText;
                    descriptionLength = cleanText.length;
                    console.log(`🔍 CONTENT SCRIPT: Found description (${cleanText.length} chars) with selector: ${selector}`);
                  }
                }
              }
            } catch (e) {
              // Continue to next selector
            }
          }

          // If we found a description, use it; otherwise try to get from main content area
          if (!fullDescription || fullDescription.length < 200) {
            // Try to find the main job details section and extract all text
            const mainContentSelectors = [
              '.jobs-details__main-content',
              '[data-testid*="job"]',
              '.job-details',
              '.JobDetails',
              'main',
              '[role="main"]'
            ];
            
            for (const mainSelector of mainContentSelectors) {
              const mainContent = document.querySelector(mainSelector);
              if (mainContent) {
                // Clone to avoid modifying original
                const clone = mainContent.cloneNode(true);
                
                // Remove navigation, buttons, and other non-description elements
                const toRemove = clone.querySelectorAll(
                  'nav, button, .jobs-apply-button, .jobs-save-button, header, footer, aside, .social-share, ' +
                  '.jobs-unified-top-card, .jobs-details-top-card, .job-actions, .job-header'
                );
                toRemove.forEach(el => el.remove());
                
                const mainText = clone.textContent || clone.innerText || '';
                const cleanMainText = mainText.trim();
                
                // Only use if it's significantly longer and substantial
                if (cleanMainText.length > 300 && cleanMainText.length > descriptionLength) {
                  fullDescription = cleanMainText;
                  descriptionLength = cleanMainText.length;
                  console.log(`🔍 CONTENT SCRIPT: Found description from main content (${cleanMainText.length} chars)`);
                  break;
                }
              }
            }
          }

          jobData.description = fullDescription || null;
          console.log(`🔍 CONTENT SCRIPT: Final description length: ${fullDescription ? fullDescription.length : 0} chars`);

          // Quick retry only once if critical fields are missing (reduced from 4 retries)
          const needsRetry = () => !jobData.job_title || jobData.job_title === 'Unknown Job Title' || jobData.company === 'Unknown Company';
          if (needsRetry()) {
            await sleep(200); // Reduced from 400ms to 200ms
            for (const selector of titleSelectors) {
              const el = document.querySelector(selector);
              if (el && el.textContent.trim().length > 3) {
                jobData.job_title = el.textContent.trim();
                break;
              }
            }
            for (const selector of companySelectors) {
              const el = document.querySelector(selector);
              if (el && el.textContent.trim().length > 1) {
                jobData.company = el.textContent.trim();
                break;
              }
            }
          }
          
          // Prefer canonical job URL if available
          const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href || canonicalUrlGuess;

          console.log('🔍 CONTENT SCRIPT: Extraction complete, returning data:', jobData);
          return {
            html_content: htmlContent,
            fallback_data: jobData,
            is_login_page: false,
            is_job_page: true,
            canonical_url: canonicalUrl
          };
        } catch (error) {
          console.error('❌ CONTENT SCRIPT: Error in content script:', error);
          return {
            html_content: null,
            fallback_data: {
              job_title: 'Unknown Job Title',
              company: 'Unknown Company',
              location: null,
              salary: null,
              description: null
            },
            is_login_page: false,
            is_job_page: null,
            canonical_url: null
          };
        }
      }
    });
    
    // Race between content script and timeout
    const results = await Promise.race([contentScriptPromise, extractionTimeout]);
    
    console.log('🔍 STEP 4.4: Content script execution complete, processing results...');
    const result = results[0].result;
    console.log('🔍 STEP 4.5: Content script result:', result);
    return result;
  } catch (error) {
    console.error('❌ STEP 4.6: Error extracting job data:', error);
    return {
      html_content: null,
      fallback_data: {
        job_title: 'Unknown Job Title',
        company: 'Unknown Company',
        location: null,
        salary: null,
        description: null
      }
    };
  }
}

// Application Form Autofill Functions
async function handleFillApplication() {
  try {
    console.log('📝 Filling application form...');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      alert('No active tab found');
      return;
    }
    
    // Check if we're on an application page
    try {
      // Inject content script if needed
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['formAutofill.js']
      });
      
      // Wait a bit for script to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if it's an application page
      const checkResponse = await chrome.tabs.sendMessage(tab.id, { action: 'checkApplicationPage' });
      
      if (!checkResponse || !checkResponse.isApplicationPage) {
        // Not on an application page, show application data form
        showApplicationData();
        return;
      }
      
      // Trigger autofill
      const result = await chrome.tabs.sendMessage(tab.id, { action: 'autofillForm' });
      
      if (result && result.success) {
        if (fillApplicationBtn) {
          fillApplicationBtn.textContent = `✓ ${result.message}`;
          fillApplicationBtn.style.background = '#10b981';
          setTimeout(() => {
            fillApplicationBtn.textContent = '📝 Fill Application Form';
            fillApplicationBtn.style.background = '';
          }, 3000);
        }
      } else {
        alert(result?.message || 'Failed to fill form. Please check if you have saved your application data.');
        showApplicationData();
      }
    } catch (error) {
      console.error('Error filling application:', error);
      // If error, show application data form
      showApplicationData();
    }
  } catch (error) {
    console.error('Error in handleFillApplication:', error);
    showApplicationData();
  }
}

async function handleSaveApplicationData(e) {
  e.preventDefault();
  try {
    const formData = {
      firstName: document.getElementById('appFirstName').value,
      lastName: document.getElementById('appLastName').value,
      email: document.getElementById('appEmail').value,
      phone: document.getElementById('appPhone').value,
      address: document.getElementById('appAddress').value,
      city: document.getElementById('appCity').value,
      state: document.getElementById('appState').value,
      zipCode: document.getElementById('appZip').value,
      country: document.getElementById('appCountry').value,
      currentTitle: document.getElementById('appCurrentTitle').value,
      linkedinUrl: document.getElementById('appLinkedIn').value,
      portfolioUrl: document.getElementById('appPortfolio').value,
      workAuthUS: document.getElementById('appWorkAuth').value,
      requiresSponsorship: document.getElementById('appSponsorship').value
    };
    
    await chrome.storage.local.set({ applicationData: formData });
    
    const btn = applicationDataForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = '✓ Saved!';
    btn.style.background = '#10b981';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 2000);
    
    console.log('Application data saved:', formData);
  } catch (error) {
    console.error('Error saving application data:', error);
    alert('Failed to save application data. Please try again.');
  }
}

async function handleLoadFromProfile() {
  try {
    const result = await chrome.storage.local.get(['jobstalker_auth_token']);
    const token = result.jobstalker_auth_token;
    
    if (!token) {
      alert('Please sign in first to load your profile data.');
      return;
    }
    
    const response = await fetch('https://jobstalker2-production.up.railway.app/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const profile = await response.json();
      
      if (profile.first_name) document.getElementById('appFirstName').value = profile.first_name;
      if (profile.last_name) document.getElementById('appLastName').value = profile.last_name;
      if (profile.email) document.getElementById('appEmail').value = profile.email;
      if (profile.phone) document.getElementById('appPhone').value = profile.phone;
      if (profile.current_location) {
        const parts = profile.current_location.split(',');
        if (parts[0]) document.getElementById('appCity').value = parts[0].trim();
        if (parts[1]) document.getElementById('appState').value = parts[1].trim();
      }
      if (profile.job_title) document.getElementById('appCurrentTitle').value = profile.job_title;
      if (profile.social_links && profile.social_links.length > 0) {
        const linkedin = profile.social_links.find(l => l.type === 'linkedin' || l.url?.includes('linkedin'));
        if (linkedin) document.getElementById('appLinkedIn').value = linkedin.url;
      }
      if (profile.work_auth_us !== undefined) {
        document.getElementById('appWorkAuth').value = profile.work_auth_us ? 'yes' : 'no';
      }
      if (profile.requires_sponsorship !== undefined) {
        document.getElementById('appSponsorship').value = profile.requires_sponsorship ? 'yes' : 'no';
      }
      
      alert('Profile data loaded! Please review and save.');
    } else {
      alert('Failed to load profile data.');
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    alert('Failed to load profile data.');
  }
}

async function loadApplicationData() {
  try {
    const result = await chrome.storage.local.get(['applicationData']);
    if (result.applicationData) {
      const data = result.applicationData;
      if (data.firstName) document.getElementById('appFirstName').value = data.firstName;
      if (data.lastName) document.getElementById('appLastName').value = data.lastName;
      if (data.email) document.getElementById('appEmail').value = data.email;
      if (data.phone) document.getElementById('appPhone').value = data.phone;
      if (data.address) document.getElementById('appAddress').value = data.address;
      if (data.city) document.getElementById('appCity').value = data.city;
      if (data.state) document.getElementById('appState').value = data.state;
      if (data.zipCode) document.getElementById('appZip').value = data.zipCode;
      if (data.country) document.getElementById('appCountry').value = data.country;
      if (data.currentTitle) document.getElementById('appCurrentTitle').value = data.currentTitle;
      if (data.linkedinUrl) document.getElementById('appLinkedIn').value = data.linkedinUrl;
      if (data.portfolioUrl) document.getElementById('appPortfolio').value = data.portfolioUrl;
      if (data.workAuthUS) document.getElementById('appWorkAuth').value = data.workAuthUS;
      if (data.requiresSponsorship) document.getElementById('appSponsorship').value = data.requiresSponsorship;
    }
  } catch (error) {
    console.error('Error loading application data:', error);
  }
}

// Clean up when panel is closed
window.addEventListener('beforeunload', () => {
  if (urlCheckInterval) {
    clearInterval(urlCheckInterval);
  }
});
