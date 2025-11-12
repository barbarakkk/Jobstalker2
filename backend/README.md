# JobStalker Backend System

## Overview

The JobStalker backend is a FastAPI-based REST API that powers the JobStalker job tracking application. It provides authentication, job management, profile management, AI-powered resume generation, and LinkedIn job scraping capabilities.

## Architecture

### Technology Stack

- **Framework**: FastAPI (Python 3.11+)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT tokens)
- **AI Services**: OpenAI GPT-4o-mini for resume generation and job data extraction
- **Storage**: Supabase Storage for file uploads
- **Deployment**: Railway (Docker-based)

### Key Components

1. **Main Application** (`main.py`)
   - FastAPI app initialization
   - CORS middleware configuration
   - Rate limiting middleware
   - Security headers middleware
   - Authentication dependency injection
   - Core API endpoints

2. **Data Models** (`models.py`)
   - Pydantic models for request/response validation
   - Job, Profile, Skills, Work Experience, Education models
   - Resume builder data models

3. **Routes**
   - **AI Resume Routes** (`routes/ai_resume.py`): AI-powered resume generation
   - **Wizard Routes** (`routes/wizard.py`): Resume wizard session management

4. **Supabase Client** (`supabase_client.py`)
   - Centralized Supabase client initialization
   - Environment variable management

## API Endpoints

### Authentication

- `GET /api/auth/verify` - Verify authentication token
- `GET /ping` - Health check endpoint
- `GET /health` - Comprehensive health check with database connectivity

### Jobs Management

- `POST /api/jobs` - Create a new job
- `GET /api/jobs` - Get all jobs for authenticated user
- `GET /api/jobs/{job_id}` - Get specific job by ID
- `PUT /api/jobs/{job_id}` - Update job
- `DELETE /api/jobs/{job_id}` - Delete job

### Job Ingestion (LinkedIn Scraping)

- `POST /api/jobs/scrape-linkedin` - Scrape LinkedIn job posting using AI
- `POST /api/jobs/ingest-html` - Ingest job from HTML content
- `POST /api/jobs/save-job` - Save job directly without scraping

### Profile Management

- `GET /api/profile` - Get user profile with normalized data
- `POST /api/profile/update` - Update user profile
- `POST /api/profile/picture` - Upload profile picture
- `GET /api/profile/stats` - Get profile statistics
- `DELETE /api/profile` - Delete user profile and all associated data

### Skills Management

- `GET /api/skills` - Get all user skills
- `POST /api/skills/add` - Add new skill
- `PUT /api/skills/{skill_id}` - Update skill
- `DELETE /api/skills/{skill_id}` - Delete skill
- `GET /api/skills/suggestions` - Get AI skill suggestions

### Work Experience Management

- `GET /api/experience` - Get all work experience entries
- `POST /api/experience/add` - Add work experience
- `PUT /api/experience/{experience_id}` - Update work experience
- `DELETE /api/experience/{experience_id}` - Delete work experience

### Education Management

- `GET /api/education` - Get all education entries
- `POST /api/education/add` - Add education entry
- `PUT /api/education/{education_id}` - Update education entry
- `DELETE /api/education/{education_id}` - Delete education entry

### AI Resume Generation

- `POST /api/ai/generate-resume` - Generate professional resume using AI
- `GET /api/ai/health` - Health check for AI services

### Resume Builder

- `POST /api/resume-builder/save` - Save generated resume
- `GET /api/resume-builder/list` - List all saved resumes
- `GET /api/resume-builder/{resume_id}` - Get specific resume
- `PUT /api/resume-builder/{resume_id}` - Update resume
- `DELETE /api/resume-builder/{resume_id}` - Delete resume

### Resume Wizard

- `GET /api/templates` - List all available resume templates
- `GET /api/templates/{template_id}` - Get template details
- `POST /api/wizard/sessions` - Create wizard session
- `PATCH /api/wizard/sessions/{session_id}` - Update wizard session
- `POST /api/wizard/sessions/{session_id}/complete` - Complete wizard session
- `POST /api/ai/profile-summary` - Generate profile summary using AI
- `POST /api/exports/{resume_id}/pdf` - Export resume as PDF

### Generated Resumes

- `GET /api/generated-resumes/{resume_id}` - Get generated resume
- `POST /api/generated-resumes/{resume_id}/versions` - Create new version

## Authentication

All protected endpoints require Bearer token authentication:

```
Authorization: Bearer <supabase_jwt_token>
```

The `get_current_user` dependency extracts and validates the token from the Authorization header, returning the user_id for use in queries.

## Rate Limiting

The backend implements rate limiting to prevent abuse:

