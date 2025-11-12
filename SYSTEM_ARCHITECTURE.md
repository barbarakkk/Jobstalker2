# JobStalker2 System Architecture Documentation

## Overview

JobStalker2 is a job tracking and resume building platform with:
- **Backend**: FastAPI (Python) on Supabase (PostgreSQL)
- **Frontend**: React + TypeScript
- **Extension**: Chrome Extension for LinkedIn job saving
- **Storage**: Supabase Storage for files
- **AI**: OpenAI GPT-4o-mini for job extraction and resume generation

---

## Database Architecture

### Core Tables

#### 1. `user_profile` (Main User Profile)
**Purpose**: Stores basic user profile information

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `auth.users(id)` |
| `full_name` | VARCHAR(255) | User's full name |
| `job_title` | VARCHAR(255) | Current job title |
| `location` | VARCHAR(255) | User location |
| `profile_picture_url` | TEXT | Profile picture URL |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Note**: JSONB fields (`skills`, `work_experience`, `education`) are deprecated. Use normalized tables instead.

---

#### 2. `user_skills` (Normalized Skills)
**Purpose**: Stores individual skills for users

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `auth.users(id)` |
| `name` | VARCHAR(255) | Skill name |
| `proficiency` | VARCHAR(50) | Proficiency level |
| `category` | VARCHAR(100) | Skill category (default: "Technical") |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Constraints**: `UNIQUE(user_id, name)` - prevents duplicate skills per user

---

#### 3. `user_work_experience` (Normalized Work Experience)
**Purpose**: Stores work experience entries

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `auth.users(id)` |
| `title` | VARCHAR(255) | Job title |
| `company` | VARCHAR(255) | Company name |
| `location` | VARCHAR(255) | Job location |
| `start_date` | DATE | Start date |
| `end_date` | DATE | End date (NULL if current) |
| `is_current` | BOOLEAN | Is current job |
| `description` | TEXT | Job description |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

#### 4. `user_education` (Normalized Education)
**Purpose**: Stores education entries

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `auth.users(id)` |
| `school` | VARCHAR(255) | School name |
| `degree` | VARCHAR(100) | Degree type |
| `field` | VARCHAR(255) | Field of study |
| `start_date` | DATE | Start date |
| `end_date` | DATE | End date |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

#### 5. `jobs` (Job Applications)
**Purpose**: Tracks job applications and their status

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `auth.users(id)` |
| `job_title` | VARCHAR(255) | Job title |
| `company` | VARCHAR(255) | Company name |
| `location` | VARCHAR(255) | Job location |
| `salary` | VARCHAR(255) | Salary information |
| `job_url` | TEXT | Job posting URL |
| `status` | VARCHAR(100) | Status (Bookmarked, Applied, Interviewing, Accepted, Rejected) |
| `excitement_level` | INTEGER | User's excitement (1-5) |
| `date_applied` | DATE | Date application submitted |
| `deadline` | DATE | Application deadline |
| `description` | TEXT | Job description |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Status Values**: `Bookmarked`, `Applied`, `Interviewing`, `Accepted`, `Rejected`

---

#### 6. `resume_builder_data` (Structured Resume Data)
**Purpose**: Stores structured resume data from the Resume Builder

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `auth.users(id)` |
| `template_id` | VARCHAR(100) | Template identifier |
| `title` | VARCHAR(255) | Resume title |
| `resume_data` | JSONB | Structured resume data |
| `is_current` | BOOLEAN | Is current resume |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

#### 7. `templates` (Resume Templates)
**Purpose**: Stores available resume templates

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Template name |
| `slug` | TEXT | URL-friendly slug |
| `schema` | JSONB | Template schema definition |
| `preview_url` | TEXT | Preview image URL |
| `is_active` | BOOLEAN | Is template active |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

