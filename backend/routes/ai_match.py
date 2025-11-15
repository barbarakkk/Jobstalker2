"""AI job match analysis routes"""
from fastapi import APIRouter, HTTPException, Depends
from supabase_client import supabase
from uuid import UUID
from utils.dependencies import get_current_user
from utils.openai_client import get_openai_client
import json
import re
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

router = APIRouter()

@router.post("/api/ai/job-match/{job_id}")
async def analyze_job_match(job_id: UUID, user_id: str = Depends(get_current_user)):
    """Analyze how well user's profile matches the job requirements"""
    try:
        # Get job details
        job_response = supabase.table("jobs").select("*").eq("id", str(job_id)).eq("user_id", user_id).single().execute()
        if not job_response.data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job = job_response.data
        job_description = job.get("description", "") or ""
        job_title = job.get("job_title", "")
        company = job.get("company", "")
        
        # Get user profile data
        profile_response = supabase.table("user_profile").select("*").eq("user_id", user_id).execute()
        profile = profile_response.data[0] if profile_response.data else {}
        
        # Get user skills
        skills_response = supabase.table("user_skills").select("*").eq("user_id", user_id).execute()
        user_skills = [s.get("name", "") for s in (skills_response.data or [])]
        
        # Get work experience
        experience_response = supabase.table("user_work_experience").select("*").eq("user_id", user_id).execute()
        work_experience = experience_response.data or []
        
        # Get education
        education_response = supabase.table("user_education").select("*").eq("user_id", user_id).execute()
        education = education_response.data or []
        
        # Prepare user profile summary
        user_profile_summary = f"""
        User Profile:
        - Name: {profile.get('full_name', 'N/A')}
        - Current Role: {profile.get('job_title', 'N/A')}
        - Location: {profile.get('location', 'N/A')}
        
        Skills: {', '.join(user_skills) if user_skills else 'None listed'}
        
        Work Experience ({len(work_experience)} positions):
        {chr(10).join([f"- {exp.get('title', 'N/A')} at {exp.get('company', 'N/A')} ({exp.get('description', 'No description')[:200]})" for exp in work_experience[:5]])}
        
        Education ({len(education)} entries):
        {chr(10).join([f"- {edu.get('degree', 'N/A')} in {edu.get('field_of_study', 'N/A')} from {edu.get('school', 'N/A')}" for edu in education[:3]])}
        """
        
        # Use OpenAI to analyze match
        client = get_openai_client()
        
        prompt = f"""
        Analyze how well this user's profile matches the job requirements.
        
        JOB POSTING:
        Title: {job_title}
        Company: {company}
        Description: {job_description[:2000]}
        
        USER PROFILE:
        {user_profile_summary}
        
        Please provide a detailed analysis in JSON format with the following structure:
        {{
            "matchScore": <number between 0-100>,
            "strengths": [<array of 3-5 strengths where user matches well>],
            "improvements": [<array of 3-5 recommendations for improvement>],
            "missingSkills": [<array of skills mentioned in job but not in user profile>],
            "matchedSkills": [<array of skills that match between job and user profile>]
        }}
        
        Be specific and actionable. Focus on skills, experience, and qualifications.
        Return ONLY valid JSON, no other text.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert career counselor and job matching analyst. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.3
        )
        
        content = response.choices[0].message.content.strip()
        
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            analysis = json.loads(json_match.group())
        else:
            # Fallback if JSON parsing fails
            analysis = {
                "matchScore": 50,
                "strengths": ["Profile analysis in progress"],
                "improvements": ["Complete your profile for better analysis"],
                "missingSkills": [],
                "matchedSkills": []
            }
        
        # Log AI event
        try:
            supabase.table("ai_events").insert({
                "user_id": user_id,
                "event_type": "job_match_analysis",
                "model": "gpt-4o-mini",
                "tokens_used": getattr(response.usage, 'total_tokens', 0) if hasattr(response, 'usage') else 0,
                "metadata": {"job_id": str(job_id)}
            }).execute()
        except Exception as e:
            print(f"Warning: Could not log AI event: {str(e)}")
        
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error analyzing job match: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze job match: {str(e)}")

