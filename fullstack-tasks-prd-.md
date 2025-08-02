# JobStalker - Full Stack PRD
## CURSOR: FOLLOW THIS DOCUMENT STRICTLY - NO DEVIATIONS

### PROJECT STATUS
✅ **Frontend Setup:** Vite + React + TypeScript + Tailwind + shadcn/ui  
✅ **Backend Setup:** FastAPI + Python + Supabase + PostgreSQL  
📁 **Working Directories:** `jobstalker/frontend/` & `jobstalker/backend/`  
🎯 **Current Task:** Add New Job Modal Integration

---

## CRITICAL RULES FOR CURSOR

### 🚨 MANDATORY PROTOTYPE CONSULTATION
**BEFORE implementing ANY component, you MUST:**
1. Ask user to describe the prototype/design for that component
2. Wait for detailed description
3. Confirm understanding
4. Only THEN start coding

### 🎯 TASK IMPLEMENTATION PROTOCOL
- **One sub-task at a time:** Do **NOT** start the next sub‑task until you ask the user for permission and they say "yes" or "y"
- **Completion protocol:**  
  1. When you finish a **sub‑task**, immediately mark it as completed by changing `[ ]` to `[x]`.  
  2. If **all** subtasks underneath a parent task are now `[x]`, also mark the **parent task** as completed.
- Stop after each sub‑task and wait for the user's go‑ahead.

### 💻 TECHNICAL REQUIREMENTS
**Frontend:** React + TypeScript + Tailwind + shadcn/ui  
**Backend:** FastAPI + Python + Supabase + PostgreSQL  
**Authentication:** Supabase Google OAuth  
**Development Tools:** Supabase MCP tool for database operations  
**No external libraries** without approval

---

## TECH STACK & ARCHITECTURE

### Frontend Stack
- **Framework:** React 18 + Vite
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** React hooks (useState, useEffect, useContext)
- **HTTP:** Fetch API
- **Auth:** Supabase client-side

### Backend Stack
- **Framework:** FastAPI + Uvicorn
- **Language:** Python 3.12
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase server-side verification
- **ORM:** Supabase Python client
- **API:** RESTful endpoints with JWT

### Database Schema (Supabase)
**Note:** Use Supabase MCP tool for all database operations and schema management

```sql
-- Users table (managed by Supabase Auth)
users (
  id: uuid PRIMARY KEY,
  email: text,
  created_at: timestamp
)

-- Jobs table
jobs (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users(id),
  title: text NOT NULL,
  company: text NOT NULL,
  location: text,
  salary: text,
  job_url: text,
  status: text DEFAULT 'bookmarked',
  excitement_level: integer,
  date_applied: date,
  deadline: date,
  description: text,
  created_at: timestamp DEFAULT now(),
  updated_at: timestamp DEFAULT now()
)
```

**MCP Commands for Schema Setup:**
- Use MCP to create/modify tables
- Use MCP to check current schema state  
- Use MCP to run queries and test data operations

### API Endpoints
```
Authentication (Supabase):
POST /auth/login    → { email, password } → { token }
POST /auth/signup   → { email, password } → { token }

Jobs (All require Authorization: Bearer {token}):
GET    /api/jobs           → Job[]
POST   /api/jobs           → CreateJobData → Job
GET    /api/jobs/{id}      → Job
PUT    /api/jobs/{id}      → UpdateJobData → Job
DELETE /api/jobs/{id}      → success

Analytics:
GET    /api/analytics/stats → { bookmarked: 0, applying: 0, applied: 0, interviewing: 1, accepted: 1 }
```

---

## CURRENT PROGRESS

### ✅ COMPLETED TASKS

#### Frontend Foundation
- [x] **Landing Page Component** (`src/components/LandingPage.tsx`)
  - [x] Hero section with app introduction
  - [x] Features showcase  
  - [x] Clear CTA buttons (Login/Register)
  - [x] Fully responsive design

- [x] **Landing Sub-components** (`src/components/Landing/`)
  - [x] Hero.tsx - main hero section
  - [x] Features.tsx - features showcase
  - [x] CallToAction.tsx - CTA buttons
  - [x] index.ts - component exports

- [x] **Authentication System** (`src/components/Auth/`)
  - [x] Login.tsx - Google OAuth via Supabase
  - [x] Register.tsx - Google OAuth via Supabase  
  - [x] index.ts - component exports
  - [x] Loading and error states
  - [x] Redirect on success
  - [x] Frontend-backend communication established

- [x] **Dashboard Interface** (`src/components/Dashboard/`)
  - [x] Dashboard.tsx - main dashboard with job tracking interface
  - [x] StatsCard.tsx - reusable status cards (Bookmarked, Applying, Applied, Interviewing, Accepted)
  - [x] RecentJobs.tsx - job application table with all columns
  - [x] index.ts - component exports
  - [x] Control bar with selection, view toggles (List/Kanban), "Add New Job" button
  - [x] Status badges with color coding
  - [x] Star rating display for job excitement
  - [x] Responsive design matching prototype
  - [x] Mock data integration ready for API replacement

