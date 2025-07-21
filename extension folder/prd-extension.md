# PRD Extension Document

## Overview

This document outlines the requirements for the JobStalker browser extension, which enables users to save job postings directly to their JobStalker account from job boards such as LinkedIn. The extension will streamline the job-saving process, ensure user authentication, and leverage AI to extract job details.

---

## Goals
- Allow users to save job postings to JobStalker from their browser.
- Require users to be signed in to use the extension.
- Extract job details automatically from LinkedIn job posts.
- Allow manual entry for additional fields (Stage, Excitement, Notes).
- Use LLM (AI) to parse and extract job details when needed.

---

## User Stories

1. **As a user, I want to save a job posting from LinkedIn to my JobStalker account with one click.**
2. **As a user, I want to be prompted to log in or sign up if I am not authenticated.**
3. **As a user, I want the extension to auto-fill job title, company, location, salary, and job link when possible.**
4. **As a user, I want to manually enter or edit Stage, Excitement, and Notes.**
5. **As a user, I want the extension to use AI to extract job details from the job post content if they are not easily available.**

---

## Functional Requirements

### 1. Authentication
- The extension must check if the user is authenticated with JobStalker.
- If not authenticated, redirect the user to the JobStalker web app for login/signup.
- After authentication, return to the extension for job saving.

### 2. Job Data Extraction
- When on a LinkedIn job post, the extension should extract:
  - Job Title
  - Company
  - Location
  - Salary (if available)
  - Job Link (current URL)
- If not on LinkedIn, allow manual entry for all fields.

### 3. Manual Data Entry
- The extension UI must allow users to select or enter:
  - Stage (dropdown)
  - Excitement (star rating)
  - Notes (text area)

### 4. LLM Integration
- If job details (title, company, location, salary, link) are missing or ambiguous, send the job post content to the backend.
- The backend will use an LLM to parse and return the required fields.

### 5. Save Job
- On submit, send all job data to the JobStalker backend API.
- Show a success or error message in the extension.

---

## API Details

### Save Job Endpoint
- **URL:** `POST /api/jobs`
- **Headers:**
  - `Authorization: Bearer <supabase_jwt_token>`
  - `Content-Type: application/json`
- **Request Body Example:**
```json
{
  "title": "Managing Director (AI Utilities Product)",
  "company": "Ruby Labs",
  "location": "Remote, USA",
  "salary": "$200,000 - $250,000",
  "url": "https://www.linkedin.com/jobs/view/123456789/",
  "stage": "Bookmarked",
  "excitement": 4,
  "notes": "Looks promising, follow up next week."
}
```
- **Success Response:**
```json
{
  "success": true,
  "jobId": "abc123"
}
```
- **Error Response:**
```json
{
  "success": false,
  "error": "Invalid token or missing fields."
}
```

### LLM Parsing Endpoint (if applicable)
- **URL:** `POST /api/parse-job`
- **Headers:**
  - `Authorization: Bearer <supabase_jwt_token>`
  - `Content-Type: application/json`
- **Request Body Example:**
```json
{
  "jobHtml": "<html>...LinkedIn job post HTML...</html>"
}
```
- **Success Response:**
```json
{
  "title": "Managing Director (AI Utilities Product)",
  "company": "Ruby Labs",
  "location": "Remote, USA",
  "salary": "$200,000 - $250,000",
  "url": "https://www.linkedin.com/jobs/view/123456789/"
}
```

---

## Auth Flow

1. **Check Authentication:**
   - On extension open, check if a valid Supabase session/JWT exists (using Supabase JS client or stored token).
2. **If Not Authenticated:**
   - Redirect user to JobStalker web app login/signup page (e.g., `https://jobstalker.com/login`).
   - After successful login, the user is redirected back to the extension (or prompted to reopen it).
3. **If Authenticated:**
   - Use the Supabase JWT for all API requests from the extension.
   - Store the session securely (e.g., extension storage, not localStorage if possible).
4. **Logout:**
   - Provide a way for the user to log out, which clears the session/JWT from the extension.

---

## Non-Functional Requirements
- The extension must be compatible with Chrome and Edge browsers (optionally Firefox).
- The extension must have a responsive and user-friendly UI.
- All data transmissions must be secure (HTTPS).

---

## Out of Scope
- Support for job boards other than LinkedIn (for MVP).
- Advanced analytics or reporting features.

---

## Open Questions
- Which LLM service will be used (OpenAI, custom, etc.)?
- What is the expected response time for LLM parsing?
- Should the extension support other job boards in the future?

---

## Appendix
- See attached screenshot for reference UI. 