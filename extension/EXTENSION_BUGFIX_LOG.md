## JobStalker Extension – Bug Fix Log

### Overview
This document captures the issues encountered while saving LinkedIn jobs via the browser extension, and the changes we made to resolve them.

### Symptoms Observed
- "Unknown Job Title" / "Unknown Company" with missing location and salary.
- Backend logs showed fallback used: `09_fallback_used` and `Unknown ...` values persisted.
- Background logs carried a LinkedIn search URL (with `currentJobId`) instead of a job details URL.
- Side panel content-script error: `await is only valid in async functions`.

### Root Causes
1. Non-canonical URLs: The extension often sent LinkedIn search/feed URLs (e.g., `.../jobs/search/?...&currentJobId=...`) whose HTML is noisy and does not contain a stable job header.
2. AI given noisy HTML: Backend AI extraction ran on this non-focused HTML, failed to find title/company, and then backend used the Unknown fallback.
3. Content script async error: The injected function used `await` without being declared `async`, causing a runtime error.
4. Dynamic SPA rendering: Header fields sometimes weren’t present immediately when the content script ran.
5. UI mismatch: Stage list included `Rejected`, which is not used.

### Fixes Implemented
- Side panel (`extension/sidepanel.js`)
  - Added canonical URL handling: content script computes `canonical_url` and a fallback from `currentJobId` → `https://www.linkedin.com/jobs/view/{id}`.
  - Message payload now includes `canonical_url` alongside `url`.
  - Added guard: if not on a LinkedIn job details view, abort save and prompt the user.
  - Declared injected content script function `async` to allow `await` usage (fixes syntax error).
  - Resilience updates: broadened selectors, added a short retry loop to wait for SPA render, and improved location/salary selectors.

- Background script (`extension/background.js`)
  - Forwards `canonical_url` to the backend and logs it for debugging.

- Backend (`backend/main.py`)
  - Request model `LinkedInScrapeRequest` now accepts `canonical_url`.
  - Computes an `effective_url`:
    - prefer `canonical_url` from the extension;
    - else derive `/jobs/view/{currentJobId}` when only `url` is a search/feed link.
  - Server-side fetch: downloads HTML from `effective_url` with realistic headers and runs AI extraction on that HTML.
  - Falls back to extension HTML only if server fetch fails.
  - Records `effective_url` in debug states for traceability.

- UI cleanup (`extension/sidepanel.html`)
  - Removed `Rejected` from the Stage dropdown.

### Verification Steps
1. Load a LinkedIn job and open the side panel.
2. Click Save. In side panel/background logs, confirm `canonical_url` and that `effective_url` in backend logs is `https://www.linkedin.com/jobs/view/{id}`.
3. Backend logs show: "Successfully fetched HTML content" and AI extraction result with a non-Unknown title/company.
4. Saved job appears in the dashboard with correct title, company, and location.

### Lessons Learned
- Always normalize third‑party URLs to their canonical, stable form before scraping.
- For SPA pages, add a short wait/retry when reading DOM to handle late renders.
- Log structured states end‑to‑end (`url`, `canonical_url`, `effective_url`) to shorten debug loops.