#### 8. `wizard_sessions` (AI Resume Wizard Sessions)
**Purpose**: Tracks AI-powered resume building wizard sessions

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `auth.users(id)` |
| `template_id` | UUID | FK → `templates(id)` |
| `draft_json` | JSONB | Draft resume data |
| `progress` | JSONB | Wizard progress state |
| `status` | TEXT | Session status (active, completed, abandoned) |
| `last_step` | INTEGER | Last completed step |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

#### 9. `generated_resumes` (Generated Resumes)
**Purpose**: Stores generated resume metadata

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `auth.users(id)` |
| `template_id` | UUID | FK → `templates(id)` |
| `title` | TEXT | Resume title |
| `current_version` | INTEGER | Current version number |
| `share_token` | TEXT | Token for public sharing |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

#### 10. `generated_resume_versions` (Resume Version History)
**Purpose**: Stores version history for generated resumes

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `generated_resume_id` | UUID | FK → `generated_resumes(id)` |
| `version_number` | INTEGER | Version number |
| `content_json` | JSONB | Resume content for this version |
| `render_artifact_url` | TEXT | Rendered PDF/image URL |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Constraints**: `UNIQUE(generated_resume_id, version_number)`

---

#### 11. `ai_events` (AI API Call Tracking)
**Purpose**: Tracks AI API calls for analytics and debugging

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `auth.users(id)` |
| `wizard_session_id` | UUID | FK → `wizard_sessions(id)` |
| `provider` | TEXT | AI provider (e.g., "openai") |
| `model` | TEXT | Model name |
| `input_tokens` | INTEGER | Input token count |
| `output_tokens` | INTEGER | Output token count |
| `latency_ms` | INTEGER | Request latency in milliseconds |
| `status` | TEXT | Request status (success, error) |
| `error` | TEXT | Error message if failed |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

---

### Database Relationships

```
auth.users (Supabase Auth)
  ├── user_profile (1:1)
  ├── user_skills (1:many)
  ├── user_work_experience (1:many)
  ├── user_education (1:many)
  ├── jobs (1:many)
  ├── resume_builder_data (1:many)
  ├── wizard_sessions (1:many)
  ├── generated_resumes (1:many)
  └── ai_events (1:many)

templates (1:many)
  ├── wizard_sessions
  └── generated_resumes

generated_resumes (1:many)
  └── generated_resume_versions

wizard_sessions (1:many)
  └── ai_events
```

---

## API Architecture

### Authentication

**Method**: Bearer Token (Supabase JWT)

**Flow**:
1. User authenticates via Supabase Auth (handled by frontend)
2. Frontend receives JWT token
3. Frontend sends token in `Authorization: Bearer <token>` header
4. Backend verifies token with `supabase.auth.get_user(token)`
5. Backend extracts `user_id` from verified token

**Dependency**: `get_current_user()` function used in all protected endpoints

---

### API Endpoints

#### Profile Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `GET` | `/api/profile` | Get user profile with normalized data | Yes |
| `POST` | `/api/profile/update` | Update user profile | Yes |
| `POST` | `/api/profile/picture` | Upload profile picture | Yes |
| `GET` | `/api/profile/stats` | Get profile statistics | Yes |
| `DELETE` | `/api/profile` | Delete user profile and all data | Yes |

---

#### Skills Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `GET` | `/api/skills` | Get user skills | Yes |
| `POST` | `/api/skills/add` | Add skill | Yes |
| `PUT` | `/api/skills/{skill_id}` | Update skill | Yes |
| `DELETE` | `/api/skills/{skill_id}` | Delete skill | Yes |
| `GET` | `/api/skills/suggestions` | Get skill suggestions | No |

---

#### Work Experience Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `GET` | `/api/experience` | Get work experience | Yes |
| `POST` | `/api/experience/add` | Add work experience | Yes |
| `PUT` | `/api/experience/{experience_id}` | Update work experience | Yes |
| `DELETE` | `/api/experience/{experience_id}` | Delete work experience | Yes |

