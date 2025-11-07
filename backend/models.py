from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID

class Job(BaseModel):
    id: Optional[UUID]
    user_id: UUID
    job_title: str
    company: str
    location: Optional[str] = None
    salary: Optional[str] = None
    job_url: Optional[str] = None
    status: str
    excitement_level: Optional[int] = Field(None, ge=1, le=5)
    date_applied: Optional[date] = None
    deadline: Optional[date] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CreateJob(BaseModel):
    job_title: str
    company: str
    location: Optional[str] = None
    salary: Optional[str] = None
    job_url: Optional[str] = None
    status: str
    excitement_level: Optional[int] = Field(None, ge=1, le=5)
    date_applied: Optional[date] = None
    deadline: Optional[date] = None
    description: Optional[str] = None

class UpdateJob(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    job_url: Optional[str] = None
    status: Optional[str] = None
    excitement_level: Optional[int] = Field(None, ge=1, le=5)
    date_applied: Optional[date] = None
    deadline: Optional[date] = None
    description: Optional[str] = None

# Profile-related models
class Profile(BaseModel):
    id: Optional[UUID]
    user_id: UUID
    full_name: str
    current_role: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    profile_picture_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CreateProfile(BaseModel):
    full_name: str
    current_role: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None

class UpdateProfile(BaseModel):
    full_name: Optional[str] = None
    current_role: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None

class ProfileStats(BaseModel):
    jobs_applied: int
    interviews: int
    offers: int

# Skills models (normalized table)
class Skill(BaseModel):
    id: Optional[UUID]
    user_id: UUID
    name: str
    proficiency: Optional[str] = None  # Beginner, Intermediate, Expert, etc.
    category: Optional[str] = "Technical"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CreateSkill(BaseModel):
    name: str
    proficiency: Optional[str] = None
    category: Optional[str] = "Technical"

class UpdateSkill(BaseModel):
    name: Optional[str] = None
    proficiency: Optional[str] = None
    category: Optional[str] = None

# Experience models (normalized table)
class WorkExperience(BaseModel):
    id: Optional[UUID]
    user_id: UUID
    title: str
    company: str
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CreateExperience(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: bool = False
    description: Optional[str] = None

class UpdateExperience(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    description: Optional[str] = None

# Education models (normalized table)
class Education(BaseModel):
    id: Optional[UUID]
    user_id: UUID
    school: str
    degree: Optional[str] = None
    field: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CreateEducation(BaseModel):
    school: str
    degree: Optional[str] = None
    field: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class UpdateEducation(BaseModel):
    school: Optional[str] = None
    degree: Optional[str] = None
    field: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

# Resume models removed - using AI-generated resumes instead

# Resume Builder Data models
class ResumeBuilderData(BaseModel):
    id: Optional[UUID] = None
    user_id: UUID
    template_id: str
    title: str = "My Resume"
    resume_data: Dict[str, Any]  # JSONB field
    is_current: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SaveResumeRequest(BaseModel):
    template_id: str
    title: Optional[str] = "My Resume"
    resume_data: Dict[str, Any]

class UpdateResumeRequest(BaseModel):
    title: Optional[str] = None
    resume_data: Optional[Dict[str, Any]] = None

class ResumeBuilderItem(BaseModel):
    id: UUID
    template_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    is_current: bool

class SaveResumeResponse(BaseModel):
    id: UUID
    success: bool = True
    message: str = "Resume saved successfully"

# File upload response models
class FileUploadResponse(BaseModel):
    file_url: str
    filename: str
    file_size: int

class ProfilePictureResponse(BaseModel):
    profile_picture_url: str 

class ProfileResponse(BaseModel):
    id: str
    full_name: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    profile_picture_url: Optional[str] = None
    skills: Optional[list] = []
    work_experience: Optional[list] = []
    education: Optional[list] = []
    user_id: str
    created_at: datetime
    updated_at: datetime 
