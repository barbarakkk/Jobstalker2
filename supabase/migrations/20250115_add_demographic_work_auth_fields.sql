-- Add work authorization, demographic, and location/personal information fields to user_profile table
-- These fields are optional and used for job matching and diversity tracking

BEGIN;

-- Add work authorization columns
ALTER TABLE public.user_profile 
ADD COLUMN IF NOT EXISTS work_auth_us BOOLEAN,
ADD COLUMN IF NOT EXISTS work_auth_canada BOOLEAN,
ADD COLUMN IF NOT EXISTS work_auth_uk BOOLEAN,
ADD COLUMN IF NOT EXISTS requires_sponsorship BOOLEAN;

-- Add demographic columns
ALTER TABLE public.user_profile 
ADD COLUMN IF NOT EXISTS ethnicity VARCHAR(100),
ADD COLUMN IF NOT EXISTS has_disability VARCHAR(20) CHECK (has_disability IN ('Yes', 'No', 'Decline to state')),
ADD COLUMN IF NOT EXISTS is_veteran VARCHAR(20) CHECK (is_veteran IN ('Yes', 'No', 'Decline to state')),
ADD COLUMN IF NOT EXISTS is_lgbtq VARCHAR(20) CHECK (is_lgbtq IN ('Yes', 'No', 'Decline to state')),
ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Non-Binary', 'Decline to state'));

-- Add location/personal info columns
ALTER TABLE public.user_profile 
ADD COLUMN IF NOT EXISTS current_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(10);

COMMIT;
