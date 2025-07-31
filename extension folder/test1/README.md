# LinkedIn Job Extension with Supabase Integration

This Chrome extension extracts job data from LinkedIn and saves it to your Supabase database with AI analysis. **No API keys required from users!**

## Setup Instructions

### 1. Deploy the Backend API

**Option A: Deploy to Vercel (Recommended)**
1. Create a new repository on GitHub with the backend files
2. Go to [Vercel](https://vercel.com) and connect your GitHub repo
3. Add your OpenAI API key as an environment variable: `OPENAI_API_KEY`
4. Deploy the API

**Option B: Deploy to Netlify Functions**
1. Create a `netlify/functions/analyze-job.js` file
2. Add your OpenAI API key to Netlify environment variables
3. Deploy to Netlify

### 2. Update the Extension

1. Open `popup.js` and replace `https://your-backend-api.com/analyze-job` with your actual API URL
2. For Vercel: `https://your-project.vercel.app/analyze-job`
3. For Netlify: `https://your-site.netlify.app/.netlify/functions/analyze-job`

### 3. Set up Supabase Database

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase_setup.sql` and run it
4. This will create the `jobs` table with all necessary columns and indexes

### 4. Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `test1` folder
4. The extension should now appear in your extensions list

### 5. Use the Extension

1. Navigate to a LinkedIn job posting
2. Click the extension icon
3. The extension will automatically extract job data
4. Set your excitement level, status, and add notes
5. Click "Save to JobStalker" - it will:
   - Process the job with AI (using your backend)
   - Save everything to your Supabase database

## Database Schema

The `jobs` table contains:

- **Basic job info**: title, company, location, description, URL
- **User inputs**: excitement level, status, notes
- **Raw LinkedIn data**: Complete job data from LinkedIn
- **AI analysis**: Skills required, experience level, salary range, etc.
- **Timestamps**: created_at, updated_at

## AI Analysis Features

The OpenAI integration provides:
- Required skills extraction
- Experience level assessment
- Salary range estimation
- Remote work availability
- Key highlights
- Potential red flags
- Overall opportunity assessment

## Security Notes

- Your API keys are stored locally in the extension
- Never share your API keys
- Consider using environment variables for production
- The extension uses Supabase's REST API with proper authentication

## Troubleshooting

- **"Extraction failed"**: Make sure you're on a LinkedIn job page
- **"OpenAI API error"**: Check your API key and billing
- **"Supabase error"**: Verify your URL and key are correct
- **"No job data"**: Refresh the page and try again

## Data Access

You can query your saved jobs in Supabase using:

```sql
-- View all jobs
SELECT * FROM jobs ORDER BY created_at DESC;

-- View jobs with AI insights
SELECT * FROM jobs_with_ai_insights;

-- Filter by status
SELECT * FROM jobs WHERE status = 'interviewing';

-- Search by company
SELECT * FROM jobs WHERE company ILIKE '%Google%';
``` 