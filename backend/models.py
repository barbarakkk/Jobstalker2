from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any, Union
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
    description: Optional[str] = Field(None, max_length=15000)

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
    description: Optional[str] = Field(None, max_length=15000)

# Profile-related models
class Profile(BaseModel):
    id: Optional[UUID]
    user_id: UUID
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    current_role: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    professional_summary: Optional[str] = None
    social_links: Optional[List[Dict[str, str]]] = []
    profile_completed: Optional[bool] = False
    profile_picture_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CreateProfile(BaseModel):
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    current_role: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    professional_summary: Optional[str] = None
    social_links: Optional[List[Dict[str, str]]] = []

class UpdateProfile(BaseModel):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    # email removed - it's managed by auth.users, not user_profile
    phone: Optional[str] = None
    current_role: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    professional_summary: Optional[str] = None
    social_links: Optional[List[Dict[str, str]]] = None
    profile_completed: Optional[bool] = None

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
    
    @model_validator(mode='before')
    @classmethod
    def preprocess_dates(cls, data: Any) -> Any:
        """Preprocess dates before validation - convert empty strings to None."""
        if isinstance(data, dict):
            # Handle start_date
            if 'start_date' in data:
                start_date = data.get('start_date')
                if isinstance(start_date, str):
                    start_date = start_date.strip()
                    if start_date == '' or start_date.lower() == 'mm/dd/yyyy' or len(start_date) < 4:
                        data['start_date'] = None
                    else:
                        try:
                            # Handle ISO format (YYYY-MM-DD)
                            if 'T' in start_date:
                                start_date = start_date.split('T')[0]
                            data['start_date'] = datetime.fromisoformat(start_date).date()
                        except (ValueError, AttributeError):
                            # Try MM/DD/YYYY format
                            try:
                                if '/' in start_date:
                                    parts = start_date.split('/')
                                    if len(parts) == 3:
                                        month, day, year = parts
                                        data['start_date'] = datetime(int(year), int(month), int(day)).date()
                                    else:
                                        data['start_date'] = None
                                else:
                                    data['start_date'] = None
                            except (ValueError, AttributeError):
                                data['start_date'] = None
            
            # Handle end_date - if is_current is True, set to None
            if data.get('is_current', False):
                data['end_date'] = None
            elif 'end_date' in data:
                end_date = data.get('end_date')
                if isinstance(end_date, str):
                    end_date = end_date.strip()
                    if end_date == '' or end_date.lower() == 'mm/dd/yyyy' or len(end_date) < 4:
                        data['end_date'] = None
                    else:
                        try:
                            # Handle ISO format (YYYY-MM-DD)
                            if 'T' in end_date:
                                end_date = end_date.split('T')[0]
                            data['end_date'] = datetime.fromisoformat(end_date).date()
                        except (ValueError, AttributeError):
                            # Try MM/DD/YYYY format
                            try:
                                if '/' in end_date:
                                    parts = end_date.split('/')
                                    if len(parts) == 3:
                                        month, day, year = parts
                                        data['end_date'] = datetime(int(year), int(month), int(day)).date()
                                    else:
                                        data['end_date'] = None
                                else:
                                    data['end_date'] = None
                            except (ValueError, AttributeError):
                                data['end_date'] = None
        
        return data
    
    @model_validator(mode='after')
    def validate_current_position(self):
        """If is_current is True, set end_date to None."""
        if self.is_current:
            self.end_date = None
        return self

class UpdateExperience(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    description: Optional[str] = None
    
    @model_validator(mode='before')
    @classmethod
    def preprocess_dates(cls, data: Any) -> Any:
        """Preprocess dates before validation - convert empty strings to None."""
        if isinstance(data, dict):
            # Handle start_date
            if 'start_date' in data:
                start_date = data.get('start_date')
                if isinstance(start_date, str):
                    start_date = start_date.strip()
                    if start_date == '' or start_date.lower() == 'mm/dd/yyyy' or len(start_date) < 4:
                        data['start_date'] = None
                    else:
                        try:
                            # Handle ISO format (YYYY-MM-DD)
                            if 'T' in start_date:
                                start_date = start_date.split('T')[0]
                            data['start_date'] = datetime.fromisoformat(start_date).date()
                        except (ValueError, AttributeError):
                            # Try MM/DD/YYYY format
                            try:
                                if '/' in start_date:
                                    parts = start_date.split('/')
                                    if len(parts) == 3:
                                        month, day, year = parts
                                        data['start_date'] = datetime(int(year), int(month), int(day)).date()
                                    else:
                                        data['start_date'] = None
                                else:
                                    data['start_date'] = None
                            except (ValueError, AttributeError):
                                data['start_date'] = None
            
            # Handle end_date - if is_current is True, set to None
            if data.get('is_current', False):
                data['end_date'] = None
            elif 'end_date' in data:
                end_date = data.get('end_date')
                if isinstance(end_date, str):
                    end_date = end_date.strip()
                    if end_date == '' or end_date.lower() == 'mm/dd/yyyy' or len(end_date) < 4:
                        data['end_date'] = None
                    else:
                        try:
                            # Handle ISO format (YYYY-MM-DD)
                            if 'T' in end_date:
                                end_date = end_date.split('T')[0]
                            data['end_date'] = datetime.fromisoformat(end_date).date()
                        except (ValueError, AttributeError):
                            # Try MM/DD/YYYY format
                            try:
                                if '/' in end_date:
                                    parts = end_date.split('/')
                                    if len(parts) == 3:
                                        month, day, year = parts
                                        data['end_date'] = datetime(int(year), int(month), int(day)).date()
                                    else:
                                        data['end_date'] = None
                                else:
                                    data['end_date'] = None
                            except (ValueError, AttributeError):
                                data['end_date'] = None
        
        return data
    
    @model_validator(mode='after')
    def validate_current_position(self):
        """If is_current is True, set end_date to None."""
        if self.is_current is True:
            self.end_date = None
        return self

# Education models (normalized table)
class Education(BaseModel):
    id: Optional[UUID]
    user_id: UUID
    school: str
    degree: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CreateEducation(BaseModel):
    school: str
    degree: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class UpdateEducation(BaseModel):
    school: Optional[str] = None
    degree: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

# Language models (normalized table)
class Language(BaseModel):
    id: Optional[UUID]
    user_id: UUID
    language: str
    proficiency: str  # Beginner, Intermediate, Advanced, Native
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CreateLanguage(BaseModel):
    language: str
    proficiency: str  # Beginner, Intermediate, Advanced, Native

class UpdateLanguage(BaseModel):
    language: Optional[str] = None
    proficiency: Optional[str] = None

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
    resume_data: Optional[Dict[str, Any]] = None
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
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    professional_summary: Optional[str] = None
    social_links: Optional[List[Dict[str, str]]] = []
    profile_completed: Optional[bool] = False
    profile_picture_url: Optional[str] = None
    skills: Optional[list] = []
    work_experience: Optional[list] = []
    education: Optional[list] = []
    languages: Optional[list] = []
    user_id: str
    created_at: datetime
    updated_at: datetime 
