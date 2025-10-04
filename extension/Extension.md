## JobStalker 2 – Chrome Extension (Beta Guide)

This extension lets you save LinkedIn jobs in one click and send them to your JobStalker dashboard. It extracts clean job details using an AI service on the backend.

### What the extension does
- Adds a side panel on LinkedIn.
- On a job details view, click “Save Job” to send the job to your backend.
- The backend converts the page URL to the canonical job URL and fetches the focused job HTML.
- AI extracts fields like job title, company, location, salary, description.
- Your dashboard shows latest saves, stages, and simple stats.

### Requirements
- Chrome 116+ (side panel supported).
- A JobStalker account (for auth token).
- Backend/API running and reachable (see project README).

### Install (Developer Mode)
1. Open Chrome → `chrome://extensions` → enable Developer mode.
2. Click “Load unpacked” and select the `extension/` directory.
3. Confirm the extension appears and shows a “Service worker”.

### How to use
1. Log in to JobStalker from the web app so the extension can obtain a token.
2. Go to LinkedIn Jobs, open a job details view (click a result so the right-side details panel loads, or open `/jobs/view/{id}`).
3. Open the JobStalker side panel (click the extension icon, or use the side panel icon in Chrome if pinned).
4. Check the prefilled link, pick a stage (Bookmarked, Applying, Applied, Interviewing, Accepted), set excitement stars, then click “Save Job”.
5. Watch the inline logs (loading → AI processing → saved). The job should appear in your dashboard shortly.

### Data flow (high level)
1. Extension collects: current URL, small fallback fields, and full page HTML.
2. It also derives a canonical URL (or from `currentJobId`).
3. Backend prefers the canonical `/jobs/view/{id}` URL and fetches HTML server‑side with proper headers.
4. AI (gpt‑4o‑mini) extracts structured data; backend saves to DB.
5. Extension shows success, dashboard lists the saved job.

### Privacy & security
- The OpenAI API key is never shipped in the extension; AI calls happen only on the server.
- Requests are authenticated with your JobStalker token.
- Logs include debug states but no private credentials.

### Known limitations (beta)
- Works best on LinkedIn job details views. Feeds/search pages are normalized automatically, but if LinkedIn UI changes, extraction may briefly degrade.
- Salary is often absent on LinkedIn and may return null.

### Troubleshooting
- If the button says “Please open a LinkedIn job details view…”, click the job to open its details panel and try again.
- Open side panel DevTools → Console and enable “Preserve log”. Re-run a save and copy errors if you need support.
- Background/service worker logs show network status and backend responses. Check for 401 (auth), 429/5xx (server), or CORS issues.

### Changelog highlights
- Canonical URL normalization to `/jobs/view/{id}` for reliable scraping.
- Server-side fetch before AI extraction for cleaner HTML.
- Short retry in content script to handle LinkedIn SPA rendering.
- Removed “Rejected” from stages.


