-- JobStalker2 Database Schema
-- Consolidated user_profile table approach

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Consolidated user_profile table
CREATE TABLE IF NOT EXISTS public.user_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic profile information
    full_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255),
    location VARCHAR(255),
    -- professional_summary TEXT, -- Removed as per user request
    profile_picture_url TEXT,
    
    -- Skills stored as JSON array
    skills JSONB DEFAULT '[]'::jsonb,
    -- Example structure: [{"name": "Python", "proficiency": "Expert"}, {"name": "React", "proficiency": "Intermediate"}]
    
    -- Work experience stored as JSON array
    work_experience JSONB DEFAULT '[]'::jsonb,
    -- Example structure: [{"title": "Software Engineer", "company": "Tech Corp", "start_date": "2020-01", "end_date": null, "is_current": true, "description": "..."}]
    
    -- Education stored as JSON array
    education JSONB DEFAULT '[]'::jsonb,
    -- Example structure: [{"school": "University", "degree": "BS", "field": "Computer Science", "start_date": "2016-09", "end_date": "2020-05"}]
    
    -- Resume information stored as JSON array
    resumes JSONB DEFAULT '[]'::jsonb,
    -- Example structure: [{"filename": "resume.pdf", "file_url": "...", "file_size": 1024000, "is_default": true}]
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table (if not already exists)
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    salary VARCHAR(255),
    job_url TEXT,
    status VARCHAR(100) NOT NULL,
    excitement_level INTEGER CHECK (excitement_level >= 1 AND excitement_level <= 5),
    date_applied DATE,
    deadline DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resumes table for file uploads
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resume Builder Data table for structured resume data
CREATE TABLE IF NOT EXISTS public.resume_builder_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) DEFAULT 'My Resume',
    resume_data JSONB NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON public.user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_builder_data_user_id ON public.resume_builder_data(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_builder_data_template_id ON public.resume_builder_data(template_id);
CREATE INDEX IF NOT EXISTS idx_resume_builder_data_resume_data ON public.resume_builder_data USING GIN (resume_data);

-- Create GIN indexes for JSONB fields to enable efficient querying
CREATE INDEX IF NOT EXISTS idx_user_profile_skills ON public.user_profile USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_user_profile_work_experience ON public.user_profile USING GIN (work_experience);
CREATE INDEX IF NOT EXISTS idx_user_profile_education ON public.user_profile USING GIN (education);
CREATE INDEX IF NOT EXISTS idx_user_profile_resumes ON public.user_profile USING GIN (resumes);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profile_updated_at BEFORE UPDATE ON public.user_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resume_builder_data_updated_at BEFORE UPDATE ON public.resume_builder_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_builder_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profile
CREATE POLICY "Users can view own profile" ON public.user_profile
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profile
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profile
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.user_profile
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for jobs
CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs" ON public.jobs
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for resumes
CREATE POLICY "Users can view own resumes" ON public.resumes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes" ON public.resumes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes" ON public.resumes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes" ON public.resumes
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for resume_builder_data
CREATE POLICY "Users can view own resume builder data" ON public.resume_builder_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume builder data" ON public.resume_builder_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resume builder data" ON public.resume_builder_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resume builder data" ON public.resume_builder_data
    FOR DELETE USING (auth.uid() = user_id);

-- Create helper functions for JSON operations

-- Function to add a skill to user profile
CREATE OR REPLACE FUNCTION add_skill_to_profile(
    p_user_id UUID,
    p_skill_name VARCHAR(255),
    p_proficiency VARCHAR(50)
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_profile 
    SET skills = COALESCE(skills, '[]'::jsonb) || 
                 jsonb_build_object('name', p_skill_name, 'proficiency', p_proficiency, 'added_at', NOW())
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO public.user_profile (user_id, full_name, skills)
        VALUES (p_user_id, 'New User', 
                jsonb_build_array(jsonb_build_object('name', p_skill_name, 'proficiency', p_proficiency, 'added_at', NOW())));
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to add work experience to user profile
CREATE OR REPLACE FUNCTION add_work_experience_to_profile(
    p_user_id UUID,
    p_title VARCHAR(255),
    p_company VARCHAR(255),
    p_start_date DATE,
    p_end_date DATE DEFAULT NULL,
    p_is_current BOOLEAN DEFAULT FALSE,
    p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.user_profile 
    SET work_experience = COALESCE(work_experience, '[]'::jsonb) || 
                         jsonb_build_object(
                             'title', p_title,
                             'company', p_company,
                             'start_date', p_start_date,
                             'end_date', p_end_date,
                             'is_current', p_is_current,
                             'description', p_description,
                             'added_at', NOW()
                         )
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO public.user_profile (user_id, full_name, work_experience)
        VALUES (p_user_id, 'New User', 
                jsonb_build_array(jsonb_build_object(
                    'title', p_title,
                    'company', p_company,
                    'start_date', p_start_date,
                    'end_date', p_end_date,
                    'is_current', p_is_current,
                    'description', p_description,
                    'added_at', NOW()
                )));
    END IF;
END;
$$ LANGUAGE plpgsql;
