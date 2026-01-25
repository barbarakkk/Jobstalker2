"""Theirstack API client for job searching"""
import os
import requests
import json
from typing import Dict, List, Optional, Any, Union

def get_theirstack_api_key() -> str:
    """Get Theirstack API key from environment and strip whitespace"""
    api_key = os.getenv("THEIRSTACK_API_KEY")
    if not api_key:
        raise ValueError("THEIRSTACK_API_KEY not found in environment variables")
    # Strip whitespace - this is critical as spaces can cause 403 errors
    api_key = api_key.strip()
    return api_key

def theirstack_search_jobs(
    posted_at_max_age_days: Optional[int] = None,
    posted_at_gte: Optional[str] = None,
    posted_at_lte: Optional[str] = None,
    job_title_or: Optional[List[str]] = None,
    job_country_code_or: Optional[List[str]] = None,
    job_location_pattern_or: Optional[List[str]] = None,
    remote: Optional[bool] = None,
    min_salary_usd: Optional[Union[int, float]] = None,
    max_salary_usd: Optional[Union[int, float]] = None,
    job_seniority_or: Optional[List[str]] = None,
    job_technology_slug_or: Optional[List[str]] = None,
    employment_statuses_or: Optional[List[str]] = None,
    min_employee_count: Optional[int] = None,
    max_employee_count: Optional[int] = None,
    industry_id_or: Optional[List[int]] = None,
    job_description_contains_or: Optional[List[str]] = None,
    limit: int = 100,
    page: int = 0,
    include_total_results: bool = False
) -> Dict[str, Any]:
    """
    Search jobs using Theirstack API
    
    Args:
        posted_at_max_age_days: Max age of job postings in days (required if no other date filter)
        posted_at_gte: ISO 8601 date string (yyyy-mm-dd) - jobs posted on or after
        posted_at_lte: ISO 8601 date string (yyyy-mm-dd) - jobs posted on or before
        job_title_or: List of job title patterns (natural language, case-insensitive)
        job_country_code_or: List of 2-letter ISO country codes
        job_location_pattern_or: List of regex patterns for locations
        remote: True for remote only, False for non-remote, None for all
        min_salary_usd: Minimum annual salary in USD (number type per API docs)
        max_salary_usd: Maximum annual salary in USD (number type per API docs)
        job_seniority_or: List of seniority levels (c_level, staff, senior, junior, mid_level)
        job_technology_slug_or: List of technology slugs (case-sensitive)
        employment_statuses_or: List of employment types (full_time, part_time, temporary, internship, contract)
        min_employee_count: Minimum company employee count
        max_employee_count: Maximum company employee count
        industry_id_or: List of industry IDs
        job_description_contains_or: List of words to search in job descriptions
        limit: Number of results per page
        page: Page number
        include_total_results: Calculate total results (slows down response)
    
    Returns:
        Dict containing job search results
    """
    api_key = get_theirstack_api_key()
    base_url = "https://api.theirstack.com"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Build request body
    body: Dict[str, Any] = {
        "page": page,
        "limit": limit,
        "include_total_results": include_total_results
    }
    
    # Required: At least one date filter or company filter must be present
    if posted_at_max_age_days is not None:
        body["posted_at_max_age_days"] = posted_at_max_age_days
    elif posted_at_gte:
        body["posted_at_gte"] = posted_at_gte
    elif posted_at_lte:
        body["posted_at_lte"] = posted_at_lte
    else:
        # Default to 30 days if no date filter provided
        body["posted_at_max_age_days"] = 30
    
    # Add optional filters
    if job_title_or:
        body["job_title_or"] = job_title_or
    if job_country_code_or:
        body["job_country_code_or"] = job_country_code_or
    if job_location_pattern_or:
        body["job_location_pattern_or"] = job_location_pattern_or
    if remote is not None:
        body["remote"] = remote
    if min_salary_usd is not None:
        body["min_salary_usd"] = min_salary_usd
    if max_salary_usd is not None:
        body["max_salary_usd"] = max_salary_usd
    if job_seniority_or:
        body["job_seniority_or"] = job_seniority_or
    if job_technology_slug_or:
        body["job_technology_slug_or"] = job_technology_slug_or
    if employment_statuses_or:
        body["employment_statuses_or"] = employment_statuses_or
    if min_employee_count:
        body["min_employee_count"] = min_employee_count
    if max_employee_count:
        body["max_employee_count"] = max_employee_count
    if industry_id_or:
        body["industry_id_or"] = industry_id_or
    if job_description_contains_or:
        body["job_description_contains_or"] = job_description_contains_or
    
    try:
        print(f"🔍 Calling Theirstack API: POST {base_url}/v1/jobs/search")
        print(f"📋 Request body: {json.dumps(body, indent=2)}")
        print(f"🔑 API Key length: {len(api_key)} characters (first 10: {api_key[:10]}...)")
        
        response = requests.post(
            f"{base_url}/v1/jobs/search",
            headers=headers,
            json=body,
            timeout=30
        )
        
        print(f"📡 Response status: {response.status_code}")
        
        if response.status_code == 403:
            error_detail = response.text
            print(f"❌ Full 403 Error Response: {error_detail}")
            print(f"❌ Response Headers: {dict(response.headers)}")
            print(f"❌ Request Headers (Authorization masked): {', '.join([f'{k}: {v[:20]}...' if k == 'Authorization' else f'{k}: {v}' for k, v in headers.items()])}")
            
            raise ValueError(
                f"Theirstack API returned 403 Forbidden.\n"
                f"This usually means:\n"
                f"1. Your API key is invalid or expired\n"
                f"2. Your API key doesn't have permission for this endpoint\n"
                f"3. There may be whitespace in your API key (check backend/.env)\n"
                f"4. Verify your API key in Theirstack dashboard\n"
                f"5. Check if your API key needs to be activated or has usage limits\n\n"
                f"API Response: {error_detail}\n"
                f"API Key length: {len(api_key)} characters\n"
                f"API Key (first 10 chars): {api_key[:10]}...\n"
                f"API Key (last 10 chars): ...{api_key[-10:] if len(api_key) > 10 else api_key}"
            )
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        error_msg = f"Theirstack API HTTP error: {e.response.status_code}"
        if e.response.text:
            error_msg += f" - {e.response.text}"
        print(f"❌ {error_msg}")
        raise ValueError(error_msg) from e
    except requests.exceptions.RequestException as e:
        print(f"❌ Error calling Theirstack API: {str(e)}")
        raise ValueError(f"Failed to connect to Theirstack API: {str(e)}") from e

