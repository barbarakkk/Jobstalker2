from fastapi import FastAPI, HTTPException, Depends, Header, Request, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase_client import supabase
from models import Job, CreateJob, UpdateJob, Profile, CreateProfile, UpdateProfile, ProfileStats, Skill, CreateSkill, UpdateSkill, WorkExperience, CreateExperience, UpdateExperience, Education, CreateEducation, UpdateEducation, FileUploadResponse, ProfilePictureResponse, ProfileResponse
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

app = FastAPI(title="JobStalker API", version="1.0.0")

# Include AI resume routes
app.include_router(ai_resume_router)
app.include_router(wizard_router)



# Add CORS middleware - must be added BEFORE other middleware
# This allows frontend applications to make requests to this backend
# Order matters: CORS middleware must be first to handle preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://jobstalker.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

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
RATE_LIMIT_USER_AI_PER_MIN = 5   # per user AI endpoints

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
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Please try again later."}, headers=headers)

    response = await call_next(request)
    # Add headers
    if remaining is not None:
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
    return response

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Enhanced authentication middleware with better error handling and security"""
    
    # Check if authorization header exists
    if not authorization:
        raise HTTPException(
            status_code=401, 
            detail="Authorization header is required"
        )
    
    # Validate Bearer token format
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Invalid authorization format. Use 'Bearer <token>'"
        )
    
    # Extract token
    token = authorization.replace("Bearer ", "").strip()
    
    # Validate token is not empty
    if not token:
        raise HTTPException(
            status_code=401, 
            detail="Token cannot be empty"
        )
    
    try:
        # Use Supabase to verify the token
        user_response = supabase.auth.get_user(token)
        
        # Check if user exists and is valid
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=401, 
                detail="Invalid or expired token"
            )
        
        # Extract user ID and additional user info
        user_id = user_response.user.id
        user_email = user_response.user.email
        
        # Authentication successful - user_id returned
        
        return user_id
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the specific error for debugging
        logger.warning(f"Authentication error: {str(e)}")
        
        # Provide user-friendly error message
        if "expired" in str(e).lower():
            raise HTTPException(
                status_code=401, 
                detail="Token has expired. Please log in again."
            )
        elif "invalid" in str(e).lower():
            raise HTTPException(
                status_code=401, 
                detail="Invalid token. Please log in again."
            )
        else:
            raise HTTPException(
                status_code=401, 
                detail="Authentication failed. Please try again."
            )

# File upload helper function
async def upload_file_to_supabase(file: UploadFile, folder: str) -> str:
    """Upload file to Supabase Storage and return the URL"""
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Read file content
        file_content = await file.read()
        
        # Upload to Supabase Storage
        file_path = f"{folder}/{unique_filename}"
        response = supabase.storage.from_("jobstalker-files").upload(
            file_path, 
            file_content,
            {"content-type": file.content_type}
        )
        
        # Get public URL
        file_url = supabase.storage.from_("jobstalker-files").get_public_url(file_path)
        
        return file_url
    except Exception as e:
        logger.error(f"File upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

# File upload helper function for profile picture
async def upload_profile_picture_to_supabase(file: UploadFile, file_content: bytes, user_id: str) -> str:
    """Upload profile picture to Supabase Storage and return the URL"""
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Upload to Supabase Storage with user ID in path
        file_path = f"{user_id}/profile-pictures/{unique_filename}"
        response = supabase.storage.from_("jobstalker-files").upload(
            file_path, 
            file_content,
            {"content-type": file.content_type}
        )
        
        # Get public URL
        file_url = supabase.storage.from_("jobstalker-files").get_public_url(file_path)
        
        return file_url
    except Exception as e:
        print(f"Profile picture upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile picture upload failed: {str(e)}")

# Resume upload helper removed - using AI-generated resumes instead

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

@app.get("/api/profile", response_model=ProfileResponse)
def get_profile(user_id: str = Depends(get_current_user)):
    """Get user profile with normalized data"""
    try:
        # Get basic profile
        profile_response = supabase.table("user_profile").select("*").eq("user_id", user_id).execute()
        
        if profile_response.data and len(profile_response.data) > 0:
            profile = profile_response.data[0]
        else:
            # Create default profile if none exists
            default_profile = {
                "user_id": user_id,
                "full_name": "Your Name",
                "job_title": "Your Role",
                "location": "Your Location"
            }
            insert_response = supabase.table("user_profile").insert(default_profile).execute()
            profile = insert_response.data[0]
        
        # Fetch normalized data
        skills_response = supabase.table("user_skills").select("*").eq("user_id", user_id).execute()
        experience_response = supabase.table("user_work_experience").select("*").eq("user_id", user_id).execute()
        education_response = supabase.table("user_education").select("*").eq("user_id", user_id).execute()
        
        # Build response with normalized data
        profile["skills"] = skills_response.data or []
        profile["work_experience"] = experience_response.data or []
        profile["education"] = education_response.data or []
        
        return ProfileResponse(**profile)
    except Exception as e:
        print(f"Error getting profile: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to get profile: {str(e)}")

@app.post("/api/profile/update", response_model=ProfileResponse)
def update_profile(profile_data: UpdateProfile, user_id: str = Depends(get_current_user)):
    """Update user profile"""
    try:
        data = jsonable_encoder(profile_data, exclude_unset=True)
        data["updated_at"] = datetime.utcnow().isoformat()
        
        # Check if profile exists
        existing = supabase.table("user_profile").select("id").eq("user_id", user_id).execute()
        
        if existing.data:
            # Update existing profile
            response = supabase.table("user_profile").update(data).eq("user_id", user_id).execute()
        else:
            # Create new profile
            data["user_id"] = user_id
            response = supabase.table("user_profile").insert(data).execute()
        
        if response.data:
            return ProfileResponse(**response.data[0])
        raise HTTPException(status_code=400, detail="Profile update failed")
    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Profile update failed: {str(e)}")

@app.post("/api/profile/picture", response_model=ProfilePictureResponse)
async def upload_profile_picture(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    """Upload profile picture"""
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size (max 5MB)
        file_size = 0
        file_content = await file.read()
        file_size = len(file_content)
        if file_size > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Upload to Supabase Storage
        file_url = await upload_profile_picture_to_supabase(file, file_content, user_id)
        
        # Update profile with new picture URL
        data = {"profile_picture_url": file_url, "updated_at": datetime.utcnow().isoformat()}
        
        existing = supabase.table("user_profile").select("id").eq("user_id", user_id).execute()
        if existing.data:
            response = supabase.table("user_profile").update(data).eq("user_id", user_id).execute()
        else:
            data["user_id"] = user_id
            response = supabase.table("user_profile").insert(data).execute()
        
        if response.data:
            return {"profile_picture_url": file_url}
        raise HTTPException(status_code=400, detail="Failed to update profile picture")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error uploading profile picture: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile picture upload failed: {str(e)}")



# Skills endpoints - work with normalized user_skills table
@app.get("/api/skills")
def get_skills(user_id: str = Depends(get_current_user)):
    """Get user skills from normalized user_skills table"""
    try:
        response = supabase.table("user_skills").select("*").eq("user_id", user_id).order("created_at", desc=False).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        print(f"Error getting skills: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to get skills: {str(e)}")

@app.post("/api/skills/add")
def add_skill(skill_data: CreateSkill, user_id: str = Depends(get_current_user)):
    """Add skill to normalized user_skills table"""
    try:
        skill_dict = {
            "user_id": user_id,
            "name": skill_data.name,
            "proficiency": skill_data.proficiency,
            "category": skill_data.category or "Technical"
        }
        
        response = supabase.table("user_skills").insert(skill_dict).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Failed to add skill")
    except Exception as e:
        print(f"Error adding skill: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to add skill: {str(e)}")

@app.put("/api/skills/{skill_id}")
def update_skill(skill_id: str, skill_data: UpdateSkill, user_id: str = Depends(get_current_user)):
    """Update skill in normalized user_skills table"""
    try:
        update_dict = {}
        if skill_data.name is not None:
            update_dict["name"] = skill_data.name
        if skill_data.proficiency is not None:
            update_dict["proficiency"] = skill_data.proficiency
        if skill_data.category is not None:
            update_dict["category"] = skill_data.category
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        response = supabase.table("user_skills").update(update_dict).eq("id", skill_id).eq("user_id", user_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Skill not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating skill: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to update skill: {str(e)}")

@app.delete("/api/skills/{skill_id}")
def delete_skill(skill_id: str, user_id: str = Depends(get_current_user)):
    """Delete skill from normalized user_skills table"""
    try:
        response = supabase.table("user_skills").delete().eq("id", skill_id).eq("user_id", user_id).execute()
        return {"success": True, "message": "Skill deleted successfully"}
    except Exception as e:
        print(f"Error deleting skill: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to delete skill: {str(e)}")

# Experience endpoints - work with normalized user_work_experience table
@app.get("/api/experience")
def get_experience(user_id: str = Depends(get_current_user)):
    """Get user work experience from normalized user_work_experience table"""
    try:
        response = supabase.table("user_work_experience").select("*").eq("user_id", user_id).order("start_date", desc=True).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        print(f"Error getting experience: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to get experience: {str(e)}")

@app.post("/api/experience/add")
def add_experience(experience_data: CreateExperience, user_id: str = Depends(get_current_user)):
    """Add work experience to normalized user_work_experience table"""
    try:
        exp_dict = {
            "user_id": user_id,
            "title": experience_data.title,
            "company": experience_data.company,
            "location": experience_data.location,
            "start_date": experience_data.start_date.isoformat() if experience_data.start_date else None,
            "end_date": experience_data.end_date.isoformat() if experience_data.end_date else None,
            "is_current": experience_data.is_current,
            "description": experience_data.description
        }
        
        response = supabase.table("user_work_experience").insert(exp_dict).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Failed to add experience")
    except Exception as e:
        print(f"Error adding experience: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to add experience: {str(e)}")

@app.put("/api/experience/{experience_id}")
def update_experience(experience_id: str, experience_data: UpdateExperience, user_id: str = Depends(get_current_user)):
    """Update work experience in normalized user_work_experience table"""
    try:
        update_dict = {}
        if experience_data.title is not None:
            update_dict["title"] = experience_data.title
        if experience_data.company is not None:
            update_dict["company"] = experience_data.company
        if experience_data.location is not None:
            update_dict["location"] = experience_data.location
        if experience_data.start_date is not None:
            update_dict["start_date"] = experience_data.start_date.isoformat()
        if experience_data.end_date is not None:
            update_dict["end_date"] = experience_data.end_date.isoformat()
        if experience_data.is_current is not None:
            update_dict["is_current"] = experience_data.is_current
        if experience_data.description is not None:
            update_dict["description"] = experience_data.description
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        response = supabase.table("user_work_experience").update(update_dict).eq("id", experience_id).eq("user_id", user_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Experience not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating experience: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to update experience: {str(e)}")

@app.delete("/api/experience/{experience_id}")
def delete_experience(experience_id: str, user_id: str = Depends(get_current_user)):
    """Delete work experience from normalized user_work_experience table"""
    try:
        response = supabase.table("user_work_experience").delete().eq("id", experience_id).eq("user_id", user_id).execute()
        return {"success": True, "message": "Experience deleted successfully"}
    except Exception as e:
        print(f"Error deleting experience: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to delete experience: {str(e)}")

# Education endpoints - work with normalized user_education table
@app.get("/api/education")
def get_education(user_id: str = Depends(get_current_user)):
    """Get user education from normalized user_education table"""
    try:
        response = supabase.table("user_education").select("*").eq("user_id", user_id).order("start_date", desc=True).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        print(f"Error getting education: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to get education: {str(e)}")

@app.post("/api/education/add")
def add_education(education_data: CreateEducation, user_id: str = Depends(get_current_user)):
    """Add education to normalized user_education table"""
    try:
        edu_dict = {
            "user_id": user_id,
            "school": education_data.school,
            "degree": education_data.degree,
            "field": education_data.field,
            "start_date": education_data.start_date.isoformat() if education_data.start_date else None,
            "end_date": education_data.end_date.isoformat() if education_data.end_date else None
        }
        
        response = supabase.table("user_education").insert(edu_dict).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Failed to add education")
    except Exception as e:
        print(f"Error adding education: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to add education: {str(e)}")

@app.put("/api/education/{education_id}")
def update_education(education_id: str, education_data: UpdateEducation, user_id: str = Depends(get_current_user)):
    """Update education in normalized user_education table"""
    try:
        update_dict = {}
        if education_data.school is not None:
            update_dict["school"] = education_data.school
        if education_data.degree is not None:
            update_dict["degree"] = education_data.degree
        if education_data.field is not None:
            update_dict["field"] = education_data.field
        if education_data.start_date is not None:
            update_dict["start_date"] = education_data.start_date.isoformat()
        if education_data.end_date is not None:
            update_dict["end_date"] = education_data.end_date.isoformat()
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        response = supabase.table("user_education").update(update_dict).eq("id", education_id).eq("user_id", user_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Education not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating education: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to update education: {str(e)}")

@app.delete("/api/education/{education_id}")
def delete_education(education_id: str, user_id: str = Depends(get_current_user)):
    """Delete education from normalized user_education table"""
    try:
        response = supabase.table("user_education").delete().eq("id", education_id).eq("user_id", user_id).execute()
        return {"success": True, "message": "Education deleted successfully"}
    except Exception as e:
        print(f"Error deleting education: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to delete education: {str(e)}")

# Note: Resume endpoints moved to the main resume section below

# Note: Resume add functionality moved to upload endpoint below

@app.get("/api/profile/stats", response_model=ProfileStats)
def get_profile_stats(user_id: str = Depends(get_current_user)):
    """Get profile statistics"""
    try:
        # Count jobs by status
        jobs_response = supabase.table("jobs").select("status").eq("user_id", user_id).execute()
        
        jobs_applied = 0
        interviews = 0
        offers = 0
        
        for job in jobs_response.data:
            if job["status"] == "Applied":
                jobs_applied += 1
            elif job["status"] == "Interviewing":
                interviews += 1
            elif job["status"] == "Accepted":
                offers += 1
        
        # Calculate profile statistics
        
        return ProfileStats(
            jobs_applied=jobs_applied,
            interviews=interviews,
            offers=offers
        )
    except Exception as e:
        print(f"Error getting profile stats: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to get profile stats: {str(e)}")

@app.delete("/api/profile")
def delete_profile(user_id: str = Depends(get_current_user)):
    """Delete user profile and all associated data"""
    try:
        # Delete all user jobs first
        jobs_response = supabase.table("jobs").delete().eq("user_id", user_id).execute()
        
        # Delete user profile
        profile_response = supabase.table("user_profile").delete().eq("user_id", user_id).execute()
        
        # Delete the user from auth.users table using admin API
        try:
            auth_response = supabase.auth.admin.delete_user(user_id)
            print(f"Successfully deleted user {user_id} from auth.users")
        except Exception as auth_error:
            print(f"Failed to delete user from auth.users: {str(auth_error)}")
            # Continue with profile deletion even if auth deletion fails
        
        print(f"Deleted profile and data for user {user_id}")
        print(f"  Profile records deleted: {len(profile_response.data) if profile_response.data else 0}")
        print(f"  Job records deleted: {len(jobs_response.data) if jobs_response.data else 0}")
        
        return {"success": True, "message": "Account and all associated data deleted successfully"}
    except Exception as e:
        print(f"Error deleting profile: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to delete profile: {str(e)}")

# ============================================================================
# SKILLS API ENDPOINTS - OLD (COMMENTED OUT - USING CONSOLIDATED user_profile TABLE)
# ============================================================================

# @app.get("/api/skills", response_model=List[Skill])
# def get_skills(user_id: str = Depends(get_current_user)):
#     """Get user skills"""
#     try:
#         response = supabase.table("skills").select("*").eq("user_id", user_id).execute()
#         return response.data
#     except Exception as e:
#         print(f"Error getting skills: {str(e)}")
#         raise HTTPException(status_code=400, detail=f"Failed to get skills: {str(e)}")

# @app.post("/api/skills/add", response_model=Skill)
# def add_skill(skill_data: CreateSkill, user_id: str = Depends(get_current_user)):
#     """Add new skill"""
#     try:
#         data = jsonable_encoder(skill_data, exclude_unset=True)
#         data["user_id"] = user_id
#         
#         response = supabase.table("skills").insert(data).execute()
#         if response.data:
#             return response.data[0]
#         raise HTTPException(status_code=400, detail="Skill creation failed")
#     except Exception as e:
#         print(f"Error adding skill: {str(e)}")
#         raise HTTPException(status_code=400, detail=f"Skill creation failed: {str(e)}")

# @app.put("/api/skills/{skill_id}/update", response_model=Skill)
# def update_skill(skill_id: UUID, skill_data: UpdateSkill, user_id: str = Depends(get_current_user)):
#     """Update skill"""
#     try:
#         data = jsonable_encoder(skill_data, exclude_unset=True)
#         data["updated_at"] = datetime.utcnow().isoformat()
#         
#         response = supabase.table("skills").update(data).eq("id", str(skill_id)).eq("user_id", user_id).execute()
#         if response.data:
#             return response.data[0]
#         raise HTTPException(status_code=404, detail="Skill not found")
#     except Exception as e:
#         print(f"Error updating skill: {str(e)}")
#         raise HTTPException(status_code=400, detail=f"Skill update failed: {str(e)}")


@app.get("/api/skills/suggestions")
def get_skill_suggestions():
    """Get AI skill suggestions"""
    # Common skills for job seekers
    suggestions = [
        "JavaScript", "Python", "React", "Node.js", "SQL", "Git", "AWS", "Docker",
        "TypeScript", "Java", "C++", "HTML/CSS", "MongoDB", "PostgreSQL", "Redis",
        "Kubernetes", "Jenkins", "Jira", "Agile", "Scrum", "Machine Learning",
        "Data Analysis", "Project Management", "Leadership", "Communication",
        "Problem Solving", "Critical Thinking", "Teamwork", "Time Management"
    ]
    return suggestions

# ============================================================================
# EXPERIENCE API ENDPOINTS - OLD (COMMENTED OUT - USING CONSOLIDATED user_profile TABLE)
# ============================================================================

# @app.get("/api/experience", response_model=List[WorkExperience])
# def get_experience(user_id: str = Depends(get_current_user)):
#     """Get work experience"""
#     try:
#         response = supabase.table("work_experience").select("*").eq("user_id", user_id).order("start_date", desc=True).execute()
#         return response.data
#     except Exception as e:
#         print(f"Error getting experience: {str(e)}")
#         raise HTTPException(status_code=400, detail=f"Failed to get experience: {str(e)}")

# @app.post("/api/experience/add", response_model=List[WorkExperience])
# def add_experience(experience_data: CreateExperience, user_id: str = Depends(get_current_user)):
#     """Add work experience"""
#     try:
#         data = jsonable_encoder(experience_data, exclude_unset=True)
#         data["user_id"] = user_id
#         
#         response = supabase.table("work_experience").insert(data).execute()
#         if response.data:
#             return response.data[0]
#         raise HTTPException(status_code=400, detail="Experience creation failed")
#     except Exception as e:
#         print(f"Error adding experience: {str(e)}")
#         raise HTTPException(status_code=400, detail=f"Experience creation failed: {str(e)}")


# ============================================================================
# EDUCATION API ENDPOINTS
# ============================================================================

# These endpoints are now handled by the consolidated user_profile table endpoints above
# Keeping them commented out to avoid conflicts
# @app.get("/api/education", response_model=List[Education])
# def get_education(user_id: str = Depends(get_current_user)):
#     """Get education"""
#     try:
#         response = supabase.table("education").select("*").eq("user_id", user_id).order("start_date", desc=True).execute()
#         return response.data
#     except Exception as e:
#         print(f"Error getting education: {str(e)}")
#         raise HTTPException(status_code=400, detail=f"Failed to get education: {str(e)}")

# @app.post("/api/education/add", response_model=Education)
# def add_education(education_data: CreateEducation, user_id: str = Depends(get_current_user)):
#     """Add education"""
#     try:
#         data = jsonable_encoder(education_data, exclude_unset=True)
#         data["user_id"] = user_id
#         
#         response = supabase.table("education").insert(data).execute()
#         if response.data:
#             return response.data[0]
#         raise HTTPException(status_code=400, detail="Education creation failed")
#     except Exception as e:
#         print(f"Error adding education: {str(e)}")
#         raise HTTPException(status_code=400, detail=f"Education creation failed: {str(e)}")


# Resume upload endpoints removed - using AI-generated resumes instead

# ============================================================================
# JOB API ENDPOINTS (EXISTING)
# ============================================================================

@app.post("/jobs", response_model=Job)
def create_job(job: CreateJob, user_id: str = Depends(get_current_user)):
    data = jsonable_encoder(job, exclude_unset=True)
    data["user_id"] = user_id
    response = supabase.table("jobs").insert(data).execute()
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=400, detail="Job creation failed")

@app.post("/api/jobs", response_model=Job)
def create_job_api(job: CreateJob, user_id: str = Depends(get_current_user)):
    """API endpoint for creating jobs"""
    try:
        data = jsonable_encoder(job, exclude_unset=True)
        data["user_id"] = user_id
        
        print(f"Creating job with data: {data}")  # Debug log
        response = supabase.table("jobs").insert(data).execute()
        print(f"Supabase response: {response.data}")  # Debug log
        
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Job creation failed")
    except Exception as e:
        print(f"Error creating job: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Job creation failed: {str(e)}")

@app.get("/api/jobs", response_model=List[Job])
def get_jobs_api(user_id: str = Depends(get_current_user)):
    """Get all jobs for the authenticated user"""
    try:
        response = supabase.table("jobs").select("*").eq("user_id", user_id).execute()
        return response.data
    except Exception as e:
        print(f"Error getting jobs: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Failed to get jobs: {str(e)}")

@app.get("/api/jobs/{job_id}", response_model=Job)
def get_job_api(job_id: UUID, user_id: str = Depends(get_current_user)):
    """Get a specific job by ID for the authenticated user"""
    try:
        response = supabase.table("jobs").select("*").eq("id", str(job_id)).eq("user_id", user_id).execute()
        
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Job not found")
    except Exception as e:
        print(f"Error getting job: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Failed to get job: {str(e)}")

@app.put("/api/jobs/{job_id}", response_model=Job)
def update_job_api(job_id: UUID, job: UpdateJob, user_id: str = Depends(get_current_user)):
    """Update a job by ID for the authenticated user"""
    try:
        data = jsonable_encoder(job, exclude_unset=True)
        
        # Ensure we're only updating the current user's job
        response = supabase.table("jobs").update(data).eq("id", str(job_id)).eq("user_id", user_id).execute()
        
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Job not found")
    except Exception as e:
        print(f"Error updating job: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Job update failed: {str(e)}")

@app.delete("/api/jobs/{job_id}")
def delete_job_api(job_id: UUID, user_id: str = Depends(get_current_user)):
    """Delete a job by ID for the authenticated user"""
    try:
        response = supabase.table("jobs").delete().eq("id", str(job_id)).eq("user_id", user_id).execute()
        
        if response.data:
            return {"success": True, "message": "Job deleted successfully"}
        raise HTTPException(status_code=404, detail="Job not found")
    except Exception as e:
        print(f"Error deleting job: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Job deletion failed: {str(e)}")

@app.post("/api/jobs-test")
def create_job_api_test(job: CreateJob):
    """Test API endpoint without authentication - creates job without user_id"""
    try:
        # Create job data without user_id to bypass foreign key constraint
        data = jsonable_encoder(job, exclude_unset=True)
        # Remove user_id from data to avoid foreign key constraint
        if "user_id" in data:
            del data["user_id"]
        
        print(f"Creating job with data: {data}")  # Debug log
        response = supabase.table("jobs").insert(data).execute()
        print(f"Supabase response: {response.data}")  # Debug log
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Job creation failed")
    except Exception as e:
        print(f"Error creating job: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Job creation failed: {str(e)}")

@app.get("/api/jobs-test")
def get_jobs_test():
    """Test API endpoint without authentication - gets all jobs"""
    try:
        response = supabase.table("jobs").select("*").execute()
        print(f"Retrieved jobs: {response.data}")  # Debug log
        return response.data
    except Exception as e:
        print(f"Error getting jobs: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Failed to get jobs: {str(e)}")

@app.put("/api/jobs-test/{job_id}")
def update_job_test(job_id: UUID, job: UpdateJob):
    """Test API endpoint without authentication - updates a job"""
    try:
        print(f"Received update request for job {job_id}")
        print(f"Raw job data: {job}")
        print(f"Job status: {job.status}")
        print(f"Job status type: {type(job.status)}")
        
        data = jsonable_encoder(job, exclude_unset=True)
        print(f"Encoded data: {data}")
        
        # Remove user_id from data to avoid foreign key constraint
        if "user_id" in data:
            del data["user_id"]
        
        print(f"Final update data: {data}")  # Debug log
        response = supabase.table("jobs").update(data).eq("id", str(job_id)).execute()
        print(f"Update response: {response.data}")  # Debug log
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Job not found")
    except Exception as e:
        print(f"Error updating job: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Job update failed: {str(e)}")

@app.delete("/api/jobs-test/{job_id}")
def delete_job_test(job_id: UUID):
    """Test API endpoint without authentication - deletes a job"""
    try:
        print(f"Deleting job {job_id}")  # Debug log
        response = supabase.table("jobs").delete().eq("id", str(job_id)).execute()
        print(f"Delete response: {response.data}")  # Debug log
        if response.data:
            return {"success": True}
        raise HTTPException(status_code=404, detail="Job not found")
    except Exception as e:
        print(f"Error deleting job: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Job deletion failed: {str(e)}")

@app.get("/jobs", response_model=List[Job])
def get_jobs(user_id: str = Depends(get_current_user)):
    response = supabase.table("jobs").select("*").eq("user_id", str(user_id)).execute()
    return response.data

@app.get("/jobs/{job_id}", response_model=Job)
def get_job(job_id: UUID, user_id: str = Depends(get_current_user)):
    response = supabase.table("jobs").select("*").eq("id", str(job_id)).eq("user_id", str(user_id)).single().execute()
    if response.data:
        return response.data
    raise HTTPException(status_code=404, detail="Job not found")

@app.put("/jobs/{job_id}", response_model=Job)
def update_job(job_id: UUID, job: Job, user_id: str = Depends(get_current_user)):
    data = jsonable_encoder(job, exclude_unset=True)
    response = supabase.table("jobs").update(data).eq("id", str(job_id)).eq("user_id", str(user_id)).execute()
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=400, detail="Job update failed")

@app.delete("/jobs/{job_id}")
def delete_job(job_id: UUID, user_id: str = Depends(get_current_user)):
    response = supabase.table("jobs").delete().eq("id", str(job_id)).eq("user_id", str(user_id)).execute()
    if response.data:
        return {"success": True}
    raise HTTPException(status_code=404, detail="Job not found")

# ============================================================================
# JOB INGESTION API ENDPOINTS
# ============================================================================

# Job ingestion models
class JobIngestionRequest(BaseModel):
    html: str
    source_url: str
    metadata: Optional[dict] = None

class JobIngestionResponse(BaseModel):
    job_id: str
    status: str
    message: str
    extracted_data: Optional[dict] = None
    is_duplicate: bool = False

# Initialize OpenAI client
def get_openai_client():
    """Get OpenAI client with API key from environment"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    client = openai.OpenAI(api_key=api_key)
    return client

