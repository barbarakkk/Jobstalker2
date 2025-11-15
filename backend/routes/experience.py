"""Work experience management routes"""
from fastapi import APIRouter, HTTPException, Depends
from supabase_client import supabase
from models import CreateExperience, UpdateExperience
from utils.dependencies import get_current_user
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

router = APIRouter()

@router.get("/api/experience")
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

@router.post("/api/experience/add")
def add_experience(experience_data: CreateExperience, user_id: str = Depends(get_current_user)):
    """Add work experience to normalized user_work_experience table"""
    try:
        # Validate required fields
        if not experience_data.title or not experience_data.title.strip():
            raise HTTPException(status_code=400, detail="Please enter a job title")
        
        if not experience_data.company or not experience_data.company.strip():
            raise HTTPException(status_code=400, detail="Please enter a company name")
        
        exp_dict = {
            "user_id": user_id,
            "title": experience_data.title.strip(),
            "company": experience_data.company.strip(),
            "location": experience_data.location.strip() if experience_data.location else None,
            "start_date": experience_data.start_date.isoformat() if experience_data.start_date else None,
            "end_date": experience_data.end_date.isoformat() if experience_data.end_date else None,
            "is_current": experience_data.is_current,
            "description": experience_data.description.strip() if experience_data.description else None
        }
        
        response = supabase.table("user_work_experience").insert(exp_dict).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Failed to add experience. Please try again.")
    except HTTPException:
        # Re-raise HTTP exceptions as-is (they already have user-friendly messages)
        raise
    except Exception as e:
        # Log technical error to console/terminal
        print(f"❌ Error adding experience (technical): {str(e)}")
        import traceback
        traceback.print_exc()
        # Return user-friendly error message
        raise HTTPException(status_code=400, detail="Failed to add experience. Please check your input and try again.")

@router.put("/api/experience/{experience_id}")
def update_experience(experience_id: str, experience_data: UpdateExperience, user_id: str = Depends(get_current_user)):
    """Update work experience in normalized user_work_experience table"""
    try:
        # Validate required fields if they're being updated
        if experience_data.title is not None and (not experience_data.title or not experience_data.title.strip()):
            raise HTTPException(status_code=400, detail="Please enter a job title")
        
        if experience_data.company is not None and (not experience_data.company or not experience_data.company.strip()):
            raise HTTPException(status_code=400, detail="Please enter a company name")
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
        
        # Strip string fields
        if "title" in update_dict and update_dict["title"]:
            update_dict["title"] = update_dict["title"].strip()
        if "company" in update_dict and update_dict["company"]:
            update_dict["company"] = update_dict["company"].strip()
        if "location" in update_dict and update_dict["location"]:
            update_dict["location"] = update_dict["location"].strip()
        if "description" in update_dict and update_dict["description"]:
            update_dict["description"] = update_dict["description"].strip()
        
        response = supabase.table("user_work_experience").update(update_dict).eq("id", experience_id).eq("user_id", user_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Experience not found")
    except HTTPException:
        # Re-raise HTTP exceptions as-is (they already have user-friendly messages)
        raise
    except Exception as e:
        # Log technical error to console/terminal
        print(f"❌ Error updating experience (technical): {str(e)}")
        import traceback
        traceback.print_exc()
        # Return user-friendly error message
        raise HTTPException(status_code=400, detail="Failed to update experience. Please check your input and try again.")

@router.delete("/api/experience/{experience_id}")
def delete_experience(experience_id: str, user_id: str = Depends(get_current_user)):
    """Delete work experience from normalized user_work_experience table"""
    try:
        response = supabase.table("user_work_experience").delete().eq("id", experience_id).eq("user_id", user_id).execute()
        return {"success": True, "message": "Experience deleted successfully"}
    except Exception as e:
        print(f"Error deleting experience: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to delete experience: {str(e)}")

