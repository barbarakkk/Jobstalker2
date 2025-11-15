"""AI job extraction routes"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
from supabase_client import supabase
from models import Job
from uuid import UUID
from datetime import datetime
from utils.dependencies import get_current_user
from utils.job_extraction import extract_job_data_with_ai, check_duplicate_job
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

router = APIRouter()

# Job ingestion models
class JobIngestionRequest(BaseModel):
    html: str
    source_url: str
    metadata: Optional[dict] = None

class JobIngestionResponse(BaseModel):
    job_id: str
    status: str
    message: str
    extracted_data: Optional[dict] = None
    is_duplicate: bool = False

class LinkedInScrapeRequest(BaseModel):
    url: str
    canonical_url: Optional[str] = None
    stage: Optional[str] = "Bookmarked"
    excitement: Optional[int] = 0
    html_content: Optional[str] = None
    fallback_data: Optional[dict] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    description: Optional[str] = None

# Debug persistence disabled for production
def save_state_data(state_name: str, data: dict, user_id: str = None, job_url: str = None):
    return None

def save_html_content(html_content: str, user_id: str, job_url: str, stage: str = "raw_html"):
    return None

@router.post("/api/jobs/save-job", response_model=JobIngestionResponse)
def save_job_direct(request: LinkedInScrapeRequest, user_id: str = Depends(get_current_user)):
    """Save job data directly from extension without scraping"""
    try:
        # Check for duplicates
        if check_duplicate_job(user_id, request.url):
            return JobIngestionResponse(
                job_id="",
                status="duplicate",
                message="Job already exists in your dashboard",
                is_duplicate=True
            )
        
        # Create job data from the provided information
        job_data = {
            "user_id": user_id,
            "job_title": request.job_title or "Unknown Job Title",
            "company": request.company or "Unknown Company",
            "location": request.location,
            "salary": request.salary,
            "job_url": request.url,
            "status": request.stage,
            "excitement_level": request.excitement,
            "description": request.description
        }
        
        print(f"Saving job data: {job_data}")
        
        # Save to database
        response = supabase.table("jobs").insert(job_data).execute()
        
        if response.data:
            job_id = response.data[0]["id"]
            return JobIngestionResponse(
                job_id=job_id,
                status="success",
                message="Job saved successfully",
                extracted_data=job_data
            )
        else:
            raise Exception("Failed to save job to database")
            
    except Exception as e:
        print(f"Error saving job: {str(e)}")
        return JobIngestionResponse(
            job_id="",
            status="error",
            message=f"Failed to save job: {str(e)}"
        )

@router.post("/api/jobs/scrape-linkedin", response_model=JobIngestionResponse)
def scrape_linkedin_job(request: LinkedInScrapeRequest, background_tasks: BackgroundTasks, user_id: str = Depends(get_current_user)):
    """Scrape LinkedIn job URL using GPT to extract job data"""
    try:
        # Process LinkedIn job scrape request
        
        # Compute effective URL (prefer canonical or derive from currentJobId)
        effective_url = request.url
        try:
            if request.canonical_url:
                effective_url = request.canonical_url
            else:
                from urllib.parse import urlparse, parse_qs
                parsed = urlparse(request.url)
                qs = parse_qs(parsed.query)
                if 'currentJobId' in qs and qs['currentJobId']:
                    jid = qs['currentJobId'][0]
                    effective_url = f"https://www.linkedin.com/jobs/view/{jid}"
        except Exception as _e:
            pass
        # Effective job URL determined

        # Save initial request state
        save_state_data("01_initial_request", {
            "user_id": user_id,
            "job_url": request.url,
            "canonical_url": request.canonical_url,
            "effective_url": effective_url,
            "stage": request.stage,
            "excitement": request.excitement,
            "html_content_length": len(request.html_content) if request.html_content else 0,
            "fallback_data": request.fallback_data
        }, user_id, effective_url)
        
        import requests
        from bs4 import BeautifulSoup
        
        # Check for duplicates
        # Check for duplicate jobs
        if check_duplicate_job(user_id, request.url):
            save_state_data("02_duplicate_found", {
                "user_id": user_id,
                "job_url": request.url,
                "is_duplicate": True
            }, user_id, request.url)
            return JobIngestionResponse(
                job_id="",
                status="duplicate",
                message="Job already exists in your dashboard",
                is_duplicate=True
            )
        # No duplicate found, proceeding with job creation

        # Insert placeholder row immediately
        placeholder_job = {
            "user_id": user_id,
            "job_title": (request.fallback_data or {}).get("job_title") or "Unknown Job Title",
            "company": (request.fallback_data or {}).get("company") or "Unknown Company",
            "location": (request.fallback_data or {}).get("location"),
            "salary": (request.fallback_data or {}).get("salary"),
            "job_url": request.url,
            "status": request.stage,
            "excitement_level": request.excitement,
            "description": (request.fallback_data or {}).get("description"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        insert_resp = supabase.table("jobs").insert(placeholder_job).execute()
        if not insert_resp.data:
            raise HTTPException(status_code=500, detail="Failed to insert placeholder job")
        job_id = insert_resp.data[0]["id"]

        # Background task to perform fetch + extraction and update row
        def enrich_job_background(job_id_local: str, req: LinkedInScrapeRequest, eff_url: str, uid: str):
            try:
                import requests
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'DNT': '1'
                }
                session = requests.Session()
                session.headers.update(headers)
                html = None
                try:
                    r = session.get(eff_url, timeout=25)
                    r.raise_for_status()
                    html = r.text
                    save_html_content(html, uid, eff_url, "fetched_html_bg")
                except Exception:
                    if req.html_content:
                        html = req.html_content
                        save_html_content(html, uid, eff_url, "extension_html_bg")
                if not html:
                    return
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(html, 'html.parser')
                for el in soup(["script","style","nav","footer","header","aside","noscript"]):
                    el.decompose()
                text = soup.get_text(separator='\n', strip=True)
                if len(text) > 20000:
                    text = text[:20000]
                data = extract_job_data_with_ai(text, eff_url)
                update = {
                    "job_title": data.get("job_title") or placeholder_job["job_title"],
                    "company": data.get("company") or placeholder_job["company"],
                    "location": data.get("location"),
                    "salary": data.get("salary"),
                    "description": data.get("description"),
                    "updated_at": datetime.utcnow().isoformat()
                }
                supabase.table("jobs").update(update).eq("id", str(job_id_local)).eq("user_id", uid).execute()
            except Exception as _e:
                print(f"Background enrichment failed for job {job_id_local}: {_e}")

        background_tasks.add_task(enrich_job_background, str(job_id), request, effective_url, user_id)

        return JobIngestionResponse(
            job_id=str(job_id),
            status="success",
            message="Job saved. Enrichment in progress.",
            extracted_data=None,
            is_duplicate=False
        )
            
    except HTTPException as e:
        print(f"❌ STEP 6.29: HTTP Exception raised, re-raising...")
        
        # Save HTTP exception state
        save_state_data("16_http_exception", {
            "error_type": "HTTPException",
            "status_code": e.status_code,
            "detail": e.detail,
            "user_id": user_id,
            "job_url": request.url
        }, user_id, request.url)
        
        raise
    except Exception as e:
        print(f"❌ STEP 6.30: Critical error in LinkedIn scraping: {str(e)}")
        
        # Save critical error state
        save_state_data("17_critical_error", {
            "error_type": "Exception",
            "error_message": str(e),
            "user_id": user_id,
            "job_url": request.url
        }, user_id, request.url)
        
        raise HTTPException(status_code=500, detail=f"LinkedIn scraping failed: {str(e)}")

@router.post("/api/jobs/ingest-html", response_model=JobIngestionResponse)
def ingest_job_html(request: JobIngestionRequest, user_id: str = Depends(get_current_user)):
    """Ingest job from HTML content using AI extraction"""
    try:
        # Check for duplicates
        if check_duplicate_job(user_id, request.source_url):
            return JobIngestionResponse(
                job_id="",
                status="duplicate",
                message="Job already exists in your dashboard",
                is_duplicate=True
            )
        
        # Extract job data using AI
        extracted_data = extract_job_data_with_ai(request.html, request.source_url)
        
        # Create job from extracted data
        job_data = {
            "user_id": user_id,
            "job_title": extracted_data.get("job_title", "Unknown Job Title"),
            "company": extracted_data.get("company", "Unknown Company"),
            "location": extracted_data.get("location"),
            "salary": extracted_data.get("salary"),
            "job_url": request.source_url,
            "status": "Bookmarked",
            "description": extracted_data.get("description")
        }
        
        # Save to database
        response = supabase.table("jobs").insert(job_data).execute()
        
        if response.data:
            job_id = response.data[0]["id"]
            return JobIngestionResponse(
                job_id=job_id,
                status="success",
                message="Job ingested successfully",
                extracted_data=extracted_data
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to save job to database")
            
    except Exception as e:
        print(f"Error ingesting job HTML: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Job ingestion failed: {str(e)}")

