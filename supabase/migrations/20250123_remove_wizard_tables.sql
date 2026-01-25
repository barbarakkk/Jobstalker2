-- Remove wizard functionality - drop wizard-related tables
-- This migration removes: wizard_sessions, generated_resumes, generated_resume_versions, ai_events

BEGIN;

-- Drop foreign key constraints first
ALTER TABLE IF EXISTS public.generated_resume_versions 
  DROP CONSTRAINT IF EXISTS generated_resume_versions_generated_resume_id_fkey;

ALTER TABLE IF EXISTS public.ai_events 
  DROP CONSTRAINT IF EXISTS ai_events_wizard_session_id_fkey;

ALTER TABLE IF EXISTS public.wizard_sessions 
  DROP CONSTRAINT IF EXISTS wizard_sessions_template_id_fkey;

ALTER TABLE IF EXISTS public.generated_resumes 
  DROP CONSTRAINT IF EXISTS generated_resumes_template_id_fkey;

-- Drop indexes
DROP INDEX IF EXISTS public.idx_wizard_sessions_user_status;
DROP INDEX IF EXISTS public.idx_wizard_sessions_user_active;
DROP INDEX IF EXISTS public.idx_wizard_sessions_user_updated;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS public.ai_events;
DROP TABLE IF EXISTS public.generated_resume_versions;
DROP TABLE IF EXISTS public.generated_resumes;
DROP TABLE IF EXISTS public.wizard_sessions;

COMMIT;

