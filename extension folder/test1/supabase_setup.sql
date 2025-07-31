-- Create the jobs table for storing LinkedIn job data and AI analysis
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT,
    location TEXT,
    description TEXT,
    job_url TEXT,
    excitement_level INTEGER DEFAULT 5 CHECK (excitement_level >= 1 AND excitement_level <= 10),
    status TEXT DEFAULT 'bookmarked' CHECK (status IN ('bookmarked', 'interviewing', 'accepted', 'rejected')),
    notes TEXT,
    linkedin_data JSONB, -- Store the raw LinkedIn data
    ai_analysis JSONB, -- Store the OpenAI analysis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_excitement_level ON jobs(excitement_level);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - you can disable this if you want
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you can modify this for user-specific access)
CREATE POLICY "Allow all operations" ON jobs FOR ALL USING (true);

-- Optional: Create a view for easier querying of job data with AI insights
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