#### Backend Foundation  
- [x] **FastAPI Setup** (`backend/main.py`)
  - [x] FastAPI application initialization
  - [x] CORS configuration
  - [x] Basic server setup with Uvicorn

- [x] **Database Models** (`backend/models.py`)
  - [x] Job model with all required fields
  - [x] User model integration
  - [x] Pydantic models for API validation

- [x] **Supabase Integration** (`backend/supabase_client.py`)
  - [x] Supabase client configuration
  - [x] Database connection setup
  - [x] Environment variables configuration

---

## 🎯 ACTIVE DEVELOPMENT TASKS

### [ ] PHASE 1: JOB MANAGEMENT CORE

#### [x] Task 1.1: Add New Job Modal (Frontend)
**Priority:** HIGH - User showed exact prototype  
**Files:** `src/components/Jobs/AddJobModal.tsx`

- [x] **Sub-task 1.1.1:** Create AddJobModal component
  - Modal overlay with white popup card
  - "Add New Job" title with X close button
  - Form fields in 2-column layout matching prototype:
    * Job Title (text input, blue border when focused)
    * Company (text input)  
    * Location (text input)
    * Salary (text input)
    * Job URL (text input with "https://" placeholder)
    * Status (dropdown with "Bookmarked" default)
    * Excitement Level (dropdown with "Select rating" placeholder)
    * Date Applied (date picker with "Pick a date" placeholder)
    * Deadline (date picker with "Pick a date" placeholder)  
    * Description (large textarea with "Add a job description..." placeholder)
  - Blue "Add Job" submit button at bottom right
  - Use shadcn/ui Dialog, Input, Select, Textarea, Button, Calendar components

- [x] **Sub-task 1.1.2:** Create reusable JobForm component
  - Extract form logic for reuse in edit scenarios
  - Form validation and error handling
  - TypeScript interfaces for form data

- [x] **Sub-task 1.1.3:** Integrate modal with Dashboard
  - Update Dashboard.tsx to import AddJobModal
  - Add state to control modal open/close  
  - Connect existing "Add New Job" button to open modal
  - Handle form submission and close modal
  - Add loading states during submission

#### [x] Task 1.1.4: Dashboard Design Improvements
**Priority:** HIGH - User requested design improvements
**Files:** `src/components/Dashboard/Dashboard.tsx`, `src/index.css`

- [x] **Sub-task 1.1.4.1:** Implement professional color scheme
  - Blue as main theme color for trustworthiness
  - Minimalistic status colors (teal, yellow, reddish, bluish, green)
  - Professional HSL color tokens in CSS variables
  - Semantic design system with Tailwind CSS

- [x] **Sub-task 1.1.4.2:** Improve table layout and spacing
  - Full-width table layout without max-width constraints
  - Increased padding and spacing for better readability
  - Minimalistic status badges with rounded corners
  - Responsive design with proper overflow handling
  - User-friendly hover effects and interactions

#### [x] Task 1.2: Jobs API Endpoints (Backend)
**Files:** `backend/main.py`, `backend/models.py`

- [x] **Sub-task 1.2.1:** Create Job API endpoints
  - POST /api/jobs - create new job
  - GET /api/jobs - list user's jobs
  - GET /api/jobs/{id} - get specific job
  - PUT /api/jobs/{id} - update job
  - DELETE /api/jobs/{id} - delete job

- [x] **Sub-task 1.2.2:** Add authentication middleware
  - JWT token validation for all job endpoints
  - User context extraction from token
  - Error handling for invalid/expired tokens

- [x] **Sub-task 1.2.3:** Database operations
  - Use Supabase MCP tool to verify jobs table exists
  - CRUD operations for jobs table via MCP  
  - Filter jobs by user_id
  - Input validation and sanitization
  - Test database operations with sample data via MCP

#### [x] Task 1.3: Frontend-Backend Integration
**Files:** `src/lib/api.ts`, `src/lib/types.ts`

- [x] **Sub-task 1.3.1:** Create API layer
  - HTTP client setup with authentication headers
  - Job CRUD API functions
  - Error handling and response parsing

- [x] **Sub-task 1.3.2:** Update Dashboard with real data
  - Replace mock data with API calls
  - Loading states for job fetching
  - Error states and retry logic
  - Real-time stats calculation

- [x] **Sub-task 1.3.3:** Form submission integration
  - Connect AddJobModal to POST /api/jobs
  - Success/error feedback to user
  - Refresh jobs list after successful submission

---

### [ ] PHASE 2: JOB MANAGEMENT FEATURES

#### [x] Task 2.1: Job Table Operations
- [x] Edit job inline or via modal
- [x] Delete job with confirmation
- [x] Bulk operations (select multiple, bulk delete)
- [x] Job status updates via dropdown

#### [x] Task 2.2: Advanced Filtering & Search
- [x] Filter dropdown for company or job position
- [x] Text input for filter values
- [x] Sort by different columns (job title, company)
- [x] Inline star rating updates within table

#### [ ] Task 2.3: Job Details & Notes
- [ ] Expandable job details view
- [ ] Notes section per job (private/global)
- [ ] File attachments (resume, cover letter)
-

