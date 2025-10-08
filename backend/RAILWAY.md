# Railway Deployment Guide for JobStalker2 - Docker Fix

## Project Structure
This is a **Python FastAPI backend** with the following structure:

```
JobStalker2/
├── backend/                 # Python FastAPI backend (MAIN APPLICATION)
│   ├── main.py             # FastAPI application entry point
│   ├── requirements.txt    # Python dependencies
│   ├── Procfile           # Railway start command
│   ├── runtime.txt        # Python version specification
│   └── ...                # Other Python files
├── frontend/               # React frontend (NOT DEPLOYED)
├── extension/              # Chrome extension (NOT DEPLOYED)
└── railway.toml           # Railway configuration
```

## Deployment Configuration

### Build Root
- **Root Directory**: `backend/`
- **Application Type**: Python FastAPI
- **Python Version**: 3.12.7

### Dependencies
All Python dependencies are listed in `backend/requirements.txt`:
- fastapi>=0.116.1
- uvicorn[standard]>=0.35.0
- supabase>=2.17.0
- openai>=1.0.0
- And more...

### Start Command
The application starts with:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

## Environment Variables Required
Make sure to set these in Railway dashboard:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `OPENAI_API_KEY` - Your OpenAI API key

## Build Process
1. Railway detects Python project from `backend/requirements.txt`
2. Installs Python 3.12.7 (from `runtime.txt`)
3. Installs dependencies with `pip install -r requirements.txt`
4. Starts application using `Procfile` command

## Important Notes
- **DO NOT** deploy the frontend or extension folders
- **ONLY** the backend folder should be deployed
- The `railway.toml` specifies `root = "backend"`
- This is a **Python project**, not Node.js

## Troubleshooting
If deployment fails:
1. Check that `backend/requirements.txt` exists
2. Verify `backend/main.py` is the FastAPI app
3. Ensure all environment variables are set
4. Check that `backend/Procfile` contains the correct start command
