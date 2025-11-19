from fastapi import FastAPI, HTTPException, Depends, Header, Request, UploadFile, File, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from supabase_client import supabase
from models import Job, CreateJob, UpdateJob, Profile, CreateProfile, UpdateProfile, ProfileStats, Skill, CreateSkill, UpdateSkill, WorkExperience, CreateExperience, UpdateExperience, Education, CreateEducation, UpdateEducation, Language, CreateLanguage, UpdateLanguage, FileUploadResponse, ProfilePictureResponse, ProfileResponse
from uuid import UUID
from typing import List, Optional
from fastapi.encoders import jsonable_encoder
import os
import time
import uuid
from datetime import datetime
import openai
import re
from pydantic import BaseModel
from dotenv import load_dotenv
import json
import hashlib
from pathlib import Path
from routes.ai_resume import router as ai_resume_router
from routes.wizard import router as wizard_router
from routes.profile import router as profile_router
from routes.skills import router as skills_router
from routes.experience import router as experience_router
from routes.education import router as education_router
from routes.languages import router as languages_router
from routes.jobs import router as jobs_router
from routes.ai_extraction import router as ai_extraction_router
from routes.ai_match import router as ai_match_router
import logging
import threading

# Load environment variables from .env files (project root and backend/.env)
try:
    from dotenv import find_dotenv, dotenv_values
    # Attempt to load from project root (respect current working directory)
    load_dotenv(find_dotenv(usecwd=True), override=False)
except Exception:
    pass

# Always also attempt to load from backend/.env explicitly, overriding missing values
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)

# Final fallback: if OPENAI_API_KEY still missing, parse backend/.env manually and inject
if not os.getenv("OPENAI_API_KEY"):
    try:
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        values = dotenv_values(env_path)
        key = values.get("OPENAI_API_KEY") if values else None
        if key:
            os.environ["OPENAI_API_KEY"] = key
    except Exception:
        pass

"""
Debug persistence disabled for production.
The previous implementation wrote debug JSON/HTML/text into backend/debug_data.
All debug writes are now no-ops to avoid leaking data in repositories or builds.
"""

def save_state_data(state_name: str, data: dict, user_id: str = None, job_url: str = None):
    return None

def save_html_content(html_content: str, user_id: str, job_url: str, stage: str = "raw_html"):
    return None

def save_cleaned_content(cleaned_text: str, user_id: str, job_url: str, stage: str = "cleaned_text"):
    return None

# ----------------------------------------------------------------------------
# Logging setup (structured and minimal)
# ----------------------------------------------------------------------------
logger = logging.getLogger("jobstalker")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

app = FastAPI(title="JobStalker AI API", version="1.0.0")

# Custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Convert Pydantic validation errors to user-friendly messages."""
    errors = exc.errors()
    
    # Log technical details to console/terminal
    print(f"❌ Validation Error on {request.method} {request.url}")
    print(f"   Technical details: {errors}")
    
    # Build user-friendly error messages
    user_friendly_errors = []
    for error in errors:
        field = ".".join(str(loc) for loc in error.get("loc", []))
        error_type = error.get("type", "")
        error_msg = error.get("msg", "")
        
        # Convert technical errors to user-friendly messages
        if "missing" in error_type or "required" in error_msg.lower():
            field_name = field.split(".")[-1] if "." in field else field
            user_friendly_errors.append(f"Please fill in {field_name.replace('_', ' ').title()}")
        elif "too_short" in error_type or "too short" in error_msg.lower():
            if "date" in field.lower() or "date" in error_msg.lower():
                user_friendly_errors.append("Please enter a valid date")
            else:
                user_friendly_errors.append(f"{field.replace('_', ' ').title()} is too short")
        elif "date" in error_type or "date" in error_msg.lower():
            user_friendly_errors.append("Please enter a valid date")
        else:
            # Generic fallback
            field_name = field.replace("_", " ").title() if field else "Field"
            user_friendly_errors.append(f"Invalid {field_name}")
    
    # If no user-friendly messages, use a generic one
    if not user_friendly_errors:
        user_friendly_errors.append("Please check your input and try again")
    
    # Return user-friendly error (only show first error to avoid overwhelming user)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": user_friendly_errors[0],
            "errors": user_friendly_errors
        }
    )

# Add CORS middleware - must be added BEFORE routers and other middleware
# This allows frontend applications to make requests to this backend
# Order matters: CORS middleware must be first to handle preflight requests

# Get allowed origins from environment or use defaults
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()] if allowed_origins_env else []
if not allowed_origins:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://jobstalker.vercel.app",
        "https://jobstalker-ai.com",
        "https://www.jobstalker-ai.com",
    ]

