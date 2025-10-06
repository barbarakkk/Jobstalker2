// Side panel script for JobStalker extension
console.log('JobStalker side panel loaded');

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

// State
let currentRating = 1; // Default to 1 star minimum
let lastUrl = null;
let urlCheckInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  console.log('Initializing side panel');
  
  // Add event listeners
  signInBtn.addEventListener('click', handleSignIn);
  signOutBtn.addEventListener('click', handleSignOut);
  openDashboardBtn.addEventListener('click', handleOpenDashboard);
  saveJobBtn.addEventListener('click', handleSaveJob);
  closePanelBtn.addEventListener('click', closePanel);
  searchBtn.addEventListener('click', handleSearch);
  menuBtn.addEventListener('click', handleMenu);
  
  // Removed test backend and manual refresh buttons
  
  // Check status
  await checkStatus();
  
  // Set up URL change detection
  setupUrlChangeDetection();
}

async function checkStatus() {
  try {
    console.log('🔍 STEP 1: Starting status check...');
    showLoading();
    
    // Determine if we're on any job-like page; prefer LinkedIn detection but allow any site
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const isLinkedInJobDetails = tab?.url?.includes('linkedin.com/jobs/search/') && tab?.url?.includes('currentJobId=');
    const isGenericPage = !!tab?.url; // show save UI on any page when authenticated
    
    console.log('📍 STEP 1.1: Current tab URL:', tab?.url);
    console.log('📍 STEP 1.2: Is LinkedIn job details page:', isLinkedInJobDetails);
    
    if (isLinkedInJobDetails || isGenericPage) {
      console.log('🔐 STEP 1.3: Job page detected, checking authentication...');
      // Check if user is authenticated
      const authResponse = await chrome.runtime.sendMessage({ action: 'checkAuth' });
      console.log('🔐 STEP 1.4: Auth response:', authResponse);
      
      if (authResponse && authResponse.authenticated) {
        console.log('✅ STEP 1.5: User authenticated, showing save job interface');
        showLinkedInJob();
      } else {
        console.log('❌ STEP 1.6: User not authenticated, showing sign-in prompt');
        console.log('❌ Auth error:', authResponse?.error || 'No response');
        showNotSignedIn();
      }
    } else {
      console.log('🔐 STEP 1.7: Regular page detected, checking authentication...');
      // Check authentication for regular pages
      const authResponse = await chrome.runtime.sendMessage({ action: 'checkAuth' });
      console.log('🔐 STEP 1.8: Auth response:', authResponse);
      
      if (authResponse && authResponse.authenticated) {
        console.log('✅ STEP 1.9: User authenticated, showing dashboard');
        showDashboard();
      } else {
        console.log('❌ STEP 1.10: User not authenticated, showing sign-in prompt');
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
}

function showSignedIn() {
  loading.style.display = 'none';
  content.style.display = 'block';
  notSignedIn.classList.add('hidden');
  signedIn.classList.remove('hidden');
  linkedinJob.classList.add('hidden');
  dashboard.classList.add('hidden');
}

async function showLinkedInJob() {
  loading.style.display = 'none';
  content.style.display = 'block';
  notSignedIn.classList.add('hidden');
  signedIn.classList.add('hidden');
  linkedinJob.classList.remove('hidden');
  dashboard.classList.add('hidden');
  
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
  
  // Load dashboard data
  await loadDashboardData();
}

async function setupJobSaveInterface() {
  try {
    console.log('🎯 STEP 2: Setting up job save interface...');
    
    // Get current tab URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('🎯 STEP 2.1: Current tab for job save:', tab?.url);
    
    if (tab?.url) {
      jobLinkInput.value = tab.url;
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
  starsContainer.addEventListener('mouseleave', () => {
    highlightStars(currentRating);
  });
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
    saveJobBtn.textContent = '⏳ Extracting...';
    saveJobBtn.disabled = true;
    console.log('💾 STEP 3.1: UI updated to loading state');
    
    // Extract HTML content and basic data from the current page
    console.log('💾 STEP 3.2: Starting page data extraction...');
    saveJobBtn.textContent = '🔍 Analyzing page...';
    
    const pageData = await extractJobDataFromPage();
    console.log('💾 STEP 3.3: Page data extraction complete:', pageData);
    
    saveJobBtn.textContent = '🤖 Processing...';
    
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
    
    // If we are not on a job page, stop early and guide the user
    if (pageData && pageData.is_job_page === false) {
      console.warn('⚠️ STEP 3.6: Not on a LinkedIn job details page. Aborting save.');
      saveJobBtn.textContent = '📁+ Save Link to JobStalker';
      saveJobBtn.disabled = false;
      alert('Please open a LinkedIn job details view (click a job so the details panel loads) before saving.');
      return;
    }

    // Prepare job data for AI processing
    console.log('💾 STEP 3.6: Preparing job data for AI processing...');
    const preferredUrl = pageData?.canonical_url || jobLinkInput.value;
    const jobData = {
      url: preferredUrl,
      canonical_url: pageData?.canonical_url || null,
      stage: stageSelect.value,
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
      saveJobBtn.textContent = `📋 Found: ${pageData.fallback_data.job_title} at ${pageData.fallback_data.company}`;
    }
    
    // Update button to show processing
    saveJobBtn.textContent = '🤖 AI Processing...';
    console.log('💾 STEP 3.8: UI updated to AI processing state');
    
    // Save job via background script
    console.log('💾 STEP 3.9: Sending job data to background script...');
    const response = await chrome.runtime.sendMessage({ 
      action: 'saveJob', 
      data: jobData 
    });
    
    console.log('💾 STEP 3.10: Response from background script:', response);
    
    if (response && response.success) {
      console.log('✅ STEP 3.11: Job saved successfully!');
      console.log('✅ STEP 3.11.1: Response data:', response.data);
      
      // Show success message with job details if available
      if (response.data && response.data.extracted_data) {
        const jobData = response.data.extracted_data;
        const jobTitle = jobData.job_title || 'Job';
        const company = jobData.company || 'Company';
        saveJobBtn.textContent = `✅ Saved: ${jobTitle} at ${company}`;
        console.log('✅ STEP 3.11.2: Showing job details:', jobTitle, company);
      } else {
        saveJobBtn.textContent = '✅ Saved!';
      }
      saveJobBtn.style.background = '#28a745';
      console.log('✅ STEP 3.12: UI updated to success state');
      
      // Show dashboard reload message with countdown
      let countdown = 2; // Reduced to 2 seconds since we have the data
      const countdownInterval = setInterval(() => {
        saveJobBtn.textContent = `🔄 Reloading in ${countdown}s...`;
        saveJobBtn.style.background = '#17a2b8';
        countdown--;
        
        if (countdown < 0) {
          clearInterval(countdownInterval);
          saveJobBtn.textContent = '🔄 Reloading Dashboard...';
          console.log('🔄 STEP 3.12.1: Showing dashboard reload message');
        }
      }, 1000);
      
      // Reset form after reload completes
      setTimeout(() => {
        clearInterval(countdownInterval);
        console.log('✅ STEP 3.13: Resetting form after success...');
        saveJobBtn.textContent = '📁+ Save Link to JobStalker';
        saveJobBtn.style.background = '#0a66c2';
        saveJobBtn.disabled = false;
        stageSelect.value = 'Bookmarked';
        currentRating = 1;
        highlightStars(1);
        console.log('✅ STEP 3.14: Form reset complete');
      }, 4000); // Reduced to 4 seconds
    } else {
      console.log('❌ STEP 3.15: Job save failed, handling error...');
      // Reset button state
      saveJobBtn.textContent = '📁+ Save Link to JobStalker';
      saveJobBtn.disabled = false;
      
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
    saveJobBtn.textContent = '📁+ Save Link to JobStalker';
    saveJobBtn.disabled = false;
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

function closePanel() {
  // Close the side panel
  chrome.sidePanel.close();
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
          const isJobPage = document.querySelector('.jobs-details') || 
                           document.querySelector('[data-testid*="job"]') ||
                           document.querySelector('.job-details') ||
                           document.querySelector('.jobs-unified-top-card') ||
                           document.querySelector('.jobs-details__main-content') ||
                           window.location.href.includes('/jobs/view/') ||
                           window.location.href.includes('currentJobId=');
          
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
            console.log('🔍 CONTENT SCRIPT: Not on a LinkedIn job page, skipping extraction');
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
          const titleSelectors = [
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
          
          // Try to find company name with more specific selectors
          const companySelectors = [
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
            const jobSections = document.querySelectorAll('.jobs-details, .jobs-unified-top-card, .job-details, [data-testid*="job"]');
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

// Clean up when panel is closed
window.addEventListener('beforeunload', () => {
  if (urlCheckInterval) {
    clearInterval(urlCheckInterval);
  }
});
