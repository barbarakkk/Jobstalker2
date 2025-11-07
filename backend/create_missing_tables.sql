-- Quick fix: Create missing tables for user_skills, user_work_experience, user_education
-- Run this SQL in your Supabase SQL Editor

-- First, ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- User Skills Table
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    proficiency VARCHAR(50),
    category VARCHAR(100) DEFAULT 'Technical',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- User Work Experience Table
CREATE TABLE IF NOT EXISTS public.user_work_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Education Table
CREATE TABLE IF NOT EXISTS public.user_education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school VARCHAR(255) NOT NULL,
    degree VARCHAR(100),
    field VARCHAR(255),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_category ON public.user_skills(category);
CREATE INDEX IF NOT EXISTS idx_user_work_experience_user_id ON public.user_work_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_user_education_user_id ON public.user_education(user_id);

-- Enable RLS
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_education ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_skills
CREATE POLICY "Users can view own skills" ON public.user_skills
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON public.user_skills
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON public.user_skills
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skills" ON public.user_skills
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_work_experience
CREATE POLICY "Users can view own work experience" ON public.user_work_experience
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work experience" ON public.user_work_experience
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own work experience" ON public.user_work_experience
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own work experience" ON public.user_work_experience
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_education
CREATE POLICY "Users can view own education" ON public.user_education
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own education" ON public.user_education
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own education" ON public.user_education
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own education" ON public.user_education
    FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_user_skills_updated_at BEFORE UPDATE ON public.user_skills 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_work_experience_updated_at BEFORE UPDATE ON public.user_work_experience 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_education_updated_at BEFORE UPDATE ON public.user_education 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

