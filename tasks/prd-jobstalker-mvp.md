**Product Requirements Document (PRD)**

# Project: JobStalker

## 1. Product Overview

JobStalker is an AI-powered job search companion tailored for experienced professionals and tech industry workers, including both freelancers and full-time job seekers. It enables users to streamline and optimize their job search with features like job application tracking, interview preparation, and personalized analytics.

## 2. Problem Statement

Job seekers often struggle with tracking numerous job applications, tailoring resumes for different roles, and maintaining consistent follow-ups. This disorganized process leads to lost opportunities, stress, and wasted time. JobStalker solves these problems by centralizing and automating the job search journey using AI.

## 3. Target Audience & Personas

**Primary Users:**

- Experienced professionals in tech
- Freelancers seeking stable opportunities
- Mid-career individuals transitioning into tech

**Personas:**

1. **Alex, 32 (Frontend Developer)**
    - Applies to dozens of jobs weekly
    - Needs resume tailoring and tracking tools
2. **Lina, 27 (Freelance UX Designer)**
    - Wants to move to full-time work
    - Needs job organization and AI resume help
3. **David, 38 (Project Manager in Manufacturing)**
    - Transitioning into tech
    - Seeks personalized job suggestions and resume support

## 4. Core Features (MVP)

- **Job Application Tracking**
    - Add/edit/remove job applications
    - Track status: saved, applied, interviewing, rejected, offer
    - Attach notes and documents per job
- **Smart Analytics**
    - Visualize application volume, interview rate, response time
    - Time-based metrics (e.g. avg time to response)
- **Timeline & Kanban View**
    - Calendar for follow-ups, interviews, deadlines
    - Drag-and-drop Kanban board by application status
- **Notes Section**
    - Store private notes per job or globally
- **Authentication**
    - , Google login (via Supabase)

## 5. Technical Specifications

- **Frontend:** React + TypeScript
- **Backend:** Supabase (auth + DB), FastAPI  for the rest…
- **AI:** ChatGPT 4.0 mini (via OpenAI API)
- **Platform:** Web application + Chrome extension

## 6. User Flows (MVP)

1. **Sign Up & Authentication**
2. land to the jobs(main) page
3. **Save/add new Job → Track → Update Status, delete job,** 
4. **View Analytics on Job Search Progress**

## 7. AI Functionality (MVP Scope)

- No resume builder in MVP
- No job crawling or external job matcher yet

## 8. Metrics for Success

- Time to first job saved (user activation)
- Number of job applications tracked per user
- Weekly active users (WAU)
- Feedback ratings on interview prep quality

## 9. Future Scope (Post-MVP)

- AI Resume Builder with upload-based optimization
- Job Matcher with AI-based job crawling
- Portfolio and cover letter builder
- Career consultant marketplace integration
- Multi-user roles (e.g., coaches, recruiters)

---

This PRD is a living document and will evolve as user feedback and feature testing provide more insight. 