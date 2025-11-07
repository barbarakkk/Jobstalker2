# JobStalker2 Database Schema Documentation

## Database: Supabase (PostgreSQL)

---

## 📊 **TABLES OVERVIEW**

### **Core User Tables**

#### 1. **`user_profile`** - Main user profile table
**Purpose:** Stores consolidated user profile information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | References Supabase auth user |
| `full_name` | VARCHAR(255) | NOT NULL | User's full name |
| `job_title` | VARCHAR(255) | NULL | Current job title |
| `location` | VARCHAR(255) | NULL | User location |
| `profile_picture_url` | TEXT | NULL | URL to profile picture |
| `skills` | JSONB | DEFAULT '[]'::jsonb | **⚠️ DEPRECATED** - Use `user_skills` table instead |
| `work_experience` | JSONB | DEFAULT '[]'::jsonb | **⚠️ DEPRECATED** - Use `user_work_experience` table instead |
| `education` | JSONB | DEFAULT '[]'::jsonb | **⚠️ DEPRECATED** - Use `user_education` table instead |
| `resumes` | JSONB | DEFAULT '[]'::jsonb | **⚠️ DEPRECATED** - Use `resumes` table instead |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_user_profile_user_id` on `user_id`
- `idx_user_profile_skills` (GIN) on `skills` - **⚠️ Can be removed if JSONB not used**
- `idx_user_profile_work_experience` (GIN) on `work_experience` - **⚠️ Can be removed**
- `idx_user_profile_education` (GIN) on `education` - **⚠️ Can be removed**
- `idx_user_profile_resumes` (GIN) on `resumes` - **⚠️ Can be removed**

**RLS Policies:** Full CRUD policies (users can only access their own profile)

---

#### 2. **`user_skills`** - Normalized skills table ⭐ **ACTIVE**
**Purpose:** Stores individual skills for users (normalized from JSONB)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | References user |
| `name` | VARCHAR(255) | NOT NULL | Skill name |
| `proficiency` | VARCHAR(50) | NULL | Proficiency level |
| `category` | VARCHAR(100) | DEFAULT 'Technical' | Skill category |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Constraints:**
- `UNIQUE(user_id, name)` - Prevents duplicate skills per user

**Indexes:**
- `idx_user_skills_user_id` on `user_id`
- `idx_user_skills_category` on `category`
- `idx_user_skills_user_category` on `(user_id, category)` - **Recommended for queries**

**RLS Policies:** Full CRUD policies

---

#### 3. **`user_work_experience`** - Normalized work experience table ⭐ **ACTIVE**
**Purpose:** Stores work experience entries for users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | References user |
| `title` | VARCHAR(255) | NOT NULL | Job title |
| `company` | VARCHAR(255) | NOT NULL | Company name |
| `location` | VARCHAR(255) | NULL | Job location |
| `start_date` | DATE | NULL | Start date |
| `end_date` | DATE | NULL | End date |
| `is_current` | BOOLEAN | DEFAULT FALSE | Is current job |
| `description` | TEXT | NULL | Job description |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_user_work_experience_user_id` on `user_id`
- `idx_user_work_experience_user_dates` on `(user_id, start_date DESC)` - **For chronological sorting**
- `idx_user_work_experience_current` on `(user_id, is_current) WHERE is_current = TRUE` - **Partial index for current jobs**

**RLS Policies:** Full CRUD policies

---

#### 4. **`user_education`** - Normalized education table ⭐ **ACTIVE**
**Purpose:** Stores education entries for users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | References user |
| `school` | VARCHAR(255) | NOT NULL | School name |
| `degree` | VARCHAR(100) | NULL | Degree type |
| `field` | VARCHAR(255) | NULL | Field of study |
| `start_date` | DATE | NULL | Start date |
| `end_date` | DATE | NULL | End date |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_user_education_user_id` on `user_id`
- `idx_user_education_user_dates` on `(user_id, start_date DESC)` - **For chronological sorting**

**RLS Policies:** Full CRUD policies

---

### **Job Tracking Tables**

#### 5. **`jobs`** - Job applications tracking
**Purpose:** Tracks job applications and their status

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | References user |
| `job_title` | VARCHAR(255) | NOT NULL | Job title |
| `company` | VARCHAR(255) | NOT NULL | Company name |
| `location` | VARCHAR(255) | NULL | Job location |
| `salary` | VARCHAR(255) | NULL | Salary information |
| `job_url` | TEXT | NULL | Job posting URL |
| `status` | VARCHAR(100) | NOT NULL | Application status (e.g., "applied", "interview", "rejected") |
| `excitement_level` | INTEGER | CHECK (1-5) | User's excitement level (1-5) |
| `date_applied` | DATE | NULL | Date application was submitted |
| `deadline` | DATE | NULL | Application deadline |
| `description` | TEXT | NULL | Job description |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_jobs_user_id` on `user_id`
- `idx_jobs_user_status` on `(user_id, status)` - **For filtering by status**
- `idx_jobs_user_updated` on `(user_id, updated_at DESC)` - **For recent jobs**
- `idx_jobs_status` on `status` - **For status filtering**
- `idx_jobs_date_applied` on `date_applied DESC WHERE date_applied IS NOT NULL` - **Partial index**

**RLS Policies:** Full CRUD policies

---

### **Resume Tables**

#### 6. **`resumes`** - File uploads for resumes
**Purpose:** Stores uploaded resume files

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | References user |
| `filename` | VARCHAR(255) | NOT NULL | Original filename |
| `file_url` | TEXT | NOT NULL | Storage URL |
| `file_size` | INTEGER | NOT NULL | File size in bytes |
| `is_default` | BOOLEAN | DEFAULT FALSE | Is default resume |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_resumes_user_id` on `user_id`
- **⚠️ MISSING:** Index on `is_default` for finding default resume

**RLS Policies:** Full CRUD policies

---

#### 7. **`resume_builder_data`** - Structured resume data
**Purpose:** Stores structured resume data from the resume builder

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | References user |
| `template_id` | VARCHAR(100) | NOT NULL | Template identifier |
| `title` | VARCHAR(255) | DEFAULT 'My Resume' | Resume title |
| `resume_data` | JSONB | NOT NULL | Structured resume data |
| `is_current` | BOOLEAN | DEFAULT FALSE | Is current resume |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_resume_builder_data_user_id` on `user_id`
- `idx_resume_builder_data_template_id` on `template_id`
- `idx_resume_builder_data_resume_data` (GIN) on `resume_data` - **For JSONB queries**
- `idx_resume_builder_data_user_current` on `(user_id, is_current) WHERE is_current = TRUE` - **Partial index**

**RLS Policies:** Full CRUD policies

---

### **AI Resume Builder Tables**

#### 8. **`templates`** - Resume templates
**Purpose:** Stores available resume templates

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT extensions.uuid_generate_v4() | Unique identifier |
| `name` | TEXT | UNIQUE, NOT NULL | Template name |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-friendly slug |
| `schema` | JSONB | NOT NULL | Template schema definition |
| `preview_url` | TEXT | NULL | Preview image URL |
| `is_active` | BOOLEAN | DEFAULT TRUE | Is template active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- **⚠️ MISSING:** Index on `is_active` for filtering active templates
- **⚠️ MISSING:** Index on `slug` for lookups

**RLS Policies:** Read-only for authenticated users (SELECT only)

---

#### 9. **`wizard_sessions`** - AI resume wizard sessions
**Purpose:** Tracks AI-powered resume building wizard sessions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT extensions.uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | References user |
| `template_id` | UUID | NOT NULL, FK → templates(id) ON DELETE RESTRICT | References template |
| `draft_json` | JSONB | DEFAULT '{}'::jsonb | Draft resume data |
| `progress` | JSONB | DEFAULT '{}'::jsonb | Wizard progress state |
| `status` | TEXT | NOT NULL, CHECK IN ('active','completed','abandoned'), DEFAULT 'active' | Session status |
| `last_step` | INTEGER | DEFAULT 0 | Last completed step |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_wizard_sessions_user_status` on `(user_id, status)`
- `idx_wizard_sessions_user_active` on `(user_id, status) WHERE status = 'active'` - **Partial index**
- `idx_wizard_sessions_user_updated` on `(user_id, updated_at DESC)`

**RLS Policies:** Full CRUD policies

---

#### 10. **`generated_resumes`** - Generated resumes
**Purpose:** Stores generated resume metadata

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT extensions.uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | References user |
| `template_id` | UUID | NOT NULL, FK → templates(id) ON DELETE RESTRICT | References template |
| `title` | TEXT | DEFAULT 'My Resume' | Resume title |
| `current_version` | INTEGER | NULL | Current version number |
| `share_token` | TEXT | UNIQUE | Token for public sharing |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_generated_resumes_user_updated` on `(user_id, updated_at DESC)`
- `idx_generated_resumes_share_token` on `share_token WHERE share_token IS NOT NULL` - **Partial index**

**RLS Policies:** Full CRUD policies

---

#### 11. **`generated_resume_versions`** - Resume version history
**Purpose:** Stores version history for generated resumes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT extensions.uuid_generate_v4() | Unique identifier |
| `generated_resume_id` | UUID | NOT NULL, FK → generated_resumes(id) ON DELETE CASCADE | References generated resume |
| `version_number` | INTEGER | NOT NULL | Version number |
| `content_json` | JSONB | NOT NULL | Resume content for this version |
| `render_artifact_url` | TEXT | NULL | Rendered PDF/image URL |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Constraints:**
- `UNIQUE(generated_resume_id, version_number)` - One version per number per resume

**Indexes:**
- `idx_generated_resume_versions_resume_id` on `generated_resume_id`
- `idx_generated_resume_versions_resume_version` on `(generated_resume_id, version_number DESC)`

