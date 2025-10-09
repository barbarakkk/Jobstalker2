# 🚀 JobStalker2 - AI-Powered Job Application Tracker

**JobStalker2** is a comprehensive job application tracking web application built with React, TypeScript, FastAPI, and Supabase. It helps job seekers organize their job search, track applications, manage their professional profile, and build optimized resumes.

## ✨ Features

### 🎯 Core Functionality
- **Job Application Tracking**: Add, edit, and track job applications with status management
- **Professional Profile Management**: Complete profile with skills, experience, education, and resume uploads
- **Analytics Dashboard**: Visual insights into your job search progress
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS and Shadcn/UI

### 🔐 Security & Authentication
- **Supabase Authentication**: Secure user authentication with Google OAuth
- **Row Level Security**: Database-level security ensuring users only access their own data
- **File Upload Security**: Secure file storage with type validation and size limits

### 🧩 Chrome Extension Integration (Beta)
The project includes a Chrome side-panel extension that lets users save LinkedIn jobs in one click. The extension sends the page URL and lightweight fallbacks to the backend; the backend normalizes to the canonical `/jobs/view/{id}` URL, fetches the job HTML server‑side, runs AI extraction, and saves to the database. This avoids brittle client selectors and improves reliability on LinkedIn’s dynamic UI.

Key behaviors:
- Canonical URL derivation from `currentJobId` or `<link rel="canonical">`.
- Server-side fetch with realistic headers before AI extraction.
- Stages supported: Bookmarked, Applying, Applied, Interviewing, Accepted.
- Extension shows inline status logs and handles auth/session errors gracefully.

Developer notes:
- Extension source lives in `extension/` (`sidepanel.html`, `sidepanel.js`, `background.js`, `manifest.json`).
- The backend endpoint is `POST /api/jobs/scrape-linkedin` (FastAPI) with model `LinkedInScrapeRequest`.
- OpenAI calls happen only on the server using `gpt-4o-mini`.

### 📊 Profile Section (✅ FULLY READY)
The profile section is now **100% complete** with:
- **User Profiles**: Basic info, professional summary, profile pictures
- **Skills Management**: Add/remove skills with proficiency levels
- **Work Experience**: Complete work history management
- **Education**: Educational background tracking
- **Resume Management**: Upload, manage, and set default resumes
- **File Uploads**: Profile pictures and resume files
- **Statistics**: Job application tracking stats

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/UI** for component library
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **FastAPI** for high-performance API
- **Python 3.9+** for backend logic
- **Supabase** for database and authentication
- **PostgreSQL** for data storage
- **Supabase Storage** for file uploads
 - **OpenAI (gpt-4o-mini)** for job field extraction

### Development Tools
- **ESLint** for code linting
- **TypeScript** for type safety
- **Hot reload** for development
- **CORS** configured for local development

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Supabase project

### 1. Clone and Install
```bash
git clone <repository-url>
cd Jobstalker2

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt
```

### 2. Environment Setup
Create `.env` files in both frontend and backend directories:

**Backend (.env):**
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
```

**Frontend (.env):**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2b. Extension (Developer Mode)
1. Open Chrome → `chrome://extensions` → enable Developer mode.
2. Click “Load unpacked” and select the `extension/` folder.
3. Ensure the side panel opens on LinkedIn job pages; the background service worker should be active.

### 3. Database Setup
```bash
cd backend
python setup_database.py
```

