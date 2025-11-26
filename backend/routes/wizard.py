from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import os
import json
import openai
import io

from supabase_client import supabase

router = APIRouter()


class CreateSessionRequest(BaseModel):
    templateId: str
    prefill: Optional[bool] = True
    seed: Optional[Dict[str, Any]] = None


class PatchSessionRequest(BaseModel):
    draftPatch: Optional[Dict[str, Any]] = None
    progressPatch: Optional[Dict[str, Any]] = None
    lastStep: Optional[int] = None


class ProfileSummaryRequest(BaseModel):
    wizardSessionId: str
    promptHints: Optional[str] = None


def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    return openai.OpenAI(api_key=api_key)


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    token = authorization.replace("Bearer ", "").strip()
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user_response.user.id
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth error (wizard): {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


def _draft_to_resume_data(draft: Dict[str, Any]) -> Dict[str, Any]:
    """Map draft_json (template-shaped) into ResumeData used by editor."""
    profile = draft.get("profile", {}) or {}
    full_name = (profile.get("fullName") or "").strip()
    first_name = full_name.split(" ")[0] if full_name else ""
    last_name = " ".join(full_name.split(" ")[1:]) if full_name and len(full_name.split(" ")) > 1 else ""
    resume_data = {
        "personalInfo": {
            "firstName": first_name,
            "lastName": last_name,
            "email": profile.get("email") or "",
            "phone": profile.get("phone") or "",
            "location": profile.get("location") or "",
            "jobTitle": profile.get("headline") or "",
            "linkedin": (profile.get("links") or {}).get("linkedin") if isinstance(profile.get("links"), dict) else None,
            "website": (profile.get("links") or {}).get("website") if isinstance(profile.get("links"), dict) else None,
        },
        "summary": profile.get("summary") or "",
        "workExperience": [
            {
                "id": (e.get("id") or f"exp-{idx}"),
                "title": e.get("title") or "",
                "company": e.get("company") or "",
                "location": e.get("location") or "",
                "startDate": e.get("startDate") or "",
                "endDate": e.get("endDate") or "",
                "isCurrent": bool(e.get("isCurrent")),
                "description": e.get("description") or "",
            }
            for idx, e in enumerate(draft.get("experience") or [])
            if isinstance(e, dict)
        ],
        "education": [
            {
                "id": (e.get("id") or f"edu-{idx}"),
                "school": e.get("school") or "",
                "degree": e.get("degree") or "",
                "field": e.get("field") or "",
                "startDate": e.get("startDate") or "",
                "endDate": e.get("endDate") or "",
            }
            for idx, e in enumerate(draft.get("education") or [])
            if isinstance(e, dict)
        ],
        "skills": [
            {
                "id": f"skill-{idx}",
                "name": (s if isinstance(s, str) else s.get("name")) or "",
                "category": (None if isinstance(s, str) else s.get("category") or "Technical"),
            }
            for idx, s in enumerate(draft.get("skills") or [])
        ],
        "languages": [
            {
                "name": l.get("name") or "",
                "proficiency": l.get("proficiency") or "",
            }
            for l in (draft.get("languages") or [])
            if isinstance(l, dict)
        ],
    }
    return resume_data


@router.get("/api/templates")
async def list_templates(_: str = Depends(get_current_user)):
    try:
        res = supabase.table("templates").select("id,name,slug,schema,preview_url,is_active,created_at,updated_at").eq("is_active", True).execute()
        if not res.data:
            return []
        
        # Extract metadata from schema for each template
        templates = []
        for tpl in res.data:
            schema = tpl.get("schema") or {}
            metadata = schema.get("metadata", {})
            
            template_info = {
                "id": tpl["id"],
                "name": tpl["name"],
                "slug": tpl["slug"],
                "preview_url": tpl.get("preview_url"),
                "is_active": tpl.get("is_active", True),
                "created_at": tpl.get("created_at"),
                "updated_at": tpl.get("updated_at"),
                # Extract from schema metadata
                "description": metadata.get("description"),
                "category": metadata.get("category"),
                "badge": metadata.get("badge"),
                "colors": metadata.get("colors", []),
            }
            templates.append(template_info)
        
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list templates: {e}")


@router.get("/api/templates/{template_id}")
async def get_template(template_id: str, _: str = Depends(get_current_user)):
    try:
        # Try by slug first, then by id (UUID)
        res = supabase.table("templates").select("id,name,slug,schema,preview_url,is_active").eq("slug", template_id).maybe_single().execute()
        if not res or not res.data:
            res = supabase.table("templates").select("id,name,slug,schema,preview_url,is_active").eq("id", template_id).maybe_single().execute()
        if not res or not res.data:
            raise HTTPException(status_code=404, detail="Template not found")
        return res.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get template: {e}")


@router.post("/api/wizard/sessions")
async def create_session(body: CreateSessionRequest, user_id: str = Depends(get_current_user)):
    try:
        # Fetch template schema - accept both UUID (id) or slug
        # Try by slug first (most common case from frontend)
        try:
            tpl = supabase.table("templates").select("id,schema").eq("slug", body.templateId).maybe_single().execute()
        except Exception as e:
            print(f"Error querying template by slug '{body.templateId}': {e}")
            tpl = None
        
        if not tpl or not hasattr(tpl, 'data') or not tpl.data:
            # If not found by slug, try by id (UUID)
            try:
                tpl = supabase.table("templates").select("id,schema").eq("id", body.templateId).maybe_single().execute()
            except Exception as e:
                print(f"Error querying template by id '{body.templateId}': {e}")
                tpl = None
        
        if not tpl or not hasattr(tpl, 'data') or not tpl.data:
            print(f"Template '{body.templateId}' not found in database")
            raise HTTPException(status_code=404, detail=f"Template not found: {body.templateId}. Please ensure the template exists in the database.")
        
        template_id_uuid = tpl.data["id"]  # Get the actual UUID
        draft_json = tpl.data["schema"] or {}

        # Prefill from user_profile and normalized tables
        if body.prefill:
            # Fetch all profile fields including first_name, last_name, phone, professional_summary, social_links
            # Use .execute() instead of .maybe_single() to avoid 204 errors (same pattern as profile.py)
            prof = None
            try:
                profile_response = supabase.table("user_profile").select(
                    "full_name,first_name,last_name,phone,job_title,location,professional_summary,social_links"
                ).eq("user_id", user_id).execute()
                
                # Check if data exists (same pattern as profile.py)
                if profile_response.data and len(profile_response.data) > 0:
                    # Create a mock object with .data attribute to match existing code
                    prof = type('obj', (object,), {'data': profile_response.data[0]})()
                else:
                    prof = None
            except Exception as e:
                error_str = str(e)
                # Handle 204 errors specifically - might be PostgREST quirk
                if "204" in error_str or "Missing response" in error_str:
                    # Try again - sometimes 204 is a false negative
                    try:
                        profile_response = supabase.table("user_profile").select(
                            "full_name,first_name,last_name,phone,job_title,location,professional_summary,social_links"
                        ).eq("user_id", user_id).execute()
                        if profile_response.data and len(profile_response.data) > 0:
                            prof = type('obj', (object,), {'data': profile_response.data[0]})()
                        else:
                            prof = None
                    except Exception as retry_error:
                        print(f"Warning: Could not fetch user profile after retry: {str(retry_error)}")
                        prof = None
                else:
                    print(f"Warning: Could not fetch user profile: {error_str}")
                    prof = None
            
            # Fetch from normalized tables in parallel using threading for better performance
            import concurrent.futures
            
            def fetch_skills():
                try:
                    return supabase.table("user_skills").select("*").eq("user_id", user_id).execute()
                except Exception as e:
                    print(f"Warning: Could not fetch skills: {str(e)}")
                    return type('obj', (object,), {'data': []})()
            
            def fetch_experience():
                try:
                    return supabase.table("user_work_experience").select("*").eq("user_id", user_id).execute()
                except Exception as e:
                    print(f"Warning: Could not fetch work experience: {str(e)}")
                    return type('obj', (object,), {'data': []})()
            
            def fetch_education():
                try:
                    return supabase.table("user_education").select("*").eq("user_id", user_id).execute()
                except Exception as e:
                    print(f"Warning: Could not fetch education: {str(e)}")
                    return type('obj', (object,), {'data': []})()
            
            def fetch_languages():
                try:
                    return supabase.table("user_languages").select("*").eq("user_id", user_id).execute()
                except Exception as e:
                    print(f"Warning: Could not fetch languages: {str(e)}")
                    return type('obj', (object,), {'data': []})()
            
            def fetch_user_email():
                try:
                    user_response = supabase.auth.admin.get_user_by_id(user_id)
                    if user_response and user_response.user and user_response.user.email:
                        return user_response.user.email
                    return None
                except Exception as e:
                    print(f"Warning: Could not fetch email from auth.users: {str(e)}")
                    return None
            
            # Execute all queries in parallel
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                skills_future = executor.submit(fetch_skills)
                experience_future = executor.submit(fetch_experience)
                education_future = executor.submit(fetch_education)
                languages_future = executor.submit(fetch_languages)
                email_future = executor.submit(fetch_user_email)
                
                # Wait for all to complete
                skills_res = skills_future.result()
                experience_res = experience_future.result()
                education_res = education_future.result()
                languages_res = languages_future.result()
                user_email = email_future.result()
            
            if prof and hasattr(prof, 'data') and prof.data:
                # Convert normalized data to JSON format for wizard
                skills_list = []
                for skill in ((skills_res.data if skills_res else []) or []):
                    skills_list.append({
                        "name": skill.get("name"),
                        "proficiency": skill.get("proficiency"),
                        "category": skill.get("category", "Technical")
                    })
                
                experience_list = []
                for exp in ((experience_res.data if experience_res else []) or []):
                    experience_list.append({
                        "title": exp.get("title"),
                        "company": exp.get("company"),
                        "location": exp.get("location"),
                        "startDate": exp.get("start_date"),
                        "endDate": exp.get("end_date"),
                        "isCurrent": exp.get("is_current", False),
                        "description": exp.get("description")
                    })
                
                education_list = []
                for edu in ((education_res.data if education_res else []) or []):
                    education_list.append({
                        "school": edu.get("school"),
                        "degree": edu.get("degree"),
                        "field": edu.get("field"),
                        "startDate": edu.get("start_date"),
                        "endDate": edu.get("end_date")
                    })
                
                # Convert languages from user_languages table
                languages_list = []
                for lang in ((languages_res.data if languages_res else []) or []):
                    languages_list.append({
                        "name": lang.get("language"),  # Note: column is "language" not "name"
                        "proficiency": lang.get("proficiency")
                    })
                
                # Build profile map with all fields
                profile_map = {
                    "profile": {
                        "fullName": prof.data.get("full_name"),
                        "firstName": prof.data.get("first_name"),
                        "lastName": prof.data.get("last_name"),
                        "email": user_email,  # From auth.users
                        "phone": prof.data.get("phone"),
                        "headline": prof.data.get("job_title"),
                        "location": prof.data.get("location"),
                        "professionalSummary": prof.data.get("professional_summary"),
                        "summary": prof.data.get("professional_summary"),  # Also map to summary for compatibility
                        "socialLinks": prof.data.get("social_links") or []
                    },
                    "skills": skills_list,
                    "experience": experience_list,
                    "education": education_list,
                    "languages": languages_list
                }
                # Shallow merge where target keys exist
                for k, v in profile_map.items():
                    if v is None:
                        continue
                    if isinstance(draft_json, dict):
                        if k not in draft_json:
                            draft_json[k] = v
                        else:
                            if isinstance(draft_json[k], dict) and isinstance(v, dict):
                                draft_json[k] = {**draft_json[k], **{kk: vv for kk, vv in v.items() if vv is not None}}
                            else:
                                draft_json[k] = v
            elif prof is None:
                # Profile doesn't exist, but that's okay - continue without prefill
                print(f"Warning: No profile found for user {user_id}, continuing without prefill")

        # Apply optional seed
        if body.seed and isinstance(body.seed, dict):
            draft_json = {**draft_json, **body.seed}

        now_iso = datetime.utcnow().isoformat()
        import time
        
        # Insert the session - PostgREST Python client doesn't support .select() after .insert()
        # So we insert without select, then query back immediately
        try:
            # Insert without select - this should work reliably
            result = supabase.table("wizard_sessions").insert({
                "user_id": user_id,
                "template_id": template_id_uuid,
                "draft_json": draft_json,
                "progress": {"step": 1},
                "status": "active",
                "last_step": 1,
                "created_at": now_iso,
                "updated_at": now_iso
            }).execute()
            
            # Try to get ID from response if available
            session_id = None
            if result and hasattr(result, 'data') and result.data and len(result.data) > 0:
                session_id = str(result.data[0]["id"])
                print(f"Insert succeeded with ID from response: {session_id}")
                return {"id": session_id, "draftJson": result.data[0]["draft_json"], "progress": result.data[0]["progress"]}
        except Exception as insert_error:
            error_str = str(insert_error)
            print(f"Insert error (may still have succeeded): {error_str}")
            
            # PostgREST can throw 204 errors even on successful inserts
            if "Missing response" in error_str or "204" in error_str or "Postgrest couldn't retrieve response" in error_str:
                print("PostgREST 204 error detected - insert likely succeeded, will query back")
            else:
                # Check if it's a real error
                if "duplicate key" in error_str.lower() or "unique constraint" in error_str.lower():
                    print(f"Real insert error: {error_str}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to create session: {error_str}"
                    )
                # For other errors, assume it might have succeeded and try to query back
                print(f"Assuming insert succeeded despite error: {error_str}")
        
        # Query back the session we just created (with shorter delays)
        # Reduced retries and delays to avoid big delays
        max_retries = 3
        retry_delay = 0.1  # Reduced from 0.2s
        
        for attempt in range(max_retries):
            if attempt > 0:
                # Shorter delays for retries
                delay = retry_delay * attempt  # 0.1s, 0.2s instead of 0.4s, 0.6s, etc.
                print(f"Retrying session query (attempt {attempt + 1}/{max_retries}) after {delay}s delay")
                time.sleep(delay)
            else:
                # Very short initial delay
                time.sleep(0.1)
            
            try:
                # Query by filters to find the most recent session
                recent = supabase.table("wizard_sessions").select("*").eq("user_id", user_id).eq("template_id", template_id_uuid).eq("status", "active").order("created_at", desc=True).limit(1).execute()
                
                if recent and hasattr(recent, 'data') and recent.data and len(recent.data) > 0:
                    row = recent.data[0]
                    # Verify this is recent (within last 10 seconds) to avoid returning old sessions
                    try:
                        created_str = row["created_at"]
                        # Handle different timestamp formats
                        if created_str.endswith('Z'):
                            created_time = datetime.fromisoformat(created_str.replace('Z', '+00:00'))
                        else:
                            created_time = datetime.fromisoformat(created_str)
                        
                        now_time = datetime.utcnow()
                        if created_time.tzinfo:
                            now_time = now_time.replace(tzinfo=created_time.tzinfo)
                        else:
                            created_time = created_time.replace(tzinfo=None)
                            now_time = now_time.replace(tzinfo=None)
                        
                        time_diff = abs((now_time - created_time).total_seconds())
                        
                        if time_diff < 10:  # Created within last 10 seconds (reduced from 30)
                            print(f"Found session by query (created {time_diff:.2f}s ago): {row['id']}")
                            return {"id": str(row["id"]), "draftJson": row["draft_json"], "progress": row["progress"]}
                        else:
                            if attempt < max_retries - 1:
                                print(f"Found session but it's too old ({time_diff:.2f}s ago), retrying...")
                                continue  # Retry
                    except Exception as time_error:
                        # If timestamp parsing fails, assume it's the right one (better than failing)
                        print(f"Timestamp parsing error (assuming correct): {time_error}")
                        return {"id": str(row["id"]), "draftJson": row["draft_json"], "progress": row["progress"]}
                
                # If we get here, didn't find the session yet
                if attempt < max_retries - 1:
                    continue
                    
            except Exception as query_error:
                error_str = str(query_error)
                print(f"Query error on attempt {attempt + 1}: {error_str}")
                if attempt < max_retries - 1:
                    continue  # Retry
                else:
                    # Last attempt failed
                    raise HTTPException(
                        status_code=500,
                        detail=f"Session was created but could not be retrieved after {max_retries} attempts. Please try refreshing the page."
                    )
        
        # If we exhausted all retries
        raise HTTPException(
            status_code=500,
            detail="Session was created but could not be retrieved. Please try refreshing the page or creating a new session."
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = str(e)
        error_trace = traceback.format_exc()
        print(f"Error creating wizard session: {error_details}")
        print(f"Traceback: {error_trace}")
        
        # Don't show misleading error about table not existing
        # The table exists, this is a PostgREST issue
        if "Missing response" in error_details or "204" in error_details or "Postgrest couldn't retrieve response" in error_details:
            raise HTTPException(
                status_code=500,
                detail=f"Session creation encountered a database communication issue. The session may have been created successfully. Please try refreshing the page or creating a new session."
            )
        raise HTTPException(status_code=500, detail=f"Failed to create session: {error_details}")


@router.patch("/api/wizard/sessions/{session_id}")
async def patch_session(session_id: str, body: PatchSessionRequest, user_id: str = Depends(get_current_user)):
    try:
        # Load existing session (ownership via RLS)
        sel = supabase.table("wizard_sessions").select("draft_json,progress").eq("id", session_id).single().execute()
        if not sel or not hasattr(sel, 'data') or not sel.data:
            raise HTTPException(status_code=404, detail="Session not found")
        draft = sel.data.get("draft_json") or {}
        progress = sel.data.get("progress") or {}

        # JSON merge for draft
        if body.draftPatch:
            for k, v in body.draftPatch.items():
                draft[k] = v

        # Merge progress
        if body.progressPatch:
            for k, v in body.progressPatch.items():
                progress[k] = v

        update_obj = {
            "draft_json": draft,
            "progress": progress,
            "updated_at": datetime.utcnow().isoformat()
        }
        if body.lastStep is not None:
            update_obj["last_step"] = body.lastStep

        upd = supabase.table("wizard_sessions").update(update_obj).eq("id", session_id).execute()
        if not upd or not hasattr(upd, 'data') or not upd.data:
            raise HTTPException(status_code=400, detail="Failed to update session")
        row = upd.data[0]
        return {"draftJson": row["draft_json"], "progress": row["progress"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to patch session: {e}")


@router.post("/api/wizard/sessions/{session_id}/complete")
async def complete_session(session_id: str, user_id: str = Depends(get_current_user)):
    try:
        # Read session and template
        ses = supabase.table("wizard_sessions").select("template_id,draft_json").eq("id", session_id).single().execute()
        if not ses or not hasattr(ses, 'data') or not ses.data:
            raise HTTPException(status_code=404, detail="Session not found")
        draft = ses.data.get("draft_json") or {}
        template_id = ses.data.get("template_id")
        
        if not template_id:
            raise HTTPException(status_code=400, detail="Session missing template_id")

        # Create generated resume + first version
        now_iso = datetime.utcnow().isoformat()
        gres = supabase.table("generated_resumes").insert({
            "user_id": user_id,
            "template_id": template_id,
            "title": draft.get("profile", {}).get("fullName") or "My Resume",
            "current_version": 1,
            "created_at": now_iso,
            "updated_at": now_iso
        }).execute()
        if not gres or not hasattr(gres, 'data') or not gres.data:
            raise HTTPException(status_code=400, detail="Failed to finalize resume")
        resume_id = gres.data[0]["id"]

        v1 = supabase.table("generated_resume_versions").insert({
            "generated_resume_id": resume_id,
            "version_number": 1,
            "content_json": draft,
            "created_at": now_iso
        }).execute()
        if not v1 or not hasattr(v1, 'data') or not v1.data:
            raise HTTPException(status_code=400, detail="Failed to create initial version")

        # Mark session completed
        supabase.table("wizard_sessions").update({
            "status": "completed",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", session_id).execute()

        # Best-effort: also persist a copy to existing resume_builder_data for editor compatibility
        resume_builder_id = None
        try:
            rb = supabase.table("resume_builder_data").insert({
                "user_id": user_id,
                "template_id": template_id,
                "title": draft.get("profile", {}).get("fullName") or "My Resume",
                "resume_data": json.dumps(_draft_to_resume_data(draft)),
                "is_current": False,
                "created_at": now_iso,
                "updated_at": now_iso,
            }).execute()
            if rb and hasattr(rb, 'data') and rb.data:
                resume_builder_id = rb.data[0]["id"]
        except Exception as _e:
            # Ignore: table may not exist in some deployments
            print(f"Warning: Failed to create resume_builder_data entry: {_e}")
            pass

        return {"generatedResumeId": resume_id, "version": 1, "resumeBuilderId": resume_builder_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete session: {e}")


@router.get("/api/generated-resumes/{resume_id}")
async def get_generated_resume(resume_id: str, user_id: str = Depends(get_current_user)):
    try:
        # Fetch resume metadata
        r = supabase.table("generated_resumes").select("id, template_id, current_version, title, share_token").eq("id", resume_id).single().execute()
        if not r.data:
            raise HTTPException(status_code=404, detail="Generated resume not found")
        template_id_uuid = r.data.get("template_id")
        vnum = r.data.get("current_version") or 1
        
        # Fetch template slug
        template_slug = None
        if template_id_uuid:
            try:
                tpl = supabase.table("templates").select("slug").eq("id", template_id_uuid).maybe_single().execute()
                if tpl and hasattr(tpl, 'data') and tpl.data:
                    template_slug = tpl.data.get("slug")
            except Exception as e:
                print(f"Warning: Could not fetch template slug: {e}")
        
        # Fetch version content
        v = supabase.table("generated_resume_versions").select("version_number, content_json, render_artifact_url, created_at").eq("generated_resume_id", resume_id).eq("version_number", vnum).single().execute()
        if not v.data:
            raise HTTPException(status_code=404, detail="Generated resume version not found")
        return {
            "id": r.data["id"],
            "templateId": template_slug or template_id_uuid,  # Prefer slug, fallback to UUID
            "templateIdUuid": template_id_uuid,  # Also include UUID for reference
            "currentVersion": vnum,
            "contentJson": v.data["content_json"],
            "renderArtifactUrl": v.data.get("render_artifact_url"),
            "shareToken": r.data.get("share_token"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch generated resume: {e}")


class NewVersionRequest(BaseModel):
    contentPatch: Optional[Dict[str, Any]] = None


@router.post("/api/generated-resumes/{resume_id}/versions")
async def create_generated_resume_version(resume_id: str, body: NewVersionRequest, user_id: str = Depends(get_current_user)):
    try:
        # Get current version and content
        r = supabase.table("generated_resumes").select("current_version").eq("id", resume_id).single().execute()
        if not r.data:
            raise HTTPException(status_code=404, detail="Generated resume not found")
        current = r.data.get("current_version") or 1
        last = supabase.table("generated_resume_versions").select("content_json").eq("generated_resume_id", resume_id).eq("version_number", current).single().execute()
        if not last.data:
            raise HTTPException(status_code=404, detail="Base version not found")
        content = last.data.get("content_json") or {}
        # Apply patch (shallow per top-level keys)
        if body.contentPatch:
            for k, v in body.contentPatch.items():
                content[k] = v
        new_version = current + 1
        now_iso = datetime.utcnow().isoformat()
        ins = supabase.table("generated_resume_versions").insert({
            "generated_resume_id": resume_id,
            "version_number": new_version,
            "content_json": content,
            "created_at": now_iso,
        }).execute()
        if not ins.data:
            raise HTTPException(status_code=400, detail="Failed to create new version")
        supabase.table("generated_resumes").update({"current_version": new_version, "updated_at": now_iso}).eq("id", resume_id).execute()
        return {"version": new_version}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create version: {e}")


@router.options("/api/ai/profile-summary")
async def profile_summary_options():
    """Handle CORS preflight for profile summary endpoint"""
    return {"status": "ok"}

@router.post("/api/ai/profile-summary")
async def generate_profile_summary(body: ProfileSummaryRequest, user_id: str = Depends(get_current_user)):
    try:
        # Load session draft
        ses = supabase.table("wizard_sessions").select("draft_json").eq("id", body.wizardSessionId).single().execute()
        if not ses.data:
            raise HTTPException(status_code=404, detail="Session not found")
        draft = ses.data["draft_json"] or {}

        profile = draft.get("profile", {})
        full_name = profile.get("fullName") or ""
        headline = profile.get("headline") or "Professional"
        years = profile.get("yearsExperience") or None
        skills = draft.get("skills", []) or []
        achievements = draft.get("achievements", []) or []
        target_role = draft.get("targetRole") or body.promptHints or ""
        work_experience = draft.get("experience", []) or []
        education = draft.get("education", []) or []

        client = get_openai_client()
        
        # Build context about work experience
        experience_summary = ""
        if work_experience:
            for exp in work_experience[:5]:  # Limit to 5 most recent
                exp_title = exp.get("title", "")
                exp_company = exp.get("company", "")
                exp_desc = exp.get("description", "")
                if exp_title and exp_company:
                    experience_summary += f"- {exp_title} at {exp_company}"
                    if exp_desc:
                        experience_summary += f": {exp_desc[:100]}"
                    experience_summary += "\n"
        
        system_prompt = (
            f"You are an expert resume writer specializing in {target_role if target_role else 'professional'} roles. "
            f"Create a compelling professional summary tailored specifically for a {target_role if target_role else 'professional'} position. "
            "Write in first-person, 2-3 sentences. Emphasize relevant experience, skills, and achievements that match the target role."
        )
        
        user_content = {
            "targetRole": target_role,
            "fullName": full_name,
            "headline": headline,
            "yearsExperience": years,
            "skills": skills[:20],
            "workExperience": experience_summary,
            "education": [f"{e.get('degree', '')} from {e.get('school', '')}" for e in education[:3]],
            "hints": body.promptHints or ""
        }
        started = datetime.utcnow()
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_content)}
            ],
            max_tokens=180,
            temperature=0.4
        )
        summary = resp.choices[0].message.content.strip()
        finished = datetime.utcnow()
        latency_ms = int((finished - started).total_seconds() * 1000)
        usage = getattr(resp, 'usage', None)
        prompt_tokens = getattr(usage, 'prompt_tokens', None) if usage else None
        completion_tokens = getattr(usage, 'completion_tokens', None) if usage else None

        # Persist into draft_json.profile.summary
        profile["summary"] = summary
        draft["profile"] = profile
        supabase.table("wizard_sessions").update({
            "draft_json": draft,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", body.wizardSessionId).execute()

        # Log AI event
        try:
            supabase.table("ai_events").insert({
                "user_id": user_id,
                "wizard_session_id": body.wizardSessionId,
                "provider": "openai",
                "model": "gpt-4o-mini",
                "input_tokens": prompt_tokens,
                "output_tokens": completion_tokens,
                "latency_ms": latency_ms,
                "status": "success",
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception:
            pass

        return {"summary": summary}
    except HTTPException:
        raise
    except Exception as e:
        # Log error
        try:
            supabase.table("ai_events").insert({
                "user_id": user_id,
                "wizard_session_id": body.wizardSessionId,
                "provider": "openai",
                "model": "gpt-4o-mini",
                "status": "error",
                "error": str(e),
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {e}")


# -----------------------------
# PDF export (simple renderer)
# -----------------------------
class ExportPdfResponse(BaseModel):
    url: str


@router.post("/api/exports/{resume_id}/pdf", response_model=ExportPdfResponse)
async def export_pdf(resume_id: str, user_id: str = Depends(get_current_user)):
    """Render the current version of a generated resume into a simple PDF and upload to Storage.
    This uses a minimal ReportLab layout as a baseline.
    """
    try:
        # Pull current version
        r = supabase.table("generated_resumes").select("template_id,current_version").eq("id", resume_id).single().execute()
        if not r.data:
            raise HTTPException(status_code=404, detail="Generated resume not found")
        vnum = r.data.get("current_version") or 1
        v = supabase.table("generated_resume_versions").select("content_json").eq("generated_resume_id", resume_id).eq("version_number", vnum).single().execute()
        if not v.data:
            raise HTTPException(status_code=404, detail="Version not found")
        content = v.data.get("content_json") or {}

        # Build a simple PDF using reportlab
        try:
            from reportlab.lib.pagesizes import LETTER
            from reportlab.pdfgen import canvas
            from reportlab.lib.units import inch
        except Exception as imp_e:
            raise HTTPException(status_code=500, detail=f"PDF engine not available: {imp_e}")

        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=LETTER)
        width, height = LETTER

        profile = content.get("profile", {}) or {}
        full_name = profile.get("fullName") or "Unnamed"
        headline = profile.get("headline") or ""
        summary = profile.get("summary") or ""
        skills = content.get("skills") or []
        experience = content.get("experience") or []
        education = content.get("education") or []

        y = height - 1*inch
        c.setFont("Helvetica-Bold", 16)
        c.drawString(1*inch, y, full_name)
        y -= 0.3*inch
        if headline:
            c.setFont("Helvetica", 12)
            c.drawString(1*inch, y, headline)
            y -= 0.25*inch

        # Summary
        if summary:
            c.setFont("Helvetica-Bold", 12)
            c.drawString(1*inch, y, "Summary")
            y -= 0.2*inch
            c.setFont("Helvetica", 10)
            for line in (summary or "").split("\n"):
                c.drawString(1*inch, y, line[:100])
                y -= 0.18*inch
            y -= 0.1*inch

        # Skills
        if skills:
            c.setFont("Helvetica-Bold", 12)
            c.drawString(1*inch, y, "Skills")
            y -= 0.2*inch
            c.setFont("Helvetica", 10)
            skills_line = ", ".join([s if isinstance(s, str) else s.get("name", "") for s in skills])
            for chunk in [skills_line[i:i+100] for i in range(0, len(skills_line), 100)]:
                c.drawString(1*inch, y, chunk)
                y -= 0.18*inch
            y -= 0.1*inch

        # Experience
        if experience:
            c.setFont("Helvetica-Bold", 12)
            c.drawString(1*inch, y, "Experience")
            y -= 0.2*inch
            c.setFont("Helvetica", 10)
            for e in experience[:6]:
                title = f"{e.get('title','')} - {e.get('company','')}"
                c.drawString(1*inch, y, title[:100])
                y -= 0.18*inch
                desc = (e.get('description') or '')
                for line in desc.split("\n")[:4]:
                    c.drawString(1.2*inch, y, ("• " + line)[:100])
                    y -= 0.16*inch
                y -= 0.08*inch

        # Education
        if education and y > 1*inch:
            c.setFont("Helvetica-Bold", 12)
            c.drawString(1*inch, y, "Education")
            y -= 0.2*inch
            c.setFont("Helvetica", 10)
            for ed in education[:4]:
                line = f"{ed.get('degree','')} in {ed.get('field','')} - {ed.get('school','')}"
                c.drawString(1*inch, y, line[:100])
                y -= 0.18*inch

        c.showPage()
        c.save()
        pdf_bytes = buf.getvalue()
        buf.close()

        # Upload to Storage (reuse existing bucket)
        storage_path = f"generated-resumes/{user_id}/{resume_id}/v{vnum}/resume.pdf"
        try:
            supabase.storage.from_("jobstalker-files").upload(
                storage_path,
                pdf_bytes,
                {"content-type": "application/pdf"}
            )
        except Exception as up_e:
            raise HTTPException(status_code=500, detail=f"Failed to upload PDF: {up_e}")

        url = supabase.storage.from_("jobstalker-files").get_public_url(storage_path)

        # Update version record
        supabase.table("generated_resume_versions").update({
            "render_artifact_url": url,
        }).eq("generated_resume_id", resume_id).eq("version_number", vnum).execute()

        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {e}")


