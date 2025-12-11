-- Add referral_source column to user_profile table
-- This tracks how users heard about Jobstalker for business development analytics

BEGIN;

-- Add referral_source column to user_profile table
ALTER TABLE public.user_profile 
ADD COLUMN IF NOT EXISTS referral_source VARCHAR(100);

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_user_profile_referral_source 
ON public.user_profile(referral_source);

COMMIT;

