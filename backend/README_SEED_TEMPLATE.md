# Template Seeder

This script seeds the Modern Professional template into the database.

## Usage

Run the seed script from the backend directory:

```bash
cd backend
python seed_template.py
```

Or if using Python 3 explicitly:

```bash
python3 seed_template.py
```

## What it does

1. Checks if the "Modern Professional" template already exists
2. If it exists, updates it with the latest configuration
3. If it doesn't exist, creates a new template entry
4. The template is stored in the `templates` table with:
   - **Name**: Modern Professional
   - **Slug**: modern-professional
   - **Schema**: Complete template configuration (JSONB)
   - **Status**: Active

## Template Features

The Modern Professional template includes:

- **Layout**: Single-column layout (800px max width)
- **Sections**: Header, Summary, Work Experience, Education, Skills, Languages
- **Theme**: Modern blue color scheme (#2563eb)
- **Styling**: Clean, professional design with proper spacing

## Requirements

- Supabase credentials configured (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
- Database tables created (run migrations first)
- Python 3.7+

## Troubleshooting

If you get authentication errors:
- Make sure your `.env` file has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Or set them as environment variables

If the template doesn't appear:
- Check that the `templates` table exists
- Verify RLS policies allow inserts/updates
- Check the backend logs for errors

