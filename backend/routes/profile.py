"""Profile management routes"""
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from fastapi.encoders import jsonable_encoder
from supabase_client import supabase
from models import ProfileResponse, UpdateProfile, ProfileStats
from datetime import datetime
from utils.dependencies import get_current_user
from utils.file_upload import upload_profile_picture_to_supabase
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

router = APIRouter()

@router.get("/api/profile", response_model=ProfileResponse)
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
        
        # Fetch normalized data (handle case where tables might not exist yet)
        try:
            skills_response = supabase.table("user_skills").select("*").eq("user_id", user_id).execute()
            profile["skills"] = skills_response.data or []
        except Exception as e:
            print(f"Warning: Could not fetch skills: {str(e)}")
            profile["skills"] = []
        
        try:
            experience_response = supabase.table("user_work_experience").select("*").eq("user_id", user_id).execute()
            profile["work_experience"] = experience_response.data or []
        except Exception as e:
            print(f"Warning: Could not fetch work experience: {str(e)}")
            profile["work_experience"] = []
        
        try:
            education_response = supabase.table("user_education").select("*").eq("user_id", user_id).execute()
            profile["education"] = education_response.data or []
        except Exception as e:
            print(f"Warning: Could not fetch education: {str(e)}")
            profile["education"] = []
        
        return ProfileResponse(**profile)
    except Exception as e:
        print(f"Error getting profile: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to get profile: {str(e)}")

@router.post("/api/profile/update", response_model=ProfileResponse)
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

@router.post("/api/profile/picture", response_model=dict)
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

@router.get("/api/profile/stats", response_model=ProfileStats)
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

@router.delete("/api/profile")
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