---

### [ ] PHASE 3: ANALYTICS & INSIGHTS

#### [ ] Task 3.1: Smart Analytics Dashboard
- [ ] Application volume over time
- [ ] Interview conversion rates  
- [ ] Average response times
- [ ] Success rate by company/role type

#### [ ] Task 3.2: Timeline & Kanban Views
- [ ] Calendar view for follow-ups, interviews
- [ ] Drag-and-drop Kanban board by status
- [ ] Timeline visualization of application journey

---

### [ ] PHASE 4: AI FUNCTIONALITY

#### [ ] Task 4.1: Interview Preparation  
- [ ] ChatGPT 4.0 mini integration
- [ ] Company-specific interview questions
- [ ] Resume feedback and optimization
- [ ] Mock interview scenarios

---

## DATA MODELS

### Job Interface (TypeScript)
```typescript
interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  job_url?: string;
  status: 'bookmarked' | 'applying' | 'applied' | 'interviewing' | 'accepted' | 'rejected';
  excitement_level?: number; // 1-5 stars
  date_applied?: string;
  deadline?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface CreateJobData {
  title: string;
  company: string;
  location?: string;
  salary?: string;
  job_url?: string;
  status?: string;
  excitement_level?: number;
  date_applied?: string;
  deadline?: string;
  description?: string;
}
```

### Python Models (Pydantic)
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class JobCreate(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    salary: Optional[str] = None
    job_url: Optional[str] = None
    status: str = "bookmarked"
    excitement_level: Optional[int] = None
    date_applied: Optional[date] = None
    deadline: Optional[date] = None
    description: Optional[str] = None

class Job(JobCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
```

---

## CODE PATTERNS

### API Call Template (Frontend)
```typescript
export async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('supabase_token');
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
}
```

### FastAPI Endpoint Template (Backend)
```python
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

router = APIRouter()

@router.post("/jobs", response_model=Job)
async def create_job(
    job_data: JobCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_supabase_client)
):
    try:
        result = db.table("jobs").insert({
            **job_data.dict(),
            "user_id": current_user["id"]
        }).execute()
        
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---

## FILE STRUCTURE TARGET

```
jobstalker/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── LandingPage.tsx ✅
│       │   ├── Landing/ ✅
│       │   ├── Auth/ ✅
│       │   ├── Jobs/
│       │   │   ├── AddJobModal.tsx
│       │   │   ├── JobForm.tsx
│       │   │   ├── JobTable.tsx
│       │   │   └── index.ts
│       │   ├── Dashboard/ ✅
│       │   └── Layout/
│       ├── lib/
│       │   ├── api.ts
│       │   ├── auth.ts
│       │   ├── types.ts
│       │   └── constants.ts
│       └── App.tsx
└── backend/
    ├── main.py ✅
    ├── models.py ✅
    ├── supabase_client.py ✅
    ├── auth.py
    ├── routers/
    │   └── jobs.py
    └── requirements.txt
```

---

## RELEVANT FILES

### Frontend Files
- `src/components/LandingPage.tsx` - Main landing page component
- `src/components/Landing/Hero.tsx` - Hero section component  
- `src/components/Landing/Features.tsx` - Features showcase component
- `src/components/Landing/CallToAction.tsx` - CTA buttons component
- `src/components/Auth/Login.tsx` - Google OAuth login component
- `src/components/Auth/Register.tsx` - Google OAuth registration component
- `src/components/Dashboard/Dashboard.tsx` - Main dashboard interface
- `src/components/Dashboard/StatsCard.tsx` - Status summary cards
- `src/components/Dashboard/RecentJobs.tsx` - Job table display

### Backend Files  
- `backend/main.py` - FastAPI application setup
- `backend/models.py` - Pydantic models for API validation
- `backend/supabase_client.py` - Supabase client configuration

---

## SUCCESS CRITERIA
- [x] Users can access landing page
- [x] Users can register/login via Google OAuth
- [x] Dashboard displays job tracking interface
- [x] Users can add new jobs via modal form
- [x] Professional dashboard design with blue theme
- [x] Full-width table layout with minimalistic styling
- [x] Jobs are saved to database via API
- [x] Real-time job statistics display
- [x] Full CRUD operations for jobs
- [x] Protected routes work correctly
- [x] Error states handled gracefully
- [x] Loading states implemented

---

## NEXT ACTION FOR CURSOR
**Ready to start Phase 2: Job Management Features**

All Phase 1 tasks are complete! The core job management functionality is working with real data, authentication, and full CRUD operations.

**NEXT PHASE:** Phase 2 - Job Management Features
- **Task 2.1: Job Table Operations** - Bulk operations, inline editing
- **Task 2.2: Advanced Filtering & Search** - Search and filter functionality  
- **Task 2.3: Job Details & Notes** - Expandable details and notes

**NEXT TASK:** Task 2.1.1 - Edit job inline or via modal
- Inline editing for quick status updates
- Bulk selection and operations
- Enhanced delete confirmation

**REMEMBER:** Complete only Sub-task 2.1.1, then stop and wait for user approval before proceeding to the next sub-task.