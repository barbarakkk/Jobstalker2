// Basic heuristic extractor for a LinkedIn job page
function extractJobData() {
    const job = {};
  
    job.job_url = location.href;
  
    // Title
    const titleEl = document.querySelector(".topcard__title, h1");
    job.title = titleEl ? titleEl.innerText.trim() : "";
  
    // Company
    const companyEl = document.querySelector(".topcard__org-name-link, .topcard__flavor a");
    job.company = companyEl ? companyEl.innerText.trim() : "";
  
    // Location
    const locationEl = document.querySelector(".topcard__flavor--bullet");
    job.location = locationEl ? locationEl.innerText.trim() : "";
  
    // Posted date (LinkedIn uses things like 'Posted 3 days ago')
    const postedEl = Array.from(document.querySelectorAll(".posted-time-ago__text, .topcard__flavor--metadata")).find(e =>
      /Posted/i.test(e.innerText)
    );
    job.posted = postedEl ? postedEl.innerText.trim() : "";
  
    // Job id from URL if any (simplistic)
    const match = location.href.match(/currentJobId=(\d+)|jobs\/view\/(\d+)/);
    job.job_id = match ? (match[1] || match[2]) : null;
  
    // Full raw HTML snippet for context
    job.raw_html = document.body.innerText.slice(0, 10000); // limit size
  
    return job;
  }
  
  // Listen for popup asking for data
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "EXTRACT_LINKEDIN_JOB") {
      const extracted = extractJobData();
      sendResponse({ job: extracted });
    }
  });
  