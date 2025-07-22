function extractJobData() {
  // Best-effort selectors for LinkedIn job post
  const title = document.querySelector('h1.topcard__title')?.innerText || '';
  const company = document.querySelector('a.topcard__org-name-link, span.topcard__flavor')?.innerText || '';
  const location = document.querySelector('span.topcard__flavor--bullet')?.innerText || '';
  const salary = document.querySelector('span.salary')?.innerText || '';
  const url = window.location.href;
  return { title, company, location, salary, url };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get_job_data') {
    sendResponse({ job: extractJobData() });
  }
}); 