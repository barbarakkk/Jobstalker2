-- Create temporary job matching preferences table
-- This table stores user job matching preferences temporarily (auto-expires after 24 hours)
-- Simplified: Only location and salary preferences (skills are pulled from user_skills table)

CREATE TABLE IF NOT EXISTS public.job_matching_preferences_temp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Only location and salary
    preferred_locations JSONB DEFAULT '[]'::jsonb,
    min_salary INTEGER,
    salary_currency VARCHAR(10) DEFAULT 'USD',
    
    -- Expiration (auto-cleanup)
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_matching_preferences_temp_user_id ON public.job_matching_preferences_temp(user_id);
CREATE INDEX IF NOT EXISTS idx_job_matching_preferences_temp_expires_at ON public.job_matching_preferences_temp(expires_at);
CREATE INDEX IF NOT EXISTS idx_job_matching_preferences_temp_created_at ON public.job_matching_preferences_temp(created_at);

-- GIN index for JSONB array for efficient querying
CREATE INDEX IF NOT EXISTS idx_job_matching_preferences_temp_locations ON public.job_matching_preferences_temp USING GIN (preferred_locations);

-- Create trigger for updated_at
CREATE TRIGGER update_job_matching_preferences_temp_updated_at 
    BEFORE UPDATE ON public.job_matching_preferences_temp 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.job_matching_preferences_temp ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own temp job matching preferences" ON public.job_matching_preferences_temp
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own temp job matching preferences" ON public.job_matching_preferences_temp
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own temp job matching preferences" ON public.job_matching_preferences_temp
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own temp job matching preferences" ON public.job_matching_preferences_temp
    FOR DELETE USING (auth.uid() = user_id);

-- Function to clean up expired records (run this periodically via cron or scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_job_matching_preferences()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.job_matching_preferences_temp
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
