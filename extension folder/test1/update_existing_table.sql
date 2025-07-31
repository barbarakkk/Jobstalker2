-- Add missing columns to existing jobs table
-- This script adds the columns that the extension needs

-- Add title column (if not exists)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS title TEXT;

-- Add company column (if not exists)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company TEXT;

-- Add location column (if not exists)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location TEXT;

-- Add ai_analysis column for storing AI insights
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

-- Add linkedin_data column for storing raw LinkedIn data
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS linkedin_data JSONB;

-- Add notes column (if not exists)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing records to have default values where needed
UPDATE jobs SET 
    title = COALESCE(title, 'Unknown Title'),
    company = COALESCE(company, 'Unknown Company'),
    location = COALESCE(location, 'Unknown Location'),
    notes = COALESCE(notes, '')
WHERE title IS NULL OR company IS NULL OR location IS NULL OR notes IS NULL;

-- Add constraints for excitement_level and status if they don't exist
-- (These might already exist, but adding them safely)
DO $$
BEGIN
    -- Add excitement_level constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'jobs_excitement_level_check'
    ) THEN
        ALTER TABLE jobs ADD CONSTRAINT jobs_excitement_level_check 
        CHECK (excitement_level >= 1 AND excitement_level <= 10);
    END IF;
    
    -- Add status constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'jobs_status_check'
    ) THEN
        ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
        CHECK (status IN ('bookmarked', 'interviewing', 'accepted', 'rejected'));
    END IF;
END $$;

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_excitement_level ON jobs(excitement_level);

-- Create a function to automatically update the updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column (if it doesn't exist)
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (if it doesn't exist)
DROP POLICY IF EXISTS "Allow all operations" ON jobs;
CREATE POLICY "Allow all operations" ON jobs FOR ALL USING (true);

-- Create a view for easier querying of job data with AI insights
CREATE OR REPLACE VIEW jobs_with_ai_insights AS
SELECT 
    id,
    title,
    company,
    location,
    excitement_level,
    status,
    notes,
    created_at,
    updated_at,
    ai_analysis->>'skills_required' as skills_required,
    ai_analysis->>'experience_level' as experience_level,
    ai_analysis->>'salary_range' as salary_range,
    ai_analysis->>'remote_friendly' as remote_friendly,
    ai_analysis->>'key_highlights' as key_highlights,
    ai_analysis->>'potential_red_flags' as potential_red_flags,
    ai_analysis->>'overall_assessment' as overall_assessment
FROM jobs
WHERE ai_analysis IS NOT NULL; 