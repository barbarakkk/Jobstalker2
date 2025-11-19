"""Languages management routes"""
from fastapi import APIRouter, HTTPException, Depends
from supabase_client import supabase
from models import CreateLanguage, UpdateLanguage
from utils.dependencies import get_current_user
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

router = APIRouter()

@router.get("/api/languages")
def get_languages(user_id: str = Depends(get_current_user)):
    """Get user languages from normalized user_languages table"""
    try:
        response = supabase.table("user_languages").select("*").eq("user_id", user_id).order("created_at", desc=False).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        print(f"Error getting languages: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to get languages: {str(e)}")

@router.post("/api/languages")
def create_language(language_data: CreateLanguage, user_id: str = Depends(get_current_user)):
    """Add language to normalized user_languages table"""
    try:
        language_dict = {
            "user_id": user_id,
            "language": language_data.language,
            "proficiency": language_data.proficiency
        }
        
        response = supabase.table("user_languages").insert(language_dict).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Failed to add language")
    except Exception as e:
        print(f"Error adding language: {str(e)}")
        # Check if it's a unique constraint violation
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail="Language already exists")
        raise HTTPException(status_code=400, detail=f"Failed to add language: {str(e)}")

@router.put("/api/languages/{language_id}")
def update_language(language_id: str, language_data: UpdateLanguage, user_id: str = Depends(get_current_user)):
    """Update language in normalized user_languages table"""
    try:
        update_dict = {}
        if language_data.language is not None:
            update_dict["language"] = language_data.language
        if language_data.proficiency is not None:
            update_dict["proficiency"] = language_data.proficiency
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        response = supabase.table("user_languages").update(update_dict).eq("id", language_id).eq("user_id", user_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Language not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating language: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to update language: {str(e)}")

@router.delete("/api/languages/{language_id}")
def delete_language(language_id: str, user_id: str = Depends(get_current_user)):
    """Delete language from normalized user_languages table"""
    try:
        response = supabase.table("user_languages").delete().eq("id", language_id).eq("user_id", user_id).execute()
        return {"success": True, "message": "Language deleted successfully"}
    except Exception as e:
        print(f"Error deleting language: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to delete language: {str(e)}")


