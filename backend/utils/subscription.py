"""Subscription utilities for checking user subscription status and feature limits"""
from supabase_client import supabase
from fastapi import HTTPException
from typing import Literal, Optional
from datetime import datetime

SubscriptionTier = Literal['free', 'pro']

# Feature limits
FREE_TIER_LIMITS = {
    'max_resumes': 1,
    'max_jobs_from_extension': 100,
    'job_matcher_enabled': False,
}

PRO_TIER_LIMITS = {
    'max_resumes': 20,
    'max_jobs_from_extension': None,  # Unlimited
    'job_matcher_enabled': True,
}

async def get_user_subscription_tier(user_id: str) -> SubscriptionTier:
    """Get the current subscription tier for a user"""
    try:
        # First check user_profile for quick access
        profile_response = supabase.table("user_profile").select("subscription_tier").eq("user_id", user_id).single().execute()
        
        if profile_response.data and profile_response.data.get("subscription_tier"):
            tier = profile_response.data["subscription_tier"]
            if tier in ['free', 'pro']:
                return tier
        
        # Fallback: check subscriptions table
        sub_response = supabase.table("subscriptions").select("tier, status").eq("user_id", user_id).single().execute()
        
        if sub_response.data:
            subscription = sub_response.data
            # Only return 'pro' if subscription is active
            if subscription.get("status") == "active" and subscription.get("tier") == "pro":
                return "pro"
        
        # Default to free
        return "free"
    except Exception as e:
        print(f"Error getting subscription tier for user {user_id}: {str(e)}")
        # Default to free on error
        return "free"

def get_subscription_limits(tier: SubscriptionTier) -> dict:
    """Get feature limits for a subscription tier"""
    if tier == "pro":
        return PRO_TIER_LIMITS
    return FREE_TIER_LIMITS

async def check_resume_limit(user_id: str) -> tuple[bool, int, int]:
    """
    Check if user can create more resumes
    Returns: (can_create, current_count, max_allowed)
    """
    tier = await get_user_subscription_tier(user_id)
    limits = get_subscription_limits(tier)
    max_resumes = limits['max_resumes']
    
    # Count existing resumes
    try:
        response = supabase.table("resume_builder_data").select("id", count="exact").eq("user_id", user_id).execute()
        current_count = response.count if hasattr(response, 'count') else len(response.data) if response.data else 0
    except Exception as e:
        print(f"Error counting resumes: {str(e)}")
        current_count = 0
    
    can_create = current_count < max_resumes
    return (can_create, current_count, max_resumes)

async def check_job_limit_from_extension(user_id: str) -> tuple[bool, int, Optional[int]]:
    """
    Check if user can save more jobs from extension
    Returns: (can_save, current_count, max_allowed or None for unlimited)
    """
    tier = await get_user_subscription_tier(user_id)
    limits = get_subscription_limits(tier)
    max_jobs = limits['max_jobs_from_extension']
    
    # If unlimited (pro tier), return True
    if max_jobs is None:
        return (True, 0, None)
    
    # Count jobs saved from extension (jobs with job_url containing linkedin.com or from extension)
    try:
        # We'll count all jobs for now, but in the future we could add a source field
        response = supabase.table("jobs").select("id", count="exact").eq("user_id", user_id).execute()
        current_count = response.count if hasattr(response, 'count') else len(response.data) if response.data else 0
    except Exception as e:
        print(f"Error counting jobs: {str(e)}")
        current_count = 0
    
    can_save = current_count < max_jobs
    return (can_save, current_count, max_jobs)

async def check_job_matcher_access(user_id: str) -> bool:
    """Check if user has access to job matcher feature (pro only)"""
    tier = await get_user_subscription_tier(user_id)
    limits = get_subscription_limits(tier)
    return limits['job_matcher_enabled']

async def require_pro_tier(user_id: str, feature_name: str = "This feature") -> None:
    """Raise HTTPException if user is not on pro tier"""
    tier = await get_user_subscription_tier(user_id)
    if tier != "pro":
        raise HTTPException(
            status_code=403,
            detail=f"{feature_name} is only available for Pro subscribers. Please upgrade to access this feature."
        )

async def get_subscription_info(user_id: str) -> dict:
    """Get full subscription information for a user"""
    try:
        sub_response = supabase.table("subscriptions").select("*").eq("user_id", user_id).single().execute()
        
        if sub_response.data:
            subscription = sub_response.data
            tier = subscription.get("tier", "free")
            status = subscription.get("status", "free")
            
            # Only return pro if status is active
            if status == "active" and tier == "pro":
                tier = "pro"
            else:
                tier = "free"
        else:
            tier = "free"
            subscription = None
        
        limits = get_subscription_limits(tier)
        
        # Get current usage
        resume_count = 0
        job_count = 0
        
        try:
            resume_response = supabase.table("resume_builder_data").select("id", count="exact").eq("user_id", user_id).execute()
            resume_count = resume_response.count if hasattr(resume_response, 'count') else len(resume_response.data) if resume_response.data else 0
        except:
            pass
        
        try:
            job_response = supabase.table("jobs").select("id", count="exact").eq("user_id", user_id).execute()
            job_count = job_response.count if hasattr(job_response, 'count') else len(job_response.data) if job_response.data else 0
        except:
            pass
        
        return {
            "tier": tier,
            "status": subscription.get("status", "free") if subscription else "free",
            "limits": limits,
            "usage": {
                "resumes": resume_count,
                "jobs": job_count
            },
            "subscription": subscription
        }
    except Exception as e:
        print(f"Error getting subscription info: {str(e)}")
        # Return free tier info on error
        return {
            "tier": "free",
            "status": "free",
            "limits": FREE_TIER_LIMITS,
            "usage": {
                "resumes": 0,
                "jobs": 0
            },
            "subscription": None
        }










