-- Remove resumes table and resumes field from user_profile
-- This removes the old file upload resume feature in favor of AI-generated resumes

BEGIN;

-- Drop RLS policies for resumes table first
DROP POLICY IF EXISTS "Users can view own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON public.resumes;

-- Drop the resumes table
DROP TABLE IF EXISTS public.resumes CASCADE;

-- Remove resumes column from user_profile table
ALTER TABLE public.user_profile DROP COLUMN IF EXISTS resumes;

-- Drop index on user_profile.resumes if it exists
DROP INDEX IF EXISTS public.idx_user_profile_resumes;

COMMIT;

