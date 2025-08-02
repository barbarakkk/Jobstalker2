from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase_client import supabase
from models import Job, CreateJob, UpdateJob
from uuid import UUID
from typing import List, Optional
from fastapi.encoders import jsonable_encoder
import os
import time

app = FastAPI(title="JobStalker API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security middleware for adding security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    
    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response

# Rate limiting middleware (simple implementation)
request_counts = {}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Simple rate limiting middleware"""
    client_ip = request.client.host
    current_time = time.time()
    
    # Clean old entries (older than 1 minute)
    request_counts[client_ip] = [
        req_time for req_time in request_counts.get(client_ip, [])
        if current_time - req_time < 60
    ]
    
    # Add current request
    if client_ip not in request_counts:
        request_counts[client_ip] = []
    request_counts[client_ip].append(current_time)
    
    # Check rate limit (100 requests per minute)
    if len(request_counts[client_ip]) > 100:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Please try again later."}
        )
    
    return await call_next(request)

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
        
        # Log successful authentication (for debugging)
        print(f"Authenticated user: {user_id} ({user_email})")
        
        return user_id
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the specific error for debugging
        print(f"Authentication error: {str(e)}")
        
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

@app.get("/ping")
def ping():
    """Health check endpoint"""
    return {"message": "pong", "status": "healthy", "timestamp": time.time()}

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

@app.get("/cors-test")
def cors_test():
    """Test endpoint to verify CORS is working"""
    return {"message": "CORS is working!", "timestamp": "2024-01-01T00:00:00Z"}

@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle OPTIONS requests for CORS preflight"""
    from fastapi.responses import Response
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

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
        print(f"Getting jobs for user: {user_id}")  # Debug log
        response = supabase.table("jobs").select("*").eq("user_id", user_id).execute()
        print(f"Retrieved jobs: {response.data}")  # Debug log
        return response.data
    except Exception as e:
        print(f"Error getting jobs: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Failed to get jobs: {str(e)}")

@app.get("/api/jobs/{job_id}", response_model=Job)
def get_job_api(job_id: UUID, user_id: str = Depends(get_current_user)):
    """Get a specific job by ID for the authenticated user"""
    try:
        print(f"Getting job {job_id} for user: {user_id}")  # Debug log
        response = supabase.table("jobs").select("*").eq("id", str(job_id)).eq("user_id", user_id).execute()
        print(f"Retrieved job: {response.data}")  # Debug log
        
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Job not found")
    except Exception as e:
        print(f"Error getting job: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Failed to get job: {str(e)}")

@app.put("/api/jobs/{job_id}", response_model=Job)
def update_job_api(job_id: UUID, job: CreateJob, user_id: str = Depends(get_current_user)):
    """Update a job by ID for the authenticated user"""
    try:
        data = jsonable_encoder(job, exclude_unset=True)
        
        print(f"Updating job {job_id} with data: {data}")  # Debug log
        response = supabase.table("jobs").update(data).eq("id", str(job_id)).eq("user_id", user_id).execute()
        print(f"Update response: {response.data}")  # Debug log
        
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
        print(f"Deleting job {job_id} for user: {user_id}")  # Debug log
        response = supabase.table("jobs").delete().eq("id", str(job_id)).eq("user_id", user_id).execute()
        print(f"Delete response: {response.data}")  # Debug log
        
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
        data = jsonable_encoder(job, exclude_unset=True)
        # Remove user_id from data to avoid foreign key constraint
        if "user_id" in data:
            del data["user_id"]
        
        print(f"Updating job {job_id} with data: {data}")  # Debug log
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
