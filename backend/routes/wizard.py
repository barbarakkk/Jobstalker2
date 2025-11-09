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
        if not res.data:
            res = supabase.table("templates").select("id,name,slug,schema,preview_url,is_active").eq("id", template_id).maybe_single().execute()
        if not res.data:
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
        tpl = supabase.table("templates").select("id,schema").eq("slug", body.templateId).maybe_single().execute()
        if not tpl.data:
            # If not found by slug, try by id (UUID)
            tpl = supabase.table("templates").select("id,schema").eq("id", body.templateId).maybe_single().execute()
        
        if not tpl.data:
            raise HTTPException(status_code=404, detail=f"Template not found: {body.templateId}")
        
        template_id_uuid = tpl.data["id"]  # Get the actual UUID
        draft_json = tpl.data["schema"] or {}

        # Prefill from user_profile and normalized tables
        if body.prefill:
            prof = supabase.table("user_profile").select("full_name,job_title,location").eq("user_id", user_id).maybe_single().execute()
            
            # Fetch from normalized tables
            skills_res = supabase.table("user_skills").select("*").eq("user_id", user_id).execute()
            experience_res = supabase.table("user_work_experience").select("*").eq("user_id", user_id).execute()
            education_res = supabase.table("user_education").select("*").eq("user_id", user_id).execute()
            
            if prof.data:
                # Convert normalized data to JSON format for wizard
                skills_list = []
                for skill in (skills_res.data or []):
                    skills_list.append({
                        "name": skill.get("name"),
                        "proficiency": skill.get("proficiency"),
                        "category": skill.get("category", "Technical")
                    })
                
                experience_list = []
                for exp in (experience_res.data or []):
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
                for edu in (education_res.data or []):
                    education_list.append({
                        "school": edu.get("school"),
                        "degree": edu.get("degree"),
                        "field": edu.get("field"),
                        "startDate": edu.get("start_date"),
                        "endDate": edu.get("end_date")
                    })
                
                profile_map = {
                    "profile": {
                        "fullName": prof.data.get("full_name"),
                        "headline": prof.data.get("job_title"),
                        "location": prof.data.get("location")
                    },
                    "skills": skills_list,
                    "experience": experience_list,
                    "education": education_list
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

        # Apply optional seed
        if body.seed and isinstance(body.seed, dict):
            draft_json = {**draft_json, **body.seed}

        now_iso = datetime.utcnow().isoformat()
        ins = supabase.table("wizard_sessions").insert({
            "user_id": user_id,
            "template_id": template_id_uuid,  # Use the actual UUID, not the slug
            "draft_json": draft_json,
            "progress": {"step": 1},
            "status": "active",
            "last_step": 1,
            "created_at": now_iso,
            "updated_at": now_iso
        }).execute()
        if not ins.data:
            raise HTTPException(status_code=400, detail="Failed to create session")
        row = ins.data[0]
        return {"id": row["id"], "draftJson": row["draft_json"], "progress": row["progress"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {e}")


@router.patch("/api/wizard/sessions/{session_id}")
async def patch_session(session_id: str, body: PatchSessionRequest, user_id: str = Depends(get_current_user)):
    try:
        # Load existing session (ownership via RLS)
        sel = supabase.table("wizard_sessions").select("draft_json,progress").eq("id", session_id).single().execute()
        if not sel.data:
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
        if not upd.data:
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
        if not ses.data:
            raise HTTPException(status_code=404, detail="Session not found")
        draft = ses.data["draft_json"]
        template_id = ses.data["template_id"]

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
        if not gres.data:
            raise HTTPException(status_code=400, detail="Failed to finalize resume")
        resume_id = gres.data[0]["id"]

        v1 = supabase.table("generated_resume_versions").insert({
            "generated_resume_id": resume_id,
            "version_number": 1,
            "content_json": draft,
            "created_at": now_iso
        }).execute()
        if not v1.data:
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
            if rb.data:
                resume_builder_id = rb.data[0]["id"]
        except Exception as _e:
            # Ignore: table may not exist in some deployments
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
        vnum = r.data.get("current_version") or 1
        # Fetch version content
        v = supabase.table("generated_resume_versions").select("version_number, content_json, render_artifact_url, created_at").eq("generated_resume_id", resume_id).eq("version_number", vnum).single().execute()
        if not v.data:
            raise HTTPException(status_code=404, detail="Generated resume version not found")
        return {
            "id": r.data["id"],
            "templateId": r.data["template_id"],
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

        client = get_openai_client()
        system_prompt = (
            "You are a resume assistant. Output a concise 2-3 sentence first-person professional summary. "
            "Focus on quantified impact and key skills."
        )
        user_content = {
            "fullName": full_name,
            "headline": headline,
            "yearsExperience": years,
            "skills": skills[:20],
            "achievements": achievements[:10],
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