**RLS Policies:** Full CRUD policies (via join check on generated_resumes)

---

#### 12. **`ai_events`** - AI API call tracking
**Purpose:** Tracks AI API calls for analytics and debugging

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT extensions.uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | References user |
| `wizard_session_id` | UUID | NULL, FK → wizard_sessions(id) ON DELETE SET NULL | References wizard session |
| `provider` | TEXT | NOT NULL | AI provider (e.g., "openai", "anthropic") |
| `model` | TEXT | NOT NULL | Model name |
| `input_tokens` | INTEGER | NULL | Input token count |
| `output_tokens` | INTEGER | NULL | Output token count |
| `latency_ms` | INTEGER | NULL | Request latency in milliseconds |
| `status` | TEXT | NOT NULL, CHECK IN ('success','error') | Request status |
| `error` | TEXT | NULL | Error message if failed |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_ai_events_user_created` on `(user_id, created_at DESC)`
- `idx_ai_events_status` on `status`
- `idx_ai_events_provider_model` on `(provider, model)`

**RLS Policies:** SELECT and INSERT only (users can't update/delete)

---

## 🔗 **RELATIONSHIPS**

```
auth.users (Supabase Auth)
  ├── user_profile (1:1)
  ├── user_skills (1:many)
  ├── user_work_experience (1:many)
  ├── user_education (1:many)
  ├── jobs (1:many)
  ├── resumes (1:many)
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

## ⚠️ **ISSUES & OPTIMIZATION OPPORTUNITIES**

### **1. Data Duplication**
- **Problem:** `user_profile` has JSONB fields (`skills`, `work_experience`, `education`, `resumes`) that duplicate normalized tables
- **Impact:** Data inconsistency, storage waste, query complexity
- **Recommendation:** 
  - ✅ **Keep normalized tables** (`user_skills`, `user_work_experience`, `user_education`)
  - ❌ **Remove JSONB fields** from `user_profile` (or migrate data first)
  - ❌ **Remove GIN indexes** on deprecated JSONB fields

### **2. Missing Indexes**
- `resumes.is_default` - Needed for finding default resume
- `templates.is_active` - Needed for filtering active templates
- `templates.slug` - Needed for template lookups by slug

### **3. Unused/Redundant Tables**
- **`resumes` table vs `user_profile.resumes` JSONB** - Decide which to use
- Check if `resume_builder_data` and `generated_resumes` serve different purposes or can be merged

### **4. Index Optimization**
- Consider composite indexes for common query patterns:
  - `jobs(user_id, status, updated_at DESC)` - For dashboard queries
  - `user_work_experience(user_id, is_current, start_date DESC)` - For resume generation

### **5. Data Types**
- `jobs.status` is VARCHAR(100) - Consider ENUM or CHECK constraint for valid values
- `user_skills.proficiency` is VARCHAR(50) - Consider ENUM for consistency

---

## 📈 **PERFORMANCE RECOMMENDATIONS**

### **High Priority**
1. **Remove deprecated JSONB fields** from `user_profile` after data migration
2. **Add missing indexes** on `resumes.is_default`, `templates.is_active`, `templates.slug`
3. **Add composite indexes** for common query patterns

### **Medium Priority**
4. **Consider partitioning** `jobs` table by `created_at` if it grows large
5. **Add materialized views** for dashboard statistics if needed
6. **Consider archiving** old `ai_events` data to reduce table size

### **Low Priority**
7. **Add constraints** for status fields (ENUM or CHECK)
8. **Consider full-text search** indexes if searching job descriptions
9. **Add database-level validation** for email formats, URLs, etc.

---

## 🗄️ **DATABASE FUNCTIONS**

### **Helper Functions**
- `update_updated_at_column()` - Trigger function to auto-update `updated_at` timestamps
- `add_skill_to_profile()` - Helper to add skills to user_profile JSONB (deprecated)
- `add_work_experience_to_profile()` - Helper to add work experience to user_profile JSONB (deprecated)
- `get_public_generated_resume(share_token)` - Public RPC for share links

---

## 🔒 **SECURITY**

- **Row Level Security (RLS)** enabled on all tables
- **Policies:** Users can only access their own data
- **Exceptions:** 
  - `templates` - Read-only for all authenticated users
  - `get_public_generated_resume()` - Public function for share links

---

## 📝 **MIGRATION NOTES**

- Use `backend/schema.sql` for initial setup
- Use `supabase/migrations/` for incremental changes
- Run `backend/create_missing_tables.sql` if `user_skills`, `user_work_experience`, `user_education` are missing

---

## 📊 **TABLE STATISTICS** (Recommended to Monitor)

- Total tables: **12**
- Tables with RLS: **12**
- Tables with JSONB: **6** (consider normalizing)
- Total indexes: **~30+**
- Foreign key relationships: **10+**

---

**Last Updated:** 2025-01-07
**Database:** Supabase (PostgreSQL)
**Schema Version:** 2.0 (with normalized tables)

