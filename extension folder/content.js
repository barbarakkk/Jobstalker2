// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getJobDetails') {
    const jobDetails = extractJobDetails();
    sendResponse(jobDetails);
  }
  return true; // Keep the message channel open for async response
});

// Extract job details from LinkedIn page
function extractJobDetails() {
  try {
    const details = {
      title: '',
      company: '',
      location: '',
      salary: ''
    };

    // Job Title
    const titleElement = document.querySelector('.job-details-jobs-unified-top-card__job-title');
    if (titleElement) {
      details.title = titleElement.textContent.trim();
    }

    // Company Name
    const companyElement = document.querySelector('.job-details-jobs-unified-top-card__company-name');
    if (companyElement) {
      details.company = companyElement.textContent.trim();
    }

    // Location
    const locationElement = document.querySelector('.job-details-jobs-unified-top-card__bullet');
    if (locationElement) {
      details.location = locationElement.textContent.trim();
    }

    // Salary
    // Try multiple potential selectors as LinkedIn's salary information can appear in different places
    const salarySelectors = [
      '.job-details-jobs-unified-top-card__job-insight span:contains("$")',
      '.compensation-information',
      '.salary-range-text'
    ];

    for (const selector of salarySelectors) {
      const salaryElement = document.querySelector(selector);
      if (salaryElement && salaryElement.textContent.includes('$')) {
        details.salary = salaryElement.textContent.trim();
        break;
      }
    }

    // If we couldn't find the salary in the top card, try searching in the job description
    if (!details.salary) {
      const jobDescription = document.querySelector('.job-details-jobs-unified-top-card__job-description');
      if (jobDescription) {
        const text = jobDescription.textContent;
        const salaryMatch = text.match(/\$[\d,]+(K|k)?(\s*-\s*\$[\d,]+(K|k)?)?(\s*\/\s*(year|yr|month|mo|hour|hr|annual|annually))?/);
        if (salaryMatch) {
          details.salary = salaryMatch[0].trim();
        }
      }
    }

    // Fallback for older LinkedIn layouts
    if (!details.title) {
      const oldTitleElement = document.querySelector('.top-card-layout__title');
      if (oldTitleElement) {
        details.title = oldTitleElement.textContent.trim();
      }
    }

    if (!details.company) {
      const oldCompanyElement = document.querySelector('.top-card-layout__subtitle');
      if (oldCompanyElement) {
        details.company = oldCompanyElement.textContent.trim();
      }
    }

    if (!details.location) {
      const oldLocationElement = document.querySelector('.top-card-layout__subtitle-secondary');
      if (oldLocationElement) {
        details.location = oldLocationElement.textContent.trim();
      }
    }

    // Clean up any remaining whitespace and special characters
    Object.keys(details).forEach(key => {
      if (details[key]) {
        details[key] = details[key]
          .replace(/[\n\r\t]+/g, ' ')  // Replace newlines and tabs with spaces
          .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
          .trim();                     // Remove leading/trailing whitespace
      }
    });

    return details;
  } catch (error) {
    console.error('Error extracting job details:', error);
    return {
      title: '',
      company: '',
      location: '',
      salary: ''
    };
  }
} 