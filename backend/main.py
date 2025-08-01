from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from supabase_client import supabase
from models import Job, CreateJob
from uuid import UUID
from typing import List, Optional
from fastapi.encoders import jsonable_encoder
import os

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Use Supabase to verify the token
        user = supabase.auth.get_user(token)
        if not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

@app.get("/ping")
def ping():
    return {"message": "pong"}

@app.get("/supabase-test")
def supabase_test():
    try:
        # Example: list all tables (fetch from 'pg_tables')
        response = supabase.table("pg_tables").select("*").limit(1).execute()
        return {"success": True, "data": response.data}
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