# Log CORS configuration for debugging
print(f"🌐 CORS Configuration: Allowing origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Include AI resume routes - AFTER CORS middleware
app.include_router(ai_resume_router)
app.include_router(wizard_router)
app.include_router(profile_router)
app.include_router(skills_router)
app.include_router(experience_router)
app.include_router(education_router)
app.include_router(languages_router)
app.include_router(jobs_router)
app.include_router(ai_extraction_router)
app.include_router(ai_match_router)

# Rely on CORSMiddleware for preflight handling and headers

# Security middleware for adding security headers
# Note: This runs AFTER CORS middleware, so CORS headers are preserved
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    start = time.time()
    response = await call_next(request)
    duration_ms = int((time.time() - start) * 1000)
    
    # Don't add security headers to OPTIONS requests (preflight) - let CORS handle it
    if request.method == "OPTIONS":
        return response
    
    # Add security headers (CORS headers are already set by CORSMiddleware)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Basic structured request log
    try:
        logger.info(json.dumps({
            "event": "http_request",
            "path": request.url.path,
            "method": request.method,
            "status": response.status_code,
            "duration_ms": duration_ms,
            "client": request.client.host if request.client else None,
        }))
    except Exception:
        pass
    return response

# ---------------------------------------------------------------------------
# Rate limiting (per-IP and per-user with path buckets)
# ---------------------------------------------------------------------------
request_counts_ip = {}
request_counts_user = {}
lock = threading.Lock()

RATE_LIMIT_GLOBAL_PER_MIN = 100  # per IP fallback
RATE_LIMIT_USER_PER_MIN = 30     # per user default
RATE_LIMIT_USER_AI_PER_MIN = 30  # per user AI endpoints (increased for better UX during resume building)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Simple rate limiting with per-user and per-IP buckets. Adds rate headers."""
    # Skip rate limiting for OPTIONS requests (CORS preflight)
    if request.method == "OPTIONS":
        return await call_next(request)
    
    now = time.time()
    client_ip = request.client.host if request.client else "unknown"

    # Determine user id from bearer token if present
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    user_id = None
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()
        try:
            # Do not block request if auth lookup fails
            user_resp = supabase.auth.get_user(token)
            if user_resp and user_resp.user:
                user_id = user_resp.user.id
        except Exception:
            user_id = None

    # Choose bucket
    path = request.url.path
    is_ai = path.startswith("/api/ai/")
    user_limit = RATE_LIMIT_USER_AI_PER_MIN if is_ai else RATE_LIMIT_USER_PER_MIN

    with lock:
        # Cleanup + count for IP
        bucket = request_counts_ip.setdefault(client_ip, [])
        request_counts_ip[client_ip] = [t for t in bucket if now - t < 60]
        request_counts_ip[client_ip].append(now)
        ip_count = len(request_counts_ip[client_ip])

        # Cleanup + count for user when available
        user_count = None
        if user_id:
            bucket_u = request_counts_user.setdefault(user_id, [])
            request_counts_user[user_id] = [t for t in bucket_u if now - t < 60]
            request_counts_user[user_id].append(now)
            user_count = len(request_counts_user[user_id])

    # Decide limit applies
    limit = user_limit if user_id else RATE_LIMIT_GLOBAL_PER_MIN
    remaining = None
    current_count = user_count if user_id else ip_count
    if current_count is not None:
        remaining = max(0, limit - current_count)

    if current_count is not None and current_count > limit:
        headers = {
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Remaining": "0",
            "Retry-After": "60",
        }
        error_msg = f"Rate limit exceeded. You can make up to {limit} AI requests per minute. Please wait a moment before trying again."
        return JSONResponse(status_code=429, content={"detail": error_msg}, headers=headers)

    response = await call_next(request)
    # Add headers
    if remaining is not None:
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
    return response

# Authentication and file upload functions moved to utils/
# - get_current_user -> utils/dependencies.py
# - upload_file_to_supabase -> utils/file_upload.py
# - upload_profile_picture_to_supabase -> utils/file_upload.py

@app.get("/ping")
def ping():
    """Health check endpoint"""
    return {"message": "pong", "status": "healthy", "timestamp": time.time()}

@app.get("/api/auth/verify")
def verify_token(authorization: Optional[str] = Header(None)):
    """Simple token verification endpoint for extensions"""
    try:
        if not authorization or not authorization.startswith("Bearer "):
            return {"valid": False, "error": "Invalid authorization header"}
        
        token = authorization.replace("Bearer ", "").strip()
        if not token:
            return {"valid": False, "error": "Empty token"}
        
        # Verify token with Supabase
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            return {"valid": False, "error": "Invalid or expired token"}
        
        return {
            "valid": True, 
            "user_id": user_response.user.id,
            "email": user_response.user.email
        }
        
    except Exception as e:
        return {"valid": False, "error": f"Token verification failed: {str(e)}"}

@app.get("/health")
def health_check():
    """Comprehensive health check endpoint"""
    try:
        # Test database connection
        response = supabase.table("jobs").select("id").limit(1).execute()
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": time.time(),
            "version": "1.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "timestamp": time.time()
        }

