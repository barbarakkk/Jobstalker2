// Content script for auto-filling job application forms
(function() {
  'use strict';
  
  // Detect if we're on an application page
  const APPLICATION_SITES = {
    greenhouse: {
      domains: ['greenhouse.io'],
      selectors: {
        firstName: 'input[name*="first"], input[id*="first"], input[placeholder*="First"], input[placeholder*="first"]',
        lastName: 'input[name*="last"], input[id*="last"], input[placeholder*="Last"], input[placeholder*="last"]',
        email: 'input[type="email"], input[name*="email"], input[id*="email"]',
        phone: 'input[type="tel"], input[name*="phone"], input[id*="phone"]',
        linkedin: 'input[name*="linkedin"], input[id*="linkedin"], input[placeholder*="linkedin"]',
        portfolio: 'input[name*="website"], input[name*="portfolio"], input[name*="url"], input[id*="website"], input[id*="portfolio"]'
      }
    },
    lever: {
      domains: ['lever.co'],
      selectors: {
        firstName: 'input[name*="firstName"], input[id*="firstName"], input[name*="first"]',
        lastName: 'input[name*="lastName"], input[id*="lastName"], input[name*="last"]',
        email: 'input[type="email"], input[name*="email"]',
        phone: 'input[type="tel"], input[name*="phone"]',
        linkedin: 'input[name*="urls[LinkedIn]"], input[name*="linkedin"], input[id*="linkedin"]'
      }
    },
    workday: {
      domains: ['myworkdayjobs.com', 'workday.com'],
      selectors: {
        firstName: 'input[aria-label*="First"], input[name*="first"], input[id*="first"]',
        lastName: 'input[aria-label*="Last"], input[name*="last"], input[id*="last"]',
        email: 'input[type="email"], input[name*="email"]',
        phone: 'input[type="tel"], input[name*="phone"]'
      }
    },
    smartrecruiters: {
      domains: ['smartrecruiters.com'],
      selectors: {
        firstName: 'input[name*="firstName"], input[id*="firstName"], input[name*="first"]',
        lastName: 'input[name*="lastName"], input[id*="lastName"], input[name*="last"]',
        email: 'input[type="email"], input[name*="email"]',
        phone: 'input[type="tel"], input[name*="phone"]'
      }
    }
  };
  
  function detectApplicationSite() {
    const hostname = window.location.hostname.toLowerCase();
    for (const [siteName, config] of Object.entries(APPLICATION_SITES)) {
      if (config.domains.some(domain => hostname.includes(domain))) {
        return { site: siteName, config };
      }
    }
    return null;
  }
  
  function fillField(selector, value) {
    if (!value) return false;
    const elements = document.querySelectorAll(selector);
    let filled = false;
    elements.forEach(el => {
      if (el && !el.value && el.type !== 'hidden' && !el.disabled) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
        filled = true;
      }
    });
    return filled;
  }
  
  async function autofillForm() {
    const siteInfo = detectApplicationSite();
    if (!siteInfo) {
      console.log('JobStalker: Not on a recognized application site');
      return { success: false, message: 'Not on a recognized application site' };
    }
    
    console.log('JobStalker: Detected application site:', siteInfo.site);
    
    // Get application data from storage
    return new Promise((resolve) => {
      chrome.storage.local.get(['applicationData'], (result) => {
        if (!result.applicationData) {
          resolve({ success: false, message: 'No application data found. Please fill out your profile first.' });
          return;
        }
        
        const data = result.applicationData;
        const selectors = siteInfo.config.selectors;
        let filledCount = 0;
        
        // Fill fields
        if (fillField(selectors.firstName, data.firstName)) filledCount++;
        if (fillField(selectors.lastName, data.lastName)) filledCount++;
        if (fillField(selectors.email, data.email)) filledCount++;
        if (fillField(selectors.phone, data.phone)) filledCount++;
        if (selectors.linkedin && fillField(selectors.linkedin, data.linkedinUrl)) filledCount++;
        if (selectors.portfolio && fillField(selectors.portfolio, data.portfolioUrl)) filledCount++;
        
        resolve({
          success: true,
          message: `Filled ${filledCount} fields on ${siteInfo.site}`,
          filledCount
        });
      });
    });
  }
  
  // Listen for messages from extension
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'autofillForm') {
      autofillForm().then(result => sendResponse(result));
      return true; // Keep channel open for async response
    }
    if (request.action === 'checkApplicationPage') {
      const siteInfo = detectApplicationSite();
      sendResponse({ isApplicationPage: !!siteInfo, site: siteInfo?.site });
      return false;
    }
  });
  
  // Auto-fill on page load if it's an application page
  function attemptAutoFill() {
    const siteInfo = detectApplicationSite();
    if (siteInfo) {
      console.log('JobStalker: Auto-detected application page, auto-filling...');
      setTimeout(() => {
        autofillForm().then(result => {
          if (result.success) {
            console.log('JobStalker: Auto-filled', result.filledCount, 'fields');
          }
        });
      }, 2000); // Wait 2 seconds for form to load
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attemptAutoFill);
  } else {
    attemptAutoFill();
  }
  
  // Also try after a delay in case form loads dynamically
  setTimeout(attemptAutoFill, 3000);
})();