### 4. Start Development Servers
```bash
# Start backend (from backend directory)
python main.py

# Start frontend (from frontend directory)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📁 Project Structure

```
Jobstalker2/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Auth/        # Authentication components
│   │   │   ├── Dashboard/   # Dashboard and job tracking
│   │   │   ├── Profile/     # Profile management (✅ Complete)
│   │   │   ├── Jobs/        # Job management components
│   │   │   └── ui/          # Reusable UI components
│   │   ├── lib/             # Utilities and API functions
│   │   └── types.ts         # TypeScript type definitions
│   └── package.json
├── backend/                  # FastAPI backend application
│   ├── main.py              # Main API server
│   ├── models.py            # Pydantic models
│   ├── supabase_client.py   # Supabase configuration
│   ├── schema.sql           # Database schema
│   ├── setup_database.py    # Database setup script
│   └── PROFILE_SETUP.md     # Profile section setup guide
├── extension/                # Chrome extension
│   ├── manifest.json
│   ├── sidepanel.html / sidepanel.js
│   └── background.js
└── README.md
```

## 🎯 Current Status

### ✅ Completed Features
- **Authentication System**: Google OAuth via Supabase
- **Landing Page**: Modern, responsive landing page
- **Dashboard**: Job tracking interface with statistics
- **Job Management**: Complete CRUD operations for job applications
- **Profile Section**: **FULLY COMPLETE** with all features implemented
- **Backend API**: Complete REST API with authentication
- **Database Schema**: All tables and security policies
- **File Upload**: Profile pictures and resume uploads
- **Chrome Extension**: Save from LinkedIn job details; canonical URL normalization; server-side fetch + AI extraction

### 🚧 In Progress
- Resume Builder AI integration
- Advanced analytics features
- Email notifications
- Job board integrations

### 📋 Planned Features
- Mobile app version
- Team collaboration features
- Advanced reporting

## 🔧 Development

### Adding New Features
1. Create a PRD using the provided templates
2. Break down into tasks using the task generation system
3. Implement frontend and backend components
4. Add database schema if needed
5. Test thoroughly
6. Update documentation

### Code Style
- Frontend: ESLint + Prettier configuration
- Backend: Black + isort for Python formatting
- TypeScript: Strict mode enabled
- API: RESTful design with proper error handling

### Extension–Backend Data Flow (for developers)
1. Extension collects `url`, `canonical_url` (if available), small fallback fields, and optionally page HTML.
2. Backend computes `effective_url` (prefer canonical, else derive from `currentJobId`).
3. Backend fetches `effective_url` HTML, cleans it, and calls `extract_job_data_with_ai` (model: gpt-4o-mini).
4. If AI extraction fails, backend uses provided fallback fields.
5. Result is saved to the database and surfaced to the dashboard.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Cursor](https://cursor.sh/) AI assistance
- UI components from [Shadcn/UI](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Backend framework [FastAPI](https://fastapi.tiangolo.com/)
- Database and auth by [Supabase](https://supabase.com/)

---

**Profile Section Status**: ✅ **FULLY READY** - All components implemented and ready for production use!

## ✨ The Core Idea

Building complex features with AI can sometimes feel like a black box. This workflow aims to bring structure, clarity, and control to the process by:

1.  **Defining Scope:** Clearly outlining what needs to be built with a Product Requirement Document (PRD).
2.  **Detailed Planning:** Breaking down the PRD into a granular, actionable task list.
3.  **Iterative Implementation:** Guiding the AI to tackle one task at a time, allowing you to review and approve each change.

This structured approach helps ensure the AI stays on track, makes it easier to debug issues, and gives you confidence in the generated code.

## Workflow: From Idea to Implemented Feature 💡➡️💻

Here's the step-by-step process using the `.mdc` files in this repository:

### 1️⃣ Create a Product Requirement Document (PRD)

First, lay out the blueprint for your feature. A PRD clarifies what you're building, for whom, and why.

You can create a lightweight PRD directly within Cursor:

1.  Ensure you have the `create-prd.mdc` file from this repository accessible.
2.  In Cursor's Agent chat, initiate PRD creation:

    ```
    Use @create-prd.mdc
    Here's the feature I want to build: [Describe your feature in detail]
    Reference these files to help you: [Optional: @file1.py @file2.ts]
    ```
    *(Pro Tip: For complex PRDs, using MAX mode in Cursor is highly recommended if your budget allows for more comprehensive generation.)*

    ![Example of initiating PRD creation](https://pbs.twimg.com/media/Go6DDlyX0AAS7JE?format=jpg&name=large)

### 2️⃣ Generate Your Task List from the PRD

With your PRD drafted (e.g., `MyFeature-PRD.md`), the next step is to generate a detailed, step-by-step implementation plan for your AI Developer.

1.  Ensure you have `generate-tasks-from-prd.mdc` accessible.
2.  In Cursor's Agent chat, use the PRD to create tasks:

    ```
    Now take @MyFeature-PRD.md and create tasks using @generate-tasks-from-prd.mdc
    ```
    *(Note: Replace `@MyFeature-PRD.md` with the actual filename of the PRD you generated in step 1.)*

    ![Example of generating tasks from PRD](https://pbs.twimg.com/media/Go6FITbWkAA-RCT?format=jpg&name=medium)

### 3️⃣ Examine Your Task List

You'll now have a well-structured task list, often with tasks and sub-tasks, ready for the AI to start working on. This provides a clear roadmap for implementation.

![Example of a generated task list](https://pbs.twimg.com/media/Go6GNuOWsAEcSDm?format=jpg&name=medium)

### 4️⃣ Instruct the AI to Work Through Tasks (and Mark Completion)

To ensure methodical progress and allow for verification, we'll use `process-task-list.mdc`. This command instructs the AI to focus on one task at a time and wait for your go-ahead before moving to the next.

1.  Create or ensure you have the `process-task-list.mdc` file accessible.
2.  In Cursor's Agent chat, tell the AI to start with the first task (e.g., `1.1`):

    ```
    Please start on task 1.1 and use @process-task-list.mdc
    ```
    *(Important: You only need to reference `@process-task-list.mdc` for the *first* task. The instructions within it guide the AI for subsequent tasks.)*

    The AI will attempt the task and then prompt you to review.

    ![Example of starting on a task with process-task-list.mdc](https://pbs.twimg.com/media/Go6I41KWcAAAlHc?format=jpg&name=medium)

### 5️⃣ Review, Approve, and Progress ✅

As the AI completes each task, you review the changes.
*   If the changes are good, simply reply with "yes" (or a similar affirmative) to instruct the AI to mark the task complete and move to the next one.
*   If changes are needed, provide feedback to the AI to correct the current task before moving on.

You'll see a satisfying list of completed items grow, providing a clear visual of your feature coming to life!

![Example of a progressing task list with completed items](https://pbs.twimg.com/media/Go6KrXZWkAA_UuX?format=jpg&name=medium)

While it's not always perfect, this method has proven to be a very reliable way to build out larger features with AI assistance.

### Video Demonstration 🎥

If you'd like to see this in action, I demonstrated it on [Claire Vo's "How I AI" podcast](https://www.youtube.com/watch?v=fD4ktSkNCw4).

![Demonstration of AI Dev Tasks on How I AI Podcast](https://img.youtube.com/vi/fD4ktSkNCw4/maxresdefault.jpg)

## 🗂️ Files in this Repository

*   **`create-prd.mdc`**: Guides the AI in generating a Product Requirement Document for your feature.
*   **`generate-tasks-from-prd.mdc`**: Takes a PRD markdown file as input and helps the AI break it down into a detailed, step-by-step implementation task list.
*   **`process-task-list.mdc`**: Instructs the AI on how to process the generated task list, tackling one task at a time and waiting for your approval before proceeding. (This file also contains logic for the AI to mark tasks as complete).

## 🌟 Benefits

*   **Structured Development:** Enforces a clear process from idea to code.
*   **Step-by-Step Verification:** Allows you to review and approve AI-generated code at each small step, ensuring quality and control.
*   **Manages Complexity:** Breaks down large features into smaller, digestible tasks for the AI, reducing the chance of it getting lost or generating overly complex, incorrect code.
*   **Improved Reliability:** Offers a more dependable approach to leveraging AI for significant development work compared to single, large prompts.
*   **Clear Progress Tracking:** Provides a visual representation of completed tasks, making it easy to see how much has been done and what's next.

## 🛠️ How to Use

1.  **Clone or Download:** Get these `.mdc` files into your project or a central location where Cursor can access them.
2.  **Follow the Workflow:** Systematically use the `.mdc` files in Cursor's Agent chat as described in the 5-step workflow above.
3.  **Adapt and Iterate:**
    *   Feel free to modify the prompts within the `.mdc` files to better suit your specific needs or coding style.
    *   If the AI struggles with a task, try rephrasing your initial feature description or breaking down tasks even further.

## 💡 Tips for Success

*   **Be Specific:** The more context and clear instructions you provide (both in your initial feature description and any clarifications), the better the AI's output will be.
*   **MAX Mode for PRDs:** As mentioned, using MAX mode in Cursor for PRD creation (`create-prd.mdc`) can yield more thorough and higher-quality results if your budget supports it.
*   **Correct File Tagging:** Always ensure you're accurately tagging the PRD filename (e.g., `@MyFeature-PRD.md`) when generating tasks.
*   **Patience and Iteration:** AI is a powerful tool, but it's not magic. Be prepared to guide, correct, and iterate. This workflow is designed to make that iteration process smoother.

## 🤝 Contributing

Got ideas to improve these `.mdc` files or have new ones that fit this workflow? Contributions are welcome!
Please feel free to:
*   Open an issue to discuss changes or suggest new features.
*   Submit a pull request with your enhancements.

---

Happy AI-assisted developing!
