"""Skills management routes"""
from fastapi import APIRouter, HTTPException, Depends
from supabase_client import supabase
from models import CreateSkill, UpdateSkill
from utils.dependencies import get_current_user
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

router = APIRouter()

@router.get("/api/skills")
def get_skills(user_id: str = Depends(get_current_user)):
    """Get user skills from normalized user_skills table"""
    try:
        response = supabase.table("user_skills").select("*").eq("user_id", user_id).order("created_at", desc=False).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        print(f"Error getting skills: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to get skills: {str(e)}")

@router.post("/api/skills/add")
def add_skill(skill_data: CreateSkill, user_id: str = Depends(get_current_user)):
    """Add skill to normalized user_skills table"""
    try:
        skill_dict = {
            "user_id": user_id,
            "name": skill_data.name,
            "proficiency": skill_data.proficiency,
            "category": skill_data.category or "Technical"
        }
        
        response = supabase.table("user_skills").insert(skill_dict).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=400, detail="Failed to add skill")
    except Exception as e:
        print(f"Error adding skill: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to add skill: {str(e)}")

@router.put("/api/skills/{skill_id}")
def update_skill(skill_id: str, skill_data: UpdateSkill, user_id: str = Depends(get_current_user)):
    """Update skill in normalized user_skills table"""
    try:
        update_dict = {}
        if skill_data.name is not None:
            update_dict["name"] = skill_data.name
        if skill_data.proficiency is not None:
            update_dict["proficiency"] = skill_data.proficiency
        if skill_data.category is not None:
            update_dict["category"] = skill_data.category
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        response = supabase.table("user_skills").update(update_dict).eq("id", skill_id).eq("user_id", user_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Skill not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating skill: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to update skill: {str(e)}")

@router.delete("/api/skills/{skill_id}")
def delete_skill(skill_id: str, user_id: str = Depends(get_current_user)):
    """Delete skill from normalized user_skills table"""
    try:
        response = supabase.table("user_skills").delete().eq("id", skill_id).eq("user_id", user_id).execute()
        return {"success": True, "message": "Skill deleted successfully"}
    except Exception as e:
        print(f"Error deleting skill: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to delete skill: {str(e)}")

@router.get("/api/skills/suggestions")
def get_skill_suggestions():
    """Get AI skill suggestions"""
    # Common skills for job seekers
    suggestions = [
        "JavaScript", "Python", "React", "Node.js", "SQL", "Git", "AWS", "Docker",
        "TypeScript", "Java", "C++", "HTML/CSS", "MongoDB", "PostgreSQL", "Redis",
        "Kubernetes", "Jenkins", "Jira", "Agile", "Scrum", "Machine Learning",
        "Data Analysis", "Project Management", "Leadership", "Communication",
        "Problem Solving", "Critical Thinking", "Teamwork", "Time Management"
    ]
    return suggestions

