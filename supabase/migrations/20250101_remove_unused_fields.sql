-- Remove unused JSONB fields from user_profile table
-- After migrating data to normalized tables, we can optionally remove these fields
-- Note: Keep them for now in case of rollback, but mark as deprecated

BEGIN;

-- Add comments to mark fields as deprecated
COMMENT ON COLUMN public.user_profile.skills IS 'DEPRECATED: Use user_skills table instead';
COMMENT ON COLUMN public.user_profile.work_experience IS 'DEPRECATED: Use user_work_experience table instead';
COMMENT ON COLUMN public.user_profile.education IS 'DEPRECATED: Use user_education table instead';
COMMENT ON COLUMN public.user_profile.resumes IS 'DEPRECATED: Resume upload feature removed';

-- Optional: Drop unused resumes table if not needed
-- DROP TABLE IF EXISTS public.resumes;

-- Optional: Remove JSONB fields after confirming migration worked
-- ALTER TABLE public.user_profile DROP COLUMN IF EXISTS skills;
-- ALTER TABLE public.user_profile DROP COLUMN IF EXISTS work_experience;
-- ALTER TABLE public.user_profile DROP COLUMN IF EXISTS education;
-- ALTER TABLE public.user_profile DROP COLUMN IF EXISTS resumes;

COMMIT;

