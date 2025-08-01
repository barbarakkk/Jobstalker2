from pydantic import BaseModel, Field
from typing import Optional
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