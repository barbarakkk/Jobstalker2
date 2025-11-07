# Environment Setup Guide

## Quick Switch Between Local and Production

### For LOCAL Development (Backend on your computer):
1. Edit `frontend/.env.local`:
   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```
2. Make sure your backend is running locally:
   ```bash
   cd backend
   python main.py
   ```
3. Restart your frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```

### For PRODUCTION (Backend on Railway):
1. Edit `frontend/.env.local`:
   ```
   VITE_API_BASE_URL=https://jobstalker2-production.up.railway.app
   ```
2. Make sure Railway backend is deployed and running
3. Restart your frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```

## File Priority
Vite loads environment variables in this order (later files override earlier ones):
1. `.env` - Base config (Supabase, etc.)
2. `.env.local` - Local overrides (API URL, etc.)

## Current Setup
- **`.env`** - Contains Supabase configuration (shared)
- **`.env.local`** - Contains API base URL (change this to switch environments)

## Important Notes
- Always restart the frontend dev server after changing `.env.local`
- `.env.local` is typically gitignored (not committed to git)
- For production frontend deployment, set `VITE_API_BASE_URL` in your hosting platform (Vercel, etc.)