@app.get("/api/debug/openai")
async def debug_openai():
    """Debug endpoint to check OpenAI API key status"""
    try:
        # Collect diagnostics about environment loading
        cwd = os.getcwd()
        backend_dir = os.path.dirname(__file__)
        project_root = os.path.abspath(os.path.join(backend_dir, ".."))
        backend_env_path = os.path.join(backend_dir, '.env')
        root_env_path = os.path.join(project_root, '.env')
        try:
            from dotenv import find_dotenv
            found_dotenv = find_dotenv()
        except Exception:
            found_dotenv = None

        diagnostics = {
            "cwd": cwd,
            "backend_dir": backend_dir,
            "project_root": project_root,
            "backend_env_exists": os.path.exists(backend_env_path),
            "root_env_exists": os.path.exists(root_env_path),
            "found_dotenv": found_dotenv,
            "env_sample": {
                "OPENAI_API_KEY_len": len(os.getenv("OPENAI_API_KEY") or "")
            }
        }

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            # Try to load from .env file directly
            try:
                from dotenv import load_dotenv
                load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
                api_key = os.getenv("OPENAI_API_KEY")
            except Exception as e:
                return {"status": "error", "message": f"Failed to load .env: {str(e)}", "diagnostics": diagnostics}
        
        if api_key:
            return {
                "status": "success", 
                "message": "OpenAI API key is configured",
                "key_preview": api_key[:10] + "..." if len(api_key) > 10 else api_key,
                "diagnostics": diagnostics
            }
        else:
            return {"status": "error", "message": "OpenAI API key not found", "diagnostics": diagnostics}
    except Exception as e:
        return {"status": "error", "message": f"Error checking API key: {str(e)}"}

@app.get("/cors-test")
def cors_test():
    """Test endpoint to verify CORS is working"""
    return {"message": "CORS is working!", "timestamp": "2024-01-01T00:00:00Z"}

# CORS preflight requests are handled automatically by the CORS middleware

@app.post("/test-jobs")
def test_create_job(job: CreateJob):
    """Test endpoint without authentication"""
    data = jsonable_encoder(job, exclude_unset=True)
    data["user_id"] = "test-user-id"  # Use a test user ID
    response = supabase.table("jobs").insert(data).execute()
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=400, detail="Job creation failed")

@app.post("/jobs-no-auth")
def create_job_no_auth(job: CreateJob):
    """Create job without authentication for testing"""
    data = jsonable_encoder(job, exclude_unset=True)
    data["user_id"] = "test-user-id"  # Use a test user ID
    response = supabase.table("jobs").insert(data).execute()
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=400, detail="Job creation failed")

@app.get("/test-connection")
def test_connection():
    """Simple connection test"""
    try:
        # Just test if we can connect to Supabase
        response = supabase.table("jobs").select("id").limit(1).execute()
        return {"success": True, "message": "Backend connected to Supabase successfully"}
    except Exception as e:
        return {"success": False, "error": f"Connection failed: {str(e)}"}

@app.get("/supabase-test")
def supabase_test():
    try:
        # Test connection by querying the jobs table
        response = supabase.table("jobs").select("id").limit(1).execute()
        return {"success": True, "message": "Connected to Supabase successfully", "data": response.data}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================================
# PROFILE API ENDPOINTS
# ============================================================================

# ============================================================================
# ENDPOINTS MOVED TO ROUTES MODULES
# ============================================================================
# The following endpoints have been moved to separate route modules:
# - Profile endpoints -> routes/profile.py
# - Skills endpoints -> routes/skills.py  
# - Experience endpoints -> routes/experience.py
# - Education endpoints -> routes/education.py
# - Jobs endpoints -> routes/jobs.py
# - AI extraction endpoints -> routes/ai_extraction.py
# - AI match endpoints -> routes/ai_match.py
# 
# Old endpoint code removed below. See respective route files for implementation.
# ============================================================================

# All endpoints moved to route modules - see routes/ directory
# Old endpoint code removed to prevent conflicts

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
