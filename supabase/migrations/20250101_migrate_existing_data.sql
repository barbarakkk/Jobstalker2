-- Data Migration: Move JSONB data from user_profile to normalized tables
-- This should be run after the structure migration

BEGIN;

-- Migrate skills for all users
DO $$
DECLARE
    user_record RECORD;
    skills_migrated INTEGER;
BEGIN
    FOR user_record IN 
        SELECT user_id FROM public.user_profile 
        WHERE skills IS NOT NULL AND jsonb_array_length(skills) > 0
    LOOP
        SELECT migrate_user_skills_from_jsonb(user_record.user_id) INTO skills_migrated;
        RAISE NOTICE 'Migrated % skills for user %', skills_migrated, user_record.user_id;
    END LOOP;
END $$;

-- Migrate work experience for all users
DO $$
DECLARE
    user_record RECORD;
    exp_migrated INTEGER;
BEGIN
    FOR user_record IN 
        SELECT user_id FROM public.user_profile 
        WHERE work_experience IS NOT NULL AND jsonb_array_length(work_experience) > 0
    LOOP
        SELECT migrate_user_work_experience_from_jsonb(user_record.user_id) INTO exp_migrated;
        RAISE NOTICE 'Migrated % work experiences for user %', exp_migrated, user_record.user_id;
    END LOOP;
END $$;

-- Migrate education for all users
DO $$
DECLARE
    user_record RECORD;
    edu_migrated INTEGER;
BEGIN
    FOR user_record IN 
        SELECT user_id FROM public.user_profile 
        WHERE education IS NOT NULL AND jsonb_array_length(education) > 0
    LOOP
        SELECT migrate_user_education_from_jsonb(user_record.user_id) INTO edu_migrated;
        RAISE NOTICE 'Migrated % education records for user %', edu_migrated, user_record.user_id;
    END LOOP;
END $$;

COMMIT;