def extract_job_data_with_ai(html: str, source_url: str) -> dict:
    """Extract job data from HTML using OpenAI"""
    try:
        print(f"🤖 AI EXTRACTION: Starting AI job data extraction...")
        print(f"🤖 AI EXTRACTION: Source URL: {source_url}")
        print(f"🤖 AI EXTRACTION: HTML content length: {len(html)}")
        
        # Create a hash for this extraction session
        extraction_id = hashlib.md5(f"{source_url}_{len(html)}".encode()).hexdigest()[:8]
        
        # Save AI extraction start state
        save_state_data(f"ai_extraction_start_{extraction_id}", {
            "source_url": source_url,
            "html_length": len(html),
            "extraction_id": extraction_id
        })
        
        client = get_openai_client()
        print(f"🤖 AI EXTRACTION: OpenAI client initialized")
        
        # Use BeautifulSoup for better HTML parsing
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')
        print(f"🤖 AI EXTRACTION: HTML parsed with BeautifulSoup")
        
        # Remove unwanted elements but keep job content
        for element in soup(['script', 'style', 'nav', 'footer', 'header', 'aside']):
            element.decompose()
        print(f"🤖 AI EXTRACTION: Removed unwanted HTML elements")
        
        # Try to find the main job content area
        job_content = soup.find('main') or soup.find('div', class_=lambda x: x and 'job' in x.lower()) or soup
        print(f"🤖 AI EXTRACTION: Found job content area")
        
        # Get text content with some structure preserved
        text_content = job_content.get_text(separator='\n', strip=True)
        print(f"🤖 AI EXTRACTION: Extracted text content length: {len(text_content)}")
        
        # Save parsed content
        save_cleaned_content(text_content, "ai_extraction", source_url, f"ai_parsed_content_{extraction_id}")
        
        # Extract structured job data first
        job_elements = []
        
        # Look for common job posting selectors with more specific targeting
        title_selectors = [
            'h1[class*="job-title"]',
            'h1[class*="jobs-unified-top-card__job-title"]',
            'h1[class*="jobs-details-top-card__job-title"]',
            '[data-testid*="job-title"]',
            '.job-title',
            '.jobs-unified-top-card__job-title',
            '.jobs-details-top-card__job-title',
            'h1'
        ]
        
        company_selectors = [
            '[data-testid*="company"]',
            '.company-name',
            '.jobs-unified-top-card__company-name',
            '.jobs-details-top-card__company-name',
            'a[class*="company"]'
        ]
        
        location_selectors = [
            '[data-testid*="location"]',
            '.job-location',
            '.jobs-unified-top-card__bullet',
            '.jobs-details-top-card__bullet',
            'span[class*="location"]'
        ]
        
        salary_selectors = [
            '[data-testid*="salary"]',
            '[data-testid*="compensation"]',
            '.salary',
            '.compensation',
            '.jobs-unified-top-card__salary',
            '.jobs-details-top-card__salary',
            '.job-details-jobs-unified-top-card__salary',
            '.job-salary',
            '.pay-range',
            '.salary-range',
            '.compensation-range',
            '.job-pay',
            '.wage',
            '.remuneration',
            '.job-details__salary',
            '.jobs-unified-top-card__primary-description',
            '.jobs-unified-top-card__subtitle-primary-grouping',
            '.jobs-details__main-content .salary',
            '.jobs-details__main-content .compensation',
            'span[class*="salary"]',
            'div[class*="salary"]',
            'span[class*="compensation"]',
            'div[class*="compensation"]',
            'span[class*="pay"]',
            'div[class*="pay"]',
            'span[class*="wage"]',
            'div[class*="wage"]'
        ]
        
        # Extract job title
        job_title = "Unknown Job Title"
        for selector in title_selectors:
            elements = soup.select(selector)
            if elements:
                title_text = elements[0].get_text(strip=True)
                if title_text and len(title_text) > 3:  # Valid title
                    job_title = title_text
                    job_elements.append(f"Job Title: {title_text}")
                    break
        
        # Extract company
        company = "Unknown Company"
        for selector in company_selectors:
            elements = soup.select(selector)
            if elements:
                company_text = elements[0].get_text(strip=True)
                if company_text and len(company_text) > 1:  # Valid company
                    company = company_text
                    job_elements.append(f"Company: {company_text}")
                    break
        
        # Extract location
        location = "Unknown Location"
        for selector in location_selectors:
            elements = soup.select(selector)
            if elements:
                location_text = elements[0].get_text(strip=True)
                if location_text and len(location_text) > 2:  # Valid location
                    location = location_text
                    job_elements.append(f"Location: {location_text}")
                    break
        
        # Extract salary
        salary = None
        for selector in salary_selectors:
            elements = soup.select(selector)
            if elements:
                salary_text = elements[0].get_text(strip=True)
                if salary_text and len(salary_text) > 3:  # Valid salary
                    salary = salary_text
                    job_elements.append(f"Salary: {salary_text}")
                    break
        
        # If no salary found via selectors, try regex patterns
        if not salary:
            import re
            salary_regex_patterns = [
                r'\$[\d,]+(?:\.\d{2})?\s*(?:-\s*\$?[\d,]+(?:\.\d{2})?)?\s*(?:per\s+(?:year|month|hour|week))?',
                r'\$[\d,]+(?:\.\d{2})?\s*(?:to\s*\$?[\d,]+(?:\.\d{2})?)?\s*(?:per\s+(?:year|month|hour|week))?',
                r'\$[\d,]+(?:\.\d{2})?\s*(?:-\s*\$?[\d,]+(?:\.\d{2})?)?\s*(?:annually|monthly|hourly|weekly)',
                r'\$[\d,]+(?:\.\d{2})?\s*(?:to\s*\$?[\d,]+(?:\.\d{2})?)?\s*(?:annually|monthly|hourly|weekly)',
                r'(?:salary|pay|compensation|wage):\s*\$?[\d,]+(?:\.\d{2})?(?:\s*-\s*\$?[\d,]+(?:\.\d{2})?)?',
                r'\$[\d,]+(?:\.\d{2})?\s*(?:k|K)\s*(?:per\s+(?:year|month|hour|week))?',
                r'\$[\d,]+(?:\.\d{2})?\s*(?:k|K)\s*(?:annually|monthly|hourly|weekly)'
            ]
            
            for pattern in salary_regex_patterns:
                matches = re.findall(pattern, text_content, re.IGNORECASE)
                if matches:
                    # Find the most complete salary match
                    best_match = None
                    for match in matches:
                        if '$' in match and any(keyword in match.lower() for keyword in ['per', 'annually', 'monthly', 'hourly', 'weekly', 'k']):
                            best_match = match
                            break
                    
                    if best_match:
                        salary = best_match.strip()
                        job_elements.append(f"Salary: {salary}")
                        print(f"🤖 AI EXTRACTION: Found salary via regex: {salary}")
                        break
        
        # Get job description - look for the main description area
        description_selectors = [
            '.jobs-description-content__text',
            '.jobs-box__html-content',
            '.jobs-details__main-content',
            '[data-testid*="job-details"]',
            '.job-description',
            '.description'
        ]
        
        job_description = ""
        for selector in description_selectors:
            elements = soup.select(selector)
            if elements:
                desc_text = elements[0].get_text(separator='\n', strip=True)
                if desc_text and len(desc_text) > 50:  # Valid description
                    job_description = desc_text
                    job_elements.append(f"Description: {desc_text[:200]}...")
                    break
        
        # Combine structured elements with focused text content
        # Only use the first 5000 characters of the full text to avoid noise
        focused_text = text_content[:5000] if text_content else ""
        combined_content = '\n'.join(job_elements) + '\n\n' + focused_text
        print(f"🤖 AI EXTRACTION: Combined content length: {len(combined_content)}")
        
        # Save combined content for AI
        save_cleaned_content(combined_content, "ai_extraction", source_url, f"ai_combined_content_{extraction_id}")
        
        # Save AI extraction preparation state
        save_state_data(f"ai_extraction_prepared_{extraction_id}", {
            "extraction_id": extraction_id,
            "text_content_length": len(text_content),
            "combined_content_length": len(combined_content),
            "job_elements_found": job_elements
        })
        
        print(f"🤖 AI EXTRACTION: Sending content to OpenAI GPT-4...")
        
        prompt = f"""
        You are an expert at extracting job information from LinkedIn job postings. 
        
        IMPORTANT: The content below has been pre-processed to focus on job-related information. 
        Use the structured data provided and enhance it with additional details from the content.
        
        PRE-EXTRACTED DATA:
        Job Title: {job_title}
        Company: {company}
        Location: {location}
        Salary: {salary if salary else "Not specified"}
        Description: {job_description[:300] + "..." if len(job_description) > 300 else job_description}
        
        Return ONLY a valid JSON object with this structure:
        {{
            "job_title": "string - use the pre-extracted title or extract from content",
            "company": "string - use the pre-extracted company or extract from content", 
            "location": "string - use the pre-extracted location or extract from content",
            "salary": "string or null - use the pre-extracted salary or extract from content",
            "description": "string - use the pre-extracted description or extract from content",
            "job_type": "string (e.g., Full-time, Part-time, Contract) - extract from content",
            "experience_level": "string (e.g., Entry level, Mid-level, Senior) - extract from content",
            "remote_work": "boolean - true if remote work is mentioned",
            "benefits": "array of strings - benefits mentioned in content",
            "requirements": "array of strings - job requirements from content",
            "skills": "array of strings - required skills from content"
        }}
        
        CONTENT TO ANALYZE (focused job content):
        {combined_content}
        
        SOURCE URL: {source_url}
        
        EXTRACTION RULES:
        1. Use the pre-extracted data as your primary source
        2. Enhance with additional details from the content
        3. Look for job type, experience level, remote work, benefits, requirements, and skills
        4. For salary: Look for patterns like "$50,000 - $70,000 per year", "$60k annually", "Salary: $45,000", etc.
        5. If content appears to be a login page or not a job posting, return all fields as "Unknown"
        6. Return ONLY valid JSON, no other text
        7. Focus on the job posting content, ignore navigation elements
        8. Pay special attention to salary information in job descriptions and requirements sections
        
        Return the JSON object now:
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert at extracting job information from HTML. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.1
        )
        
        print(f"🤖 AI EXTRACTION: OpenAI API call completed")
        
        # Save AI API call state
        save_state_data(f"ai_api_call_{extraction_id}", {
            "extraction_id": extraction_id,
            "model": "gpt-4o-mini",
            "max_tokens": 2000,
            "temperature": 0.1,
            "prompt_length": len(prompt)
        })
        
        # Parse the response
        content = response.choices[0].message.content.strip()
        print(f"🤖 AI EXTRACTION: OpenAI raw response: {content}")
        
        # Save AI response
        save_cleaned_content(content, "ai_extraction", source_url, f"ai_response_{extraction_id}")
        
        # Extract JSON from response (in case there's extra text)
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            import json
            extracted_data = json.loads(json_match.group())
            print(f"🤖 AI EXTRACTION: Successfully parsed JSON data: {extracted_data}")
            
            # Save successful extraction result
            save_state_data(f"ai_extraction_success_{extraction_id}", {
                "extraction_id": extraction_id,
                "extracted_data": extracted_data,
                "success": True
            })
            
            return extracted_data
        else:
            print(f"❌ AI EXTRACTION: No JSON found in OpenAI response")
            
            # Save failed extraction result
            save_state_data(f"ai_extraction_failed_{extraction_id}", {
                "extraction_id": extraction_id,
                "raw_response": content,
                "error": "No JSON found in OpenAI response",
                "success": False
            })
            
            raise ValueError("No JSON found in OpenAI response")
            
    except Exception as e:
        print(f"❌ AI EXTRACTION: OpenAI extraction error: {str(e)}")
        print(f"🤖 AI EXTRACTION: Falling back to basic extraction...")
        
        # Save AI extraction error state
        save_state_data(f"ai_extraction_error_{extraction_id}", {
            "extraction_id": extraction_id,
            "error_type": "Exception",
            "error_message": str(e),
            "falling_back_to_basic": True
        })
        
        # Fallback to basic extraction
        return extract_job_data_basic(html)

def extract_job_data_basic(html: str) -> dict:
    """Basic job data extraction without AI (fallback)"""
    print(f"🔧 BASIC EXTRACTION: Starting basic job data extraction...")
    import re
    
    # Create extraction ID for basic extraction
    basic_extraction_id = hashlib.md5(f"basic_{len(html)}".encode()).hexdigest()[:8]
    
    # Save basic extraction start state
    save_state_data(f"basic_extraction_start_{basic_extraction_id}", {
        "extraction_id": basic_extraction_id,
        "html_length": len(html),
        "extraction_type": "basic"
    })
    
    # More comprehensive regex patterns for LinkedIn job postings
    title_patterns = [
        r'<h1[^>]*class="[^"]*job-title[^"]*"[^>]*>(.*?)</h1>',
        r'<h1[^>]*class="[^"]*jobs-unified-top-card__job-title[^"]*"[^>]*>(.*?)</h1>',
        r'<h1[^>]*class="[^"]*jobs-details-top-card__job-title[^"]*"[^>]*>(.*?)</h1>',
        r'<h1[^>]*>(.*?)</h1>'
    ]
    print(f"🔧 BASIC EXTRACTION: Using {len(title_patterns)} title patterns")
    
    company_patterns = [
        r'<a[^>]*class="[^"]*company-name[^"]*"[^>]*>(.*?)</a>',
        r'<a[^>]*class="[^"]*jobs-unified-top-card__company-name[^"]*"[^>]*>(.*?)</a>',
        r'<a[^>]*class="[^"]*jobs-details-top-card__company-name[^"]*"[^>]*>(.*?)</a>'
    ]
    
    location_patterns = [
        r'<span[^>]*class="[^"]*location[^"]*"[^>]*>(.*?)</span>',
        r'<span[^>]*class="[^"]*jobs-unified-top-card__bullet[^"]*"[^>]*>(.*?)</span>',
        r'<span[^>]*class="[^"]*jobs-details-top-card__bullet[^"]*"[^>]*>(.*?)</span>'
    ]
    
    def clean_text(text):
        if not text:
            return None
        return re.sub(r'<[^>]+>', '', text).strip()
    
    def extract_with_patterns(patterns):
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
            if match:
                return clean_text(match.group(1))
        return None
    
    # Extract job title
    print(f"🔧 BASIC EXTRACTION: Extracting job title...")
    job_title = extract_with_patterns(title_patterns)
    if not job_title:
        # Fallback: look for any h1 tag
        h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
        job_title = clean_text(h1_match.group(1)) if h1_match else "Unknown Job Title"
    print(f"🔧 BASIC EXTRACTION: Job title found: {job_title}")
    
    # Extract company
    print(f"🔧 BASIC EXTRACTION: Extracting company name...")
    company = extract_with_patterns(company_patterns)
    if not company:
        company = "Unknown Company"
    print(f"🔧 BASIC EXTRACTION: Company found: {company}")
    
    # Extract location
    print(f"🔧 BASIC EXTRACTION: Extracting location...")
    location = extract_with_patterns(location_patterns)
    print(f"🔧 BASIC EXTRACTION: Location found: {location}")
    
    print(f"🔧 BASIC EXTRACTION: Basic extraction complete - Title: {job_title}, Company: {company}, Location: {location}")
    
    # Prepare result data
    result_data = {
        "job_title": job_title,
        "company": company,
        "location": location,
        "salary": None,
        "description": None,
        "job_type": None,
        "experience_level": None,
        "remote_work": False,
        "benefits": [],
        "requirements": [],
        "skills": []
    }
    
    # Save basic extraction result
    save_state_data(f"basic_extraction_result_{basic_extraction_id}", {
        "extraction_id": basic_extraction_id,
        "extracted_data": result_data,
        "success": True
    })
    
    return result_data

def check_duplicate_job(user_id: str, source_url: str) -> bool:
    """Check if job already exists for user"""
    try:
        response = supabase.table("jobs").select("id").eq("user_id", user_id).eq("job_url", source_url).execute()
        is_duplicate = len(response.data) > 0
        return is_duplicate
    except Exception as e:
        print(f"❌ DUPLICATE CHECK: Error checking duplicate: {str(e)}")
        return False

# LinkedIn scraping models
class LinkedInScrapeRequest(BaseModel):
    url: str
    canonical_url: Optional[str] = None
    stage: Optional[str] = "Bookmarked"
    excitement: Optional[int] = 0
    html_content: Optional[str] = None
    fallback_data: Optional[dict] = None

@app.post("/api/debug/scrape-test")
async def debug_scrape_test(request: LinkedInScrapeRequest):
    """Debug endpoint to test scraping without saving to database"""
    try:
        import requests
        from bs4 import BeautifulSoup
        
        # Fetch the LinkedIn page with better headers
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
        
        session = requests.Session()
        session.headers.update(headers)
        response = session.get(request.url, timeout=30)
        response.raise_for_status()
        
        html = response.text
        print(f"Fetched HTML length: {len(html)}")
        
        # Test AI extraction
        ai_data = extract_job_data_with_ai(html, request.url)
        
        return {
            "status": "success",
            "ai_extraction": ai_data,
            "html_length": len(html),
            "url": request.url
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/debug/ai-extraction")
def debug_ai_extraction(request: dict):
    """Debug endpoint to test AI extraction with provided HTML content"""
    try:
        html_content = request.get('html_content', '')
        source_url = request.get('source_url', '')
        
        print(f"🔍 Testing AI extraction with HTML length: {len(html_content)}")
        print(f"📄 Source URL: {source_url}")
        
        # Extract job data using AI
        extracted_data = extract_job_data_with_ai(html_content, source_url)
        
        print(f"🤖 AI extracted data: {extracted_data}")
        
        return {
            "status": "success",
            "extracted_data": extracted_data,
            "html_length": len(html_content)
        }
        
    except Exception as e:
        print(f"❌ AI extraction test failed: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/api/jobs/save-job", response_model=JobIngestionResponse)
def save_job_direct(request: LinkedInScrapeRequest, user_id: str = Depends(get_current_user)):
    """Save job data directly from extension without scraping"""
    try:
        # Check for duplicates
        if check_duplicate_job(user_id, request.url):
            return JobIngestionResponse(
                job_id="",
                status="duplicate",
                message="Job already exists in your dashboard",
                is_duplicate=True
            )
        
        # Create job data from the provided information
        job_data = {
            "user_id": user_id,
            "job_title": request.job_title or "Unknown Job Title",
            "company": request.company or "Unknown Company",
            "location": request.location,
            "salary": request.salary,
            "job_url": request.url,
            "status": request.stage,
            "excitement_level": request.excitement,
            "description": request.description
        }
        
        print(f"Saving job data: {job_data}")
        
        # Save to database
        response = supabase.table("jobs").insert(job_data).execute()
        
        if response.data:
            job_id = response.data[0]["id"]
            return JobIngestionResponse(
                job_id=job_id,
                status="success",
                message="Job saved successfully",
                extracted_data=job_data
            )
        else:
            raise Exception("Failed to save job to database")
            
    except Exception as e:
        print(f"Error saving job: {str(e)}")
        return JobIngestionResponse(
            job_id="",
            status="error",
            message=f"Failed to save job: {str(e)}"
        )

@app.post("/api/jobs/scrape-linkedin", response_model=JobIngestionResponse)
def scrape_linkedin_job(request: LinkedInScrapeRequest, background_tasks: BackgroundTasks, user_id: str = Depends(get_current_user)):
    """Scrape LinkedIn job URL using GPT to extract job data"""
    try:
        # Process LinkedIn job scrape request
        
        # Compute effective URL (prefer canonical or derive from currentJobId)
        effective_url = request.url
        try:
            if request.canonical_url:
                effective_url = request.canonical_url
            else:
                from urllib.parse import urlparse, parse_qs
                parsed = urlparse(request.url)
                qs = parse_qs(parsed.query)
                if 'currentJobId' in qs and qs['currentJobId']:
                    jid = qs['currentJobId'][0]
                    effective_url = f"https://www.linkedin.com/jobs/view/{jid}"
        except Exception as _e:
            pass
        # Effective job URL determined

        # Save initial request state
        save_state_data("01_initial_request", {
            "user_id": user_id,
            "job_url": request.url,
            "canonical_url": request.canonical_url,
            "effective_url": effective_url,
            "stage": request.stage,
            "excitement": request.excitement,
            "html_content_length": len(request.html_content) if request.html_content else 0,
            "fallback_data": request.fallback_data
        }, user_id, effective_url)
        
        import requests
        from bs4 import BeautifulSoup
        
        # Check for duplicates
        # Check for duplicate jobs
        if check_duplicate_job(user_id, request.url):
            save_state_data("02_duplicate_found", {
                "user_id": user_id,
                "job_url": request.url,
                "is_duplicate": True
            }, user_id, request.url)
            return JobIngestionResponse(
                job_id="",
                status="duplicate",
                message="Job already exists in your dashboard",
                is_duplicate=True
            )
        # No duplicate found, proceeding with job creation

        # Insert placeholder row immediately
        placeholder_job = {
            "user_id": user_id,
            "job_title": (request.fallback_data or {}).get("job_title") or "Unknown Job Title",
            "company": (request.fallback_data or {}).get("company") or "Unknown Company",
            "location": (request.fallback_data or {}).get("location"),
            "salary": (request.fallback_data or {}).get("salary"),
            "job_url": request.url,
            "status": request.stage,
            "excitement_level": request.excitement,
            "description": (request.fallback_data or {}).get("description"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        insert_resp = supabase.table("jobs").insert(placeholder_job).execute()
        if not insert_resp.data:
            raise HTTPException(status_code=500, detail="Failed to insert placeholder job")
        job_id = insert_resp.data[0]["id"]

        # Background task to perform fetch + extraction and update row
        def enrich_job_background(job_id_local: str, req: LinkedInScrapeRequest, eff_url: str, uid: str):
            try:
                import requests
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'DNT': '1'
                }
                session = requests.Session()
                session.headers.update(headers)
                html = None
                try:
                    r = session.get(eff_url, timeout=25)
                    r.raise_for_status()
                    html = r.text
                    save_html_content(html, uid, eff_url, "fetched_html_bg")
                except Exception:
                    if req.html_content:
                        html = req.html_content
                        save_html_content(html, uid, eff_url, "extension_html_bg")
                if not html:
                    return
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(html, 'html.parser')
                for el in soup(["script","style","nav","footer","header","aside","noscript"]):
                    el.decompose()
                text = soup.get_text(separator='\n', strip=True)
                if len(text) > 20000:
                    text = text[:20000]
                data = extract_job_data_with_ai(text, eff_url)
                update = {
                    "job_title": data.get("job_title") or placeholder_job["job_title"],
                    "company": data.get("company") or placeholder_job["company"],
                    "location": data.get("location"),
                    "salary": data.get("salary"),
                    "description": data.get("description"),
                    "updated_at": datetime.utcnow().isoformat()
                }
                supabase.table("jobs").update(update).eq("id", str(job_id_local)).eq("user_id", uid).execute()
            except Exception as _e:
                print(f"Background enrichment failed for job {job_id_local}: {_e}")

        background_tasks.add_task(enrich_job_background, str(job_id), request, effective_url, user_id)

        return JobIngestionResponse(
            job_id=str(job_id),
            status="success",
            message="Job saved. Enrichment in progress.",
            extracted_data=None,
            is_duplicate=False
        )
            
    except HTTPException as e:
        print(f"❌ STEP 6.29: HTTP Exception raised, re-raising...")
        
        # Save HTTP exception state
        save_state_data("16_http_exception", {
            "error_type": "HTTPException",
            "status_code": e.status_code,
            "detail": e.detail,
            "user_id": user_id,
            "job_url": request.url
        }, user_id, request.url)
        
        raise
    except Exception as e:
        print(f"❌ STEP 6.30: Critical error in LinkedIn scraping: {str(e)}")
        
        # Save critical error state
        save_state_data("17_critical_error", {
            "error_type": "Exception",
            "error_message": str(e),
            "user_id": user_id,
            "job_url": request.url
        }, user_id, request.url)
        
        raise HTTPException(status_code=500, detail=f"LinkedIn scraping failed: {str(e)}")

@app.post("/api/jobs/ingest-html", response_model=JobIngestionResponse)
def ingest_job_html(request: JobIngestionRequest, user_id: str = Depends(get_current_user)):
    """Ingest job from HTML content using AI extraction"""
    try:
        # Check for duplicates
        if check_duplicate_job(user_id, request.source_url):
            return JobIngestionResponse(
                job_id="",
                status="duplicate",
                message="Job already exists in your dashboard",
                is_duplicate=True
            )
        
        # Extract job data using AI
        extracted_data = extract_job_data_with_ai(request.html, request.source_url)
        
        # Create job object with fallback values
        job_data = {
            "user_id": user_id,
            "job_title": extracted_data.get("job_title") or "Unknown Job Title",
            "company": extracted_data.get("company") or "Unknown Company",
            "location": extracted_data.get("location"),
            "salary": extracted_data.get("salary"),
            "job_url": request.source_url,
            "status": "Bookmarked",  # Default status for saved jobs
            "excitement_level": 3,  # Default excitement level
            "description": extracted_data.get("description"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        print(f"Creating job with data: {job_data}")
        
        # Save to database
        response = supabase.table("jobs").insert(job_data).execute()
        
        if response.data:
            job_id = response.data[0]["id"]
            return JobIngestionResponse(
                job_id=str(job_id),
                status="success",
                message="Job saved successfully",
                extracted_data=extracted_data,
                is_duplicate=False
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to save job to database")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Job ingestion error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Job ingestion failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
