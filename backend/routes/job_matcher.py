"""Job matching preferences routes"""
from fastapi import APIRouter, HTTPException, Depends, Request
from supabase_client import supabase
from models import CreateJobMatchingPreferencesTemp, JobMatchingPreferencesTemp
from utils.dependencies import get_current_user
from utils.theirstack_client import theirstack_search_jobs
from utils.openai_client import get_openai_client
from utils.subscription import get_user_subscription_tier
from utils.currency_converter import convert_to_usd
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import sys
from pathlib import Path
import json
import re
import traceback

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

router = APIRouter()

@router.post("/api/job-matcher/preferences", response_model=dict)
async def save_job_matching_preferences(
    request: Request,
    user_id: str = Depends(get_current_user)
):
    """Save temporary job matching preferences (only location and salary)"""
    try:
        # Get raw JSON body
        request_data = await request.json()
        
        # Handle both camelCase (from frontend) and snake_case formats
        preferred_locations = request_data.get("preferredLocations") or request_data.get("preferred_locations") or []
        min_salary = request_data.get("minSalary") or request_data.get("min_salary")
        salary_currency = request_data.get("salaryCurrency") or request_data.get("salary_currency") or 'USD'
        
        # Set expiration to 24 hours from now
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        # Delete any existing preferences for this user
        try:
            supabase.table("job_matching_preferences_temp").delete().eq("user_id", user_id).execute()
        except Exception as e:
            print(f"Warning: Could not delete existing preferences: {str(e)}")
        
        # Prepare data - only location and salary
        data = {
            "user_id": user_id,
            "preferred_locations": preferred_locations if preferred_locations else [],
            "min_salary": min_salary if min_salary else None,
            "salary_currency": salary_currency if salary_currency else 'USD',
            "expires_at": expires_at.isoformat()
        }
        
        print(f"🔍 Saving job matching preferences for user {user_id}")
        print(f"Locations: {preferred_locations}, Min Salary: {min_salary} {salary_currency}")
        
        # Insert new preferences
        try:
            response = supabase.table("job_matching_preferences_temp").insert(data).execute()
        except Exception as insert_error:
            error_str = str(insert_error)
            print(f"❌ Supabase insert error: {error_str}")
            
            # Check if it's a table not found error
            if "does not exist" in error_str.lower() or "relation" in error_str.lower():
                raise HTTPException(
                    status_code=500,
                    detail="Database table not found. Please run the migration: backend/migrations/create_job_matching_preferences_temp.sql"
                )
            
            # Generic error
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {error_str}"
            )
        
        if response.data and len(response.data) > 0:
            return {"success": True, "data": response.data[0]}
        raise HTTPException(status_code=400, detail="Failed to save preferences")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error saving job matching preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save preferences: {str(e)}")

@router.get("/api/job-matcher/preferences", response_model=dict)
async def get_job_matching_preferences(
    user_id: str = Depends(get_current_user)
):
    """Get current user's temporary job matching preferences"""
    try:
        now = datetime.utcnow().isoformat()
        response = supabase.table("job_matching_preferences_temp")\
            .select("*")\
            .eq("user_id", user_id)\
            .gt("expires_at", now)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        
        if response.data and len(response.data) > 0:
            return {"success": True, "data": response.data[0]}
        return {"success": True, "data": None}
    except Exception as e:
        print(f"Error getting job matching preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get preferences: {str(e)}")

@router.delete("/api/job-matcher/preferences")
async def clear_job_matching_preferences(
    user_id: str = Depends(get_current_user)
):
    """Manually clear user's temporary preferences"""
    try:
        supabase.table("job_matching_preferences_temp").delete().eq("user_id", user_id).execute()
        return {"success": True, "message": "Preferences cleared"}
    except Exception as e:
        print(f"Error clearing job matching preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear preferences: {str(e)}")

# Helper functions
def extract_country_codes_from_locations(locations: List[str]) -> List[str]:
    """Extract ISO country codes from location strings"""
    country_codes = []
    for location in locations:
        location_lower = location.lower()
        # Check for common patterns like "New York, US" or "London, UK"
        if ", us" in location_lower or location_lower.endswith(", usa"):
            country_codes.append("US")
        elif ", uk" in location_lower or location_lower.endswith(", united kingdom"):
            country_codes.append("GB")
        elif ", ca" in location_lower or location_lower.endswith(", canada"):
            country_codes.append("CA")
        # Add more mappings as needed
    return list(set(country_codes)) if country_codes else []

