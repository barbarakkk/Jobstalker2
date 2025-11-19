"""Education management routes"""
from fastapi import APIRouter, HTTPException, Depends
from supabase_client import supabase
from models import CreateEducation, UpdateEducation
from utils.dependencies import get_current_user
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

router = APIRouter()

@router.get("/api/education")
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

@router.post("/api/education/add")
def add_education(education_data: CreateEducation, user_id: str = Depends(get_current_user)):
    """Add education to normalized user_education table"""
    try:
        edu_dict = {
            "user_id": user_id,
            "school": education_data.school,
            "degree": education_data.degree,
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

@router.put("/api/education/{education_id}")
def update_education(education_id: str, education_data: UpdateEducation, user_id: str = Depends(get_current_user)):
    """Update education in normalized user_education table"""
    try:
        update_dict = {}
        if education_data.school is not None:
            update_dict["school"] = education_data.school
        if education_data.degree is not None:
            update_dict["degree"] = education_data.degree
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

@router.delete("/api/education/{education_id}")
def delete_education(education_id: str, user_id: str = Depends(get_current_user)):
    """Delete education from normalized user_education table"""
    try:
        response = supabase.table("user_education").delete().eq("id", education_id).eq("user_id", user_id).execute()
        return {"success": True, "message": "Education deleted successfully"}
    except Exception as e:
        print(f"Error deleting education: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to delete education: {str(e)}")

