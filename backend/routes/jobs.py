"""Job management routes"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.encoders import jsonable_encoder
from supabase_client import supabase
from models import Job, CreateJob, UpdateJob
from uuid import UUID
from typing import List
from utils.dependencies import get_current_user
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

router = APIRouter()

@router.post("/jobs", response_model=Job)
def create_job(job: CreateJob, user_id: str = Depends(get_current_user)):
    data = jsonable_encoder(job, exclude_unset=True)
    data["user_id"] = user_id
    response = supabase.table("jobs").insert(data).execute()
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=400, detail="Job creation failed")

@router.post("/api/jobs", response_model=Job)
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

@router.get("/api/jobs", response_model=List[Job])
def get_jobs_api(user_id: str = Depends(get_current_user)):
    """Get all jobs for the authenticated user"""
    try:
        response = supabase.table("jobs").select("*").eq("user_id", user_id).execute()
        return response.data
    except Exception as e:
        print(f"Error getting jobs: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=f"Failed to get jobs: {str(e)}")

@router.get("/api/jobs/{job_id}", response_model=Job)
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

@router.put("/api/jobs/{job_id}", response_model=Job)
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

@router.delete("/api/jobs/{job_id}")
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

@router.get("/jobs", response_model=List[Job])
def get_jobs(user_id: str = Depends(get_current_user)):
    response = supabase.table("jobs").select("*").eq("user_id", str(user_id)).execute()
    return response.data

@router.get("/jobs/{job_id}", response_model=Job)
def get_job(job_id: UUID, user_id: str = Depends(get_current_user)):
    response = supabase.table("jobs").select("*").eq("id", str(job_id)).eq("user_id", str(user_id)).single().execute()
    if response.data:
        return response.data
    raise HTTPException(status_code=404, detail="Job not found")

@router.put("/jobs/{job_id}", response_model=Job)
def update_job(job_id: UUID, job: Job, user_id: str = Depends(get_current_user)):
    data = jsonable_encoder(job, exclude_unset=True)
    response = supabase.table("jobs").update(data).eq("id", str(job_id)).eq("user_id", str(user_id)).execute()
    if response.data:
        return response.data[0]
    raise HTTPException(status_code=400, detail="Job update failed")

@router.delete("/jobs/{job_id}")
def delete_job(job_id: UUID, user_id: str = Depends(get_current_user)):
    response = supabase.table("jobs").delete().eq("id", str(job_id)).eq("user_id", str(user_id)).execute()
    if response.data:
        return {"success": True}
    raise HTTPException(status_code=404, detail="Job not found")

