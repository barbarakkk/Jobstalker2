let excitement = 0;

window.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('login-btn');
  const mainUi = document.getElementById('main-ui');
  const addBtn = document.getElementById('add-btn');
  const statusDiv = document.getElementById('status');
  const notesInput = document.getElementById('notes');
  const statusSelect = document.getElementById('job-status');
  const stars = document.querySelectorAll('#star-rating .star');
  const excitementValue = document.getElementById('excitement-value');

  // Hide both by default until check is done
  loginBtn.style.display = 'none';
  mainUi.style.display = 'none';

  // Check for JobStalker tab and token
  chrome.tabs.query({url: 'https://jobstalker.netlify.app/*'}, (jobstalkerTabs) => {
    if (jobstalkerTabs.length === 0) {
      // No JobStalker tab open, show login button
      loginBtn.style.display = 'block';
      mainUi.style.display = 'none';
      statusDiv.innerText =
        'You need to register or log in to use this feature. Click the button above to register or log in. After registering, return to LinkedIn and try again.';
      return;
    }
    const jobstalkerTab = jobstalkerTabs[0];
    // Inject script to get access_token from localStorage/sessionStorage
    chrome.scripting.executeScript({
      target: {tabId: jobstalkerTab.id},
      func: () => ({
        access_token: localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
      })
    }, (tokenResults) => {
      const result = tokenResults && tokenResults[0] && tokenResults[0].result;
      const accessToken = result && result.access_token;
      if (!accessToken) {
        // Not logged in
        loginBtn.style.display = 'block';
        mainUi.style.display = 'none';
        statusDiv.innerText =
          'You need to register or log in to use this feature. Click the button above to register or log in. After registering, return to LinkedIn and try again.';
      } else {
        // Logged in
        loginBtn.style.display = 'none';
        mainUi.style.display = 'block';
        statusDiv.innerText = '';
        // Enable Add button
        addBtn.disabled = false;
        // Add click handler for Add button
        addBtn.onclick = async () => {
          statusDiv.innerText = 'Extracting job data...';
          // Get current tab (should be LinkedIn job page)
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];
            // Ask content script for job data
            chrome.tabs.sendMessage(tab.id, { action: 'get_job_data' }, async (response) => {
              let job = response && response.job ? response.job : null;
              // If job data is missing or incomplete, get full HTML and send to backend for LLM extraction
              if (!job || !job.title || !job.company) {
                statusDiv.innerText = 'Extracting full page HTML for AI parsing...';
                chrome.scripting.executeScript({
                  target: {tabId: tab.id},
                  func: () => document.documentElement.outerHTML
                }, async (results) => {
                  if (results && results[0] && results[0].result) {
                    const html = results[0].result;
                    try {
                      statusDiv.innerText = 'Sending to backend for AI extraction...';
                      const parseRes = await fetch('https://jobstalker.netlify.app/api/parse-job', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${accessToken}`
                        },
                        body: JSON.stringify({ jobHtml: html })
                      });
                      const parseData = await parseRes.json();
                      job = parseData;
                    } catch (err) {
                      statusDiv.innerText = 'Error extracting job fields with AI.';
                      return;
                    }
                  } else {
                    statusDiv.innerText = 'Could not extract page HTML.';
                    return;
                  }
                  submitJob(job, accessToken);
                });
                return;
              }
              submitJob(job, accessToken);
            });
          });
        };
      }
    });
  });

  // Login button click handler
  loginBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://jobstalker.netlify.app/login' });
  });

  // Star rating UI logic
  stars.forEach(star => {
    star.addEventListener('click', () => {
      excitement = parseInt(star.getAttribute('data-value'));
      // Fill stars up to selected
      stars.forEach(s => {
        s.innerHTML = parseInt(s.getAttribute('data-value')) <= excitement ? '\u2605' : '\u2606';
      });
      excitementValue.textContent = excitement;
    });
  });

  // Helper to submit job to backend
  async function submitJob(job, accessToken) {
    const notes = notesInput.value;
    const statusVal = statusSelect.value;
    const jobData = {
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      salary: job.salary || '',
      url: job.url || job.job_url || '',
      description: job.description || '',
      notes,
      excitement,
      stage: statusVal
    };
    statusDiv.innerText = 'Sending job to JobStalker...';
    try {
      const res = await fetch('https://jobstalker.netlify.app/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(jobData)
      });
      const data = await res.json();
      if (data.success) {
        statusDiv.innerText = 'Job saved successfully!';
      } else {
        statusDiv.innerText = 'Error: ' + (data.error || 'Could not save job.');
      }
    } catch (err) {
      statusDiv.innerText = 'Network error: ' + err.message;
    }
  }
}); 