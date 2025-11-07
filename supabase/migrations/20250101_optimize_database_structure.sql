-- JobStalker2 Database Optimization Migration
-- This migration normalizes JSONB data into separate tables and optimizes the database structure

BEGIN;

-- ===============
-- 1. Create Normalized Tables
-- ===============

-- User Skills Table
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    proficiency VARCHAR(50),
    category VARCHAR(100) DEFAULT 'Technical',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name) -- Prevent duplicate skills for same user
);

-- User Work Experience Table
CREATE TABLE IF NOT EXISTS public.user_work_experience (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Education Table
CREATE TABLE IF NOT EXISTS public.user_education (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school VARCHAR(255) NOT NULL,
    degree VARCHAR(100),
    field VARCHAR(255),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===============
-- 2. Create Indexes for Performance
-- ===============

-- User Skills Indexes
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_category ON public.user_skills(category);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_category ON public.user_skills(user_id, category);

-- User Work Experience Indexes
CREATE INDEX IF NOT EXISTS idx_user_work_experience_user_id ON public.user_work_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_user_work_experience_user_dates ON public.user_work_experience(user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_work_experience_current ON public.user_work_experience(user_id, is_current) WHERE is_current = TRUE;

-- User Education Indexes
CREATE INDEX IF NOT EXISTS idx_user_education_user_id ON public.user_education(user_id);
CREATE INDEX IF NOT EXISTS idx_user_education_user_dates ON public.user_education(user_id, start_date DESC);

-- Jobs Table Optimizations
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON public.jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_updated ON public.jobs(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_date_applied ON public.jobs(date_applied DESC) WHERE date_applied IS NOT NULL;

-- Resume Builder Data Optimizations
CREATE INDEX IF NOT EXISTS idx_resume_builder_data_user_current ON public.resume_builder_data(user_id, is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_resume_builder_data_user_updated ON public.resume_builder_data(user_id, updated_at DESC);

-- Wizard Sessions Optimizations
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_user_active ON public.wizard_sessions(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_wizard_sessions_user_updated ON public.wizard_sessions(user_id, updated_at DESC);

-- Generated Resumes Optimizations (already exists, but ensure it's there)
CREATE INDEX IF NOT EXISTS idx_generated_resumes_user_updated ON public.generated_resumes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_resumes_share_token ON public.generated_resumes(share_token) WHERE share_token IS NOT NULL;

-- Generated Resume Versions Optimizations
CREATE INDEX IF NOT EXISTS idx_generated_resume_versions_resume_id ON public.generated_resume_versions(generated_resume_id);
CREATE INDEX IF NOT EXISTS idx_generated_resume_versions_resume_version ON public.generated_resume_versions(generated_resume_id, version_number DESC);

-- AI Events Optimizations
CREATE INDEX IF NOT EXISTS idx_ai_events_user_created ON public.ai_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_status ON public.ai_events(status);
CREATE INDEX IF NOT EXISTS idx_ai_events_provider_model ON public.ai_events(provider, model);

-- ===============
-- 3. Add Updated_at Triggers
-- ===============

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for new tables
DROP TRIGGER IF EXISTS update_user_skills_updated_at ON public.user_skills;
CREATE TRIGGER update_user_skills_updated_at 
    BEFORE UPDATE ON public.user_skills 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_work_experience_updated_at ON public.user_work_experience;
CREATE TRIGGER update_user_work_experience_updated_at 
    BEFORE UPDATE ON public.user_work_experience 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_education_updated_at ON public.user_education;
CREATE TRIGGER update_user_education_updated_at 
    BEFORE UPDATE ON public.user_education 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============
-- 4. Enable Row Level Security
-- ===============

ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_education ENABLE ROW LEVEL SECURITY;

-- ===============
-- 5. Create RLS Policies
-- ===============

-- User Skills Policies
DROP POLICY IF EXISTS user_skills_select_own ON public.user_skills;
CREATE POLICY user_skills_select_own ON public.user_skills
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_skills_insert_own ON public.user_skills;
CREATE POLICY user_skills_insert_own ON public.user_skills
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_skills_update_own ON public.user_skills;
CREATE POLICY user_skills_update_own ON public.user_skills
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_skills_delete_own ON public.user_skills;
CREATE POLICY user_skills_delete_own ON public.user_skills
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- User Work Experience Policies
DROP POLICY IF EXISTS user_work_experience_select_own ON public.user_work_experience;
CREATE POLICY user_work_experience_select_own ON public.user_work_experience
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_work_experience_insert_own ON public.user_work_experience;
CREATE POLICY user_work_experience_insert_own ON public.user_work_experience
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_work_experience_update_own ON public.user_work_experience;
CREATE POLICY user_work_experience_update_own ON public.user_work_experience
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_work_experience_delete_own ON public.user_work_experience;
CREATE POLICY user_work_experience_delete_own ON public.user_work_experience
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- User Education Policies
DROP POLICY IF EXISTS user_education_select_own ON public.user_education;
CREATE POLICY user_education_select_own ON public.user_education
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_education_insert_own ON public.user_education;
CREATE POLICY user_education_insert_own ON public.user_education
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_education_update_own ON public.user_education;
CREATE POLICY user_education_update_own ON public.user_education
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_education_delete_own ON public.user_education;
CREATE POLICY user_education_delete_own ON public.user_education
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- ===============
-- 6. Add Check Constraints
-- ===============

-- Jobs table constraints
ALTER TABLE public.jobs 
    DROP CONSTRAINT IF EXISTS check_excitement_level,
    ADD CONSTRAINT check_excitement_level 
        CHECK (excitement_level IS NULL OR (excitement_level >= 1 AND excitement_level <= 5));

-- ===============
-- 7. Fix Template ID Consistency
-- ===============

-- Note: This will fail if there are existing resume_builder_data with invalid template_ids
-- We'll handle this in the data migration script
-- For now, we'll keep template_id as VARCHAR but add a comment
COMMENT ON COLUMN public.resume_builder_data.template_id IS 'Template identifier - consider migrating to UUID foreign key to templates table';

-- ===============
-- 8. Create Helper Functions
-- ===============

-- Function to migrate skills from JSONB to normalized table
CREATE OR REPLACE FUNCTION migrate_user_skills_from_jsonb(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    skill_count INTEGER := 0;
    skill_item JSONB;
BEGIN
    -- Extract skills from user_profile JSONB and insert into normalized table
    FOR skill_item IN 
        SELECT * FROM jsonb_array_elements(
            (SELECT skills FROM public.user_profile WHERE user_id = p_user_id)
        )
    LOOP
        INSERT INTO public.user_skills (user_id, name, proficiency, category)
        VALUES (
            p_user_id,
            skill_item->>'name',
            skill_item->>'proficiency',
            COALESCE(skill_item->>'category', 'Technical')
        )
        ON CONFLICT (user_id, name) DO UPDATE SET
            proficiency = EXCLUDED.proficiency,
            category = EXCLUDED.category,
            updated_at = NOW();
        
        skill_count := skill_count + 1;
    END LOOP;
    
    RETURN skill_count;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate work experience from JSONB to normalized table
CREATE OR REPLACE FUNCTION migrate_user_work_experience_from_jsonb(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    exp_count INTEGER := 0;
    exp_item JSONB;
BEGIN
    FOR exp_item IN 
        SELECT * FROM jsonb_array_elements(
            (SELECT work_experience FROM public.user_profile WHERE user_id = p_user_id)
        )
    LOOP
        INSERT INTO public.user_work_experience (
            user_id, title, company, location, 
            start_date, end_date, is_current, description
        )
        VALUES (
            p_user_id,
            exp_item->>'title',
            exp_item->>'company',
            exp_item->>'location',
            (exp_item->>'start_date')::DATE,
            CASE 
                WHEN exp_item->>'end_date' IS NOT NULL THEN (exp_item->>'end_date')::DATE
                ELSE NULL
            END,
            COALESCE((exp_item->>'is_current')::BOOLEAN, FALSE),
            exp_item->>'description'
        );
        
        exp_count := exp_count + 1;
    END LOOP;
    
    RETURN exp_count;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate education from JSONB to normalized table
CREATE OR REPLACE FUNCTION migrate_user_education_from_jsonb(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    edu_count INTEGER := 0;
    edu_item JSONB;
BEGIN
    FOR edu_item IN 
        SELECT * FROM jsonb_array_elements(
            (SELECT education FROM public.user_profile WHERE user_id = p_user_id)
        )
    LOOP
        INSERT INTO public.user_education (
            user_id, school, degree, field, start_date, end_date
        )
        VALUES (
            p_user_id,
            edu_item->>'school',
            edu_item->>'degree',
            edu_item->>'field',
            (edu_item->>'start_date')::DATE,
            CASE 
                WHEN edu_item->>'end_date' IS NOT NULL THEN (edu_item->>'end_date')::DATE
                ELSE NULL
            END
        );
        
        edu_count := edu_count + 1;
    END LOOP;
    
    RETURN edu_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;