def escape_regex_pattern(pattern: str) -> str:
    """
    Escape special regex characters in location patterns.
    The TheirStack API accepts regex patterns, but for simple location names,
    we want to match them literally. This function escapes special characters
    so "San Francisco" matches literally instead of being interpreted as regex.
    
    However, if the user wants regex functionality, they can still use it.
    """
    import re
    # Escape special regex characters
    # This allows simple location names to work as literal matches
    escaped = re.escape(pattern)
    return escaped

@router.post("/api/ai/job-matcher/search")
async def search_jobs_with_preferences(
    user_id: str = Depends(get_current_user)
):
    """Search for jobs using stored temporary preferences and Theirstack API"""
    try:
        # Get preferences from temp table
        now = datetime.utcnow().isoformat()
        prefs_response = supabase.table("job_matching_preferences_temp")\
            .select("*")\
            .eq("user_id", user_id)\
            .gt("expires_at", now)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        
        if not prefs_response.data or len(prefs_response.data) == 0:
            raise HTTPException(
                status_code=404, 
                detail="No active job matching preferences found. Please set your preferences first."
            )
        
        preferences = prefs_response.data[0]
        
        # Get user subscription tier to determine job limit
        subscription_tier = await get_user_subscription_tier(user_id)
        max_jobs_limit = 10 if subscription_tier == "free" else 20  # Free: 10 jobs, Pro: 20 jobs
        
        # Get user skills from database
        skills_response = supabase.table("user_skills")\
            .select("name")\
            .eq("user_id", user_id)\
            .execute()
        user_skills = [skill.get("name", "") for skill in (skills_response.data or [])]
        
        # Map preferences to Theirstack API parameters
        theirstack_params = {
            "posted_at_max_age_days": 30,  # Required filter - jobs from last 30 days
            "limit": 100,
            "include_total_results": True  # Get total count for first request
        }
        
        # Location
        preferred_locations = preferences.get("preferred_locations", [])
        if preferred_locations:
            # Try to extract country codes
            country_codes = extract_country_codes_from_locations(preferred_locations)
            if country_codes:
                theirstack_params["job_country_code_or"] = country_codes
            # Use location patterns for city/state matching
            # Escape special regex characters so simple location names work as literal matches
            # Users can still use regex if they want by including regex patterns
            escaped_locations = [escape_regex_pattern(loc) for loc in preferred_locations]
            theirstack_params["job_location_pattern_or"] = escaped_locations
        
        # Salary
        min_salary = preferences.get("min_salary")
        salary_currency = preferences.get("salary_currency", "USD")
        if min_salary:
            # Convert to USD if needed
            if salary_currency.upper() == "USD":
                theirstack_params["min_salary_usd"] = min_salary
            else:
                # Convert to USD using currency converter
                converted_salary = convert_to_usd(min_salary, salary_currency)
                if converted_salary is not None:
                    theirstack_params["min_salary_usd"] = int(converted_salary)
                    print(f"💰 Converted {min_salary} {salary_currency} to ${converted_salary:.2f} USD")
                else:
                    # If conversion fails, log warning but still use the original value
                    # (assuming it's already in USD or close enough)
                    print(f"⚠️ Warning: Could not convert {min_salary} {salary_currency} to USD, using as-is")
                    theirstack_params["min_salary_usd"] = min_salary
        
        # Skills in job description (MOST IMPORTANT - this is the primary search criteria)
        if user_skills:
            # Use job_description_contains_or to search for skills in job descriptions
            theirstack_params["job_description_contains_or"] = user_skills[:10]  # Limit to 10 skills
        else:
            raise HTTPException(
                status_code=400,
                detail="No skills found in your profile. Please add skills to your profile first."
            )
        
        # Call Theirstack API
        print(f"🔍 Calling Theirstack API with params: {theirstack_params}")
        theirstack_response = theirstack_search_jobs(**theirstack_params)
        
        # Extract jobs from response
        raw_jobs = theirstack_response.get("data", [])
        metadata = theirstack_response.get("metadata", {})
        total_results = metadata.get("total_results", 0)
        
        if not raw_jobs:
            return {
                "success": True,
                "jobs": [],
                "total_found": 0,
                "matched_count": 0,
                "message": "No jobs found matching your criteria"
            }
        
        # Use AI to rank and filter jobs based on user preferences
        client = get_openai_client()
        
        # Build AI prompt for job matching
        skills_text = ", ".join(user_skills) if user_skills else "None listed"
        locations_text = ", ".join(preferred_locations) if preferred_locations else "Any location"
        
        # Prepare job data for AI (limit to 50 for processing)
        jobs_for_ai = raw_jobs[:50]
        jobs_summary = []
        for job in jobs_for_ai:
            job_summary = {
                "id": job.get("id"),
                "job_title": job.get("job_title"),
                "company": job.get("company_object", {}).get("name") if job.get("company_object") else None,
                "location": ", ".join([loc.get("display_name", "") for loc in job.get("locations", [])]) if job.get("locations") else job.get("location", ""),
                "remote": job.get("remote", False),
                "hybrid": job.get("hybrid", False),
                "salary_string": job.get("salary_string"),
                "min_annual_salary_usd": job.get("min_annual_salary_usd"),
                "max_annual_salary_usd": job.get("max_annual_salary_usd"),
                "seniority": job.get("seniority"),
                "employment_statuses": job.get("employment_statuses", []),
                "technology_slugs": job.get("technology_slugs", []),
                "description": job.get("description", "")[:1000] if job.get("description") else "",  # Limit description length
                "url": job.get("url"),
                "company_size": job.get("company_object", {}).get("employee_count") if job.get("company_object") else None
            }
            jobs_summary.append(job_summary)
        
        ai_prompt = f"""You are an expert job matching assistant. Analyze the following jobs and rank them based on how well they match the candidate's skills, location, and salary preferences.

CANDIDATE PREFERENCES:
- Skills: {skills_text}
- Preferred Locations: {locations_text}
- Minimum Salary: {min_salary} {salary_currency} per year

JOBS FROM THEIRSTACK API:
{json.dumps(jobs_summary, indent=2, default=str)}

INSTRUCTIONS:
1. Analyze each job against the candidate's preferences
2. Calculate a match score (0-100) for each job based on:
   - Skills match - check if job description mentions candidate's skills (50 points)
   - Location match - preferred locations (30 points)
   - Salary match - if job salary meets minimum requirement (20 points)
3. Rank jobs by match score (highest first)
4. Return top {max_jobs_limit} best matches
5. For each job, provide:
   - Match score (0-100)
   - Why it matches (brief explanation, 1-2 sentences)
   - Missing requirements (if any, list key missing skills)

Return ONLY a valid JSON array with this structure:
[
  {{
    "job_id": "original_job_id",
    "job_title": "Job Title",
    "company": "Company Name",
    "location": "Location",
    "remote": true/false,
    "salary": "Salary range if available",
    "url": "Job URL",
    "match_score": 85,
    "match_reason": "Matches because...",
    "missing_requirements": ["requirement1", "requirement2"]
  }}
]

Return ONLY the JSON array, no other text."""

        ai_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert job matching assistant. Always return only valid JSON arrays."},
                {"role": "user", "content": ai_prompt}
            ],
            max_tokens=4000,
            temperature=0.3
        )
        
        content = ai_response.choices[0].message.content.strip()
        
        # Extract JSON from response
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            try:
                matched_jobs = json.loads(json_match.group())
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                matched_jobs = []
        else:
            matched_jobs = []
        
        # If AI didn't return valid results, create basic structure from raw jobs
        if not matched_jobs:
            matched_jobs = [
                {
                    "job_id": job.get("id"),
                    "job_title": job.get("job_title"),
                    "company": job.get("company_object", {}).get("name") if job.get("company_object") else None,
                    "location": ", ".join([loc.get("display_name", "") for loc in job.get("locations", [])]) if job.get("locations") else "",
                    "remote": job.get("remote", False),
                    "salary": job.get("salary_string"),
                    "url": job.get("url"),
                    "match_score": 50,
                    "match_reason": "Job found via Theirstack API",
                    "missing_requirements": []
                }
                for job in raw_jobs[:max_jobs_limit]
            ]
        
        # Ensure we don't return more jobs than the tier limit
        matched_jobs = matched_jobs[:max_jobs_limit]
        
        # Log AI event (optional)
        try:
            supabase.table("ai_events").insert({
                "user_id": user_id,
                "event_type": "job_search",
                "model": "gpt-4o-mini",
                "tokens_used": getattr(ai_response.usage, 'total_tokens', 0) if hasattr(ai_response, 'usage') else 0,
                "metadata": {
                    "jobs_found": len(matched_jobs),
                    "total_results": total_results,
                    "preferences_used": {
                        "skills_count": len(user_skills),
                        "locations": preferred_locations,
                        "min_salary": min_salary
                    }
                }
            }).execute()
        except Exception as e:
            print(f"Warning: Could not log AI event: {str(e)}")
        
        return {
            "success": True,
            "jobs": matched_jobs,
            "total_found": total_results,
            "matched_count": len(matched_jobs),
            "preferences_used": {
                "skills_count": len(user_skills),
                "locations": preferred_locations,
                "min_salary": min_salary
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error searching jobs: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to search jobs: {str(e)}")