- **Global (per IP)**: 100 requests per minute
- **Per User (default)**: 30 requests per minute
- **Per User (AI endpoints)**: 5 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `Retry-After`: Seconds until rate limit resets (on 429)

## Security Features

### CORS Configuration

- Allows requests from:
  - `http://localhost:3000`
  - `http://localhost:5173`
  - `http://localhost:5174`
  - `https://jobstalker.vercel.app`
  - Any `*.vercel.app` subdomain

### Security Headers

All responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Input Validation

- All endpoints use Pydantic models for request validation
- User-friendly error messages for validation failures
- Automatic sanitization of user inputs

## AI-Powered Features

### Job Data Extraction

The backend uses OpenAI GPT-4o-mini to extract structured job data from LinkedIn HTML:

1. **HTML Parsing**: Uses BeautifulSoup to clean and parse HTML
2. **Pre-extraction**: Basic regex/selector-based extraction for common fields
3. **AI Enhancement**: GPT-4o-mini analyzes content to extract:
   - Job title, company, location, salary
   - Job type, experience level, remote work availability
   - Benefits, requirements, skills

### Resume Generation

AI-powered resume generation includes:

1. **Professional Summary**: Generates compelling 3-4 sentence summaries
2. **Work Experience Enhancement**: Enhances job descriptions with:
   - Action verbs and quantified achievements
   - Relevant skills and responsibilities
   - Impact-focused language

### Profile Summary Generation

Generates concise 2-3 sentence professional summaries based on:
- Full name and headline
- Years of experience
- Skills and achievements
- Custom prompt hints

## Database Schema

The backend interacts with Supabase tables:

### Core Tables

- `jobs` - Job postings with status tracking
- `user_profile` - User profile information
- `user_skills` - Normalized skills table
- `user_work_experience` - Normalized work experience table
- `user_education` - Normalized education table

### Resume Tables

- `resume_builder_data` - Saved resume data (JSONB)
- `templates` - Resume templates with schemas
- `wizard_sessions` - Resume wizard session state
- `generated_resumes` - Generated resume metadata
- `generated_resume_versions` - Resume version history
- `ai_events` - AI usage tracking

## File Storage

Files are stored in Supabase Storage bucket `jobstalker-files`:

- Profile pictures: `{user_id}/profile-pictures/{filename}`
- Generated resumes: `generated-resumes/{user_id}/{resume_id}/v{version}/resume.pdf`

## Environment Variables

Required environment variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# OpenAI Configuration
OPENAI_API_KEY=<openai_api_key>
```

Optional environment variables:

```bash
# API Base URL (for CORS)
VITE_API_BASE_URL=http://localhost:8000
```

## Development Setup

### Prerequisites

- Python 3.11+
- pip or uv package manager
- Supabase account and project
- OpenAI API key

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
# or
uv pip install -r requirements.txt
```

2. Create `backend/.env` file:
```bash
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
OPENAI_API_KEY=<openai_api_key>
```

3. Run the development server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Testing Endpoints

Health check:
```bash
curl http://localhost:8000/ping
```

Test authentication:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/auth/verify
```

## Deployment

### Railway Deployment

The backend is configured for Railway deployment:

1. **Dockerfile**: Multi-stage build for production
2. **Procfile**: Defines the web process
3. **railway.json**: Railway-specific configuration
4. **runtime.txt**: Python version specification

### Environment Variables in Production

Set these in Railway dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

### Health Monitoring

- `GET /health` - Comprehensive health check
- `GET /ping` - Simple ping endpoint
- `GET /api/debug/openai` - OpenAI API key status check

## Error Handling

### Validation Errors

- Returns HTTP 422 with user-friendly messages
- Technical details logged to console
- First error message shown to user

### Authentication Errors

- HTTP 401 for invalid/expired tokens
- Clear error messages for token issues
- Automatic token cleanup on expiry

### Rate Limiting

- HTTP 429 when rate limit exceeded
- Includes `Retry-After` header
- Per-user and per-IP tracking

## Logging

Structured logging includes:
- HTTP request logs with duration
- Authentication events
- AI service calls
- Error tracking

Log format:
```json
{
  "event": "http_request",
  "path": "/api/jobs",
  "method": "POST",
  "status": 200,
  "duration_ms": 45,
  "client": "127.0.0.1"
}
```

## Performance Considerations

1. **Background Tasks**: LinkedIn scraping uses background tasks to avoid blocking
2. **Rate Limiting**: Prevents API abuse and ensures fair usage
3. **Caching**: Supabase client connection pooling
4. **AI Optimization**: Uses GPT-4o-mini for cost-effective AI operations

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Advanced job matching algorithms
- [ ] Email notifications for job status changes
- [ ] Integration with more job boards
- [ ] Advanced analytics and reporting
- [ ] Resume ATS optimization scoring

