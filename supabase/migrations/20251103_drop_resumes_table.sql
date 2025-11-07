BEGIN;

-- Drop references to user_profile.resumes column if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='user_profile' AND column_name='resumes'
  ) THEN
    ALTER TABLE public.user_profile DROP COLUMN IF EXISTS resumes;
  END IF;
END $$;

-- Drop resumes table if it exists
DROP TABLE IF EXISTS public.resumes CASCADE;

COMMIT;