---

#### Education Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `GET` | `/api/education` | Get education | Yes |
| `POST` | `/api/education/add` | Add education | Yes |
| `PUT` | `/api/education/{education_id}` | Update education | Yes |
| `DELETE` | `/api/education/{education_id}` | Delete education | Yes |

---

#### Job Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `GET` | `/api/jobs` | Get all jobs for user | Yes |
| `GET` | `/api/jobs/{job_id}` | Get specific job | Yes |
| `POST` | `/api/jobs` | Create job | Yes |
| `PUT` | `/api/jobs/{job_id}` | Update job | Yes |
| `DELETE` | `/api/jobs/{job_id}` | Delete job | Yes |
| `POST` | `/api/jobs/scrape-linkedin` | Scrape LinkedIn job URL | Yes |
| `POST` | `/api/jobs/ingest-html` | Ingest job from HTML | Yes |
| `POST` | `/api/jobs/save-job` | Save job directly (extension) | Yes |

---

#### AI Resume Builder Endpoints

**Route**: `/api/ai/resume/*` (from `routes/ai_resume.py`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `POST` | `/api/ai/resume/generate` | Generate resume with AI | Yes |
| `GET` | `/api/ai/resume/list` | List user's resumes | Yes |
| `GET` | `/api/ai/resume/{resume_id}` | Get specific resume | Yes |
| `POST` | `/api/ai/resume/save` | Save resume | Yes |
| `PUT` | `/api/ai/resume/{resume_id}` | Update resume | Yes |
| `DELETE` | `/api/ai/resume/{resume_id}` | Delete resume | Yes |

---

#### Wizard Endpoints

**Route**: `/api/wizard/*` (from `routes/wizard.py`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `POST` | `/api/wizard/session` | Create wizard session | Yes |
| `GET` | `/api/wizard/session/{session_id}` | Get wizard session | Yes |
| `PATCH` | `/api/wizard/session/{session_id}` | Update wizard session | Yes |
| `POST` | `/api/wizard/session/{session_id}/summary` | Generate profile summary with AI | Yes |
| `POST` | `/api/wizard/session/{session_id}/complete` | Complete wizard session | Yes |

---

#### Utility Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `GET` | `/ping` | Health check | No |
| `GET` | `/health` | Comprehensive health check | No |
| `GET` | `/api/auth/verify` | Verify token | No |
| `GET` | `/api/debug/openai` | Debug OpenAI API key | No |

---

## Data Flow

### Job Saving Flow (Extension → Backend)

```
1. User clicks "Save Job" in Chrome Extension
   ↓
2. Extension collects:
   - Current URL
   - HTML content
   - Fallback data (title, company, location)
   ↓
3. Extension sends POST to /api/jobs/scrape-linkedin
   ↓
4. Backend:
   a. Checks for duplicate (by job_url)
   b. Creates placeholder job with fallback data
   c. Returns job_id immediately
   d. Starts background task for enrichment
   ↓
5. Background Task:
   a. Fetches HTML from LinkedIn (or uses provided HTML)
   b. Parses HTML with BeautifulSoup
   c. Extracts job data with OpenAI GPT-4o-mini
   d. Updates job record with extracted data
   ↓
6. Frontend polls/refreshes to see updated job
```

### Resume Generation Flow

```
1. User starts Resume Builder Wizard
   ↓
2. Frontend creates wizard session via POST /api/wizard/session
   ↓
3. User fills wizard steps:
   - Personal Info
   - Work Experience
   - Education
   - Skills
   ↓
4. Each step updates session via PATCH /api/wizard/session/{id}
   ↓
5. User requests AI summary generation:
   POST /api/wizard/session/{id}/summary
   ↓
6. Backend:
   a. Collects draft data from session
   b. Sends to OpenAI GPT-4o-mini
   c. Generates professional summary
   d. Updates session draft_json
   ↓
7. User completes wizard:
   POST /api/wizard/session/{id}/complete
   ↓
8. Backend:
   a. Converts draft_json to resume_data format
   b. Saves to resume_builder_data table
   c. Marks session as "completed"
   ↓
9. User can edit resume in Resume Builder
   ↓
10. User saves final resume:
    POST /api/ai/resume/save
```

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies:
- Users can only SELECT/INSERT/UPDATE/DELETE their own data
- Exception: `templates` table is read-only for all authenticated users

### Rate Limiting

- Global: 100 requests/minute per IP
- User: 30 requests/minute per user
- AI Endpoints: 5 requests/minute per user

### CORS

- Allowed origins: localhost (3000, 5173, 5174), vercel.app domains
- Credentials: Enabled
- Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD

---

## File Storage

**Provider**: Supabase Storage

**Buckets**:
- `jobstalker-files`: General file storage
  - Profile pictures: `{user_id}/profile-pictures/{filename}`
  - Generated resumes: `generated-resumes/{user_id}/{resume_id}/v{version}/resume.pdf`

**Upload Flow**:
1. Frontend sends file to backend endpoint
2. Backend validates file (type, size)
3. Backend generates unique filename (UUID)
4. Backend uploads to Supabase Storage
5. Backend returns public URL
6. Backend saves URL to database

---

## AI Integration

### OpenAI GPT-4o-mini Usage

**1. Job Data Extraction**
- Input: HTML content from LinkedIn job posting
- Output: Structured JSON with job_title, company, location, salary, description, etc.
- Model: `gpt-4o-mini`
- Temperature: 0.1 (for consistency)

**2. Resume Summary Generation**
- Input: User's work experience, education, skills
- Output: Professional summary text
- Model: `gpt-4o-mini`
- Temperature: 0.7 (for creativity)

**3. Resume Content Enhancement**
- Input: User's resume data, target role
- Output: Enhanced resume content
- Model: `gpt-4o-mini`
- Temperature: 0.5 (balanced)

### AI Event Tracking

All AI API calls are logged to `ai_events` table for:
- Analytics
- Cost tracking
- Debugging
- Performance monitoring

---

## Extension Integration

**Chrome Extension** communicates with backend via:
- **Authentication**: Uses same Supabase JWT token
- **Endpoints**: 
  - `/api/jobs/scrape-linkedin` - Main job saving endpoint
  - `/api/auth/verify` - Token verification

**Data Flow**:
1. Extension injects content script into LinkedIn page
2. Extracts job data from DOM
3. Sends HTML + metadata to backend
4. Backend processes and saves job
5. Extension shows success/error message

---

## Environment Variables

**Backend Required**:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key
- `DATABASE_URL` - Database connection string (optional)
- `ENVIRONMENT` - `production` or `development`

---

## Indexes & Performance

**Key Indexes**:
- `user_id` on all user-related tables
- `(user_id, status)` on jobs table
- `(user_id, is_current)` on work_experience
- GIN indexes on JSONB fields for efficient querying
- Partial indexes for common queries (e.g., active sessions)

---

## Important Notes

1. **Deprecated JSONB Fields**: The `user_profile` table has JSONB fields (`skills`, `work_experience`, `education`) that are deprecated. Use normalized tables instead.

2. **Background Tasks**: Job enrichment happens in background tasks to avoid blocking the API response.

3. **Error Handling**: All endpoints have try-catch blocks with user-friendly error messages.

4. **Validation**: Pydantic models validate all input data before processing.

5. **Resume Storage**: The system uses AI-generated resumes stored as structured data in `resume_builder_data`, `generated_resumes`, and `generated_resume_versions` tables. The old `resumes` table for file uploads has been removed.

---

**Last Updated**: 2025-01-07
**Database**: Supabase (PostgreSQL)
**Schema Version**: 2.0 (with normalized tables, resumes table removed)

