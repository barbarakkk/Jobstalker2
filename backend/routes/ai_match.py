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
        # Check if user has pro tier (job matcher is pro-only)
        from utils.subscription import require_pro_tier
        await require_pro_tier(user_id, "Job Matcher")
        
        # Get job details
        job_response = supabase.table("jobs").select("*").eq("id", str(job_id)).eq("user_id", user_id).single().execute()
        if not job_response.data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job = job_response.data
        job_description = job.get("description", "") or ""
        job_title = job.get("job_title", "")
        company = job.get("company", "")
        location = job.get("location", "")
        salary = job.get("salary", "")
        
        # Check if job description is meaningful (more than just a few words or common non-descriptive text)
        job_desc_cleaned = job_description.strip().lower()
        minimal_descriptions = ["haha", "test", "n/a", "na", "none", "tbd", "tba", ""]
        is_minimal_description = (
            len(job_desc_cleaned) < 50 or 
            job_desc_cleaned in minimal_descriptions or
            len(job_desc_cleaned.split()) < 10
        )
        
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
        
        # Prepare detailed work experience summary
        work_exp_details = []
        for exp in work_experience[:5]:
            exp_text = f"- {exp.get('title', 'N/A')} at {exp.get('company', 'N/A')}"
            if exp.get('start_date'):
                exp_text += f" ({exp.get('start_date')}"
                if exp.get('end_date'):
                    exp_text += f" - {exp.get('end_date')}"
                elif exp.get('is_current'):
                    exp_text += " - Present"
                exp_text += ")"
            if exp.get('description'):
                exp_text += f"\n  Description: {exp.get('description', '')[:300]}"
            work_exp_details.append(exp_text)
        
        # Prepare detailed education summary
        education_details = []
        for edu in education[:3]:
            edu_text = f"- {edu.get('degree', 'N/A')}"
            if edu.get('school'):
                edu_text += f" from {edu.get('school', 'N/A')}"
            if edu.get('start_date') or edu.get('end_date'):
                edu_text += f" ({edu.get('start_date', '')} - {edu.get('end_date', '')})"
            education_details.append(edu_text)
        
        # Prepare user profile summary
        user_profile_summary = f"""
        User Profile:
        - Name: {profile.get('full_name', 'N/A')}
        - Current Role: {profile.get('job_title', 'N/A')}
        - Location: {profile.get('location', 'N/A')}
        
        Skills: {', '.join(user_skills) if user_skills else 'None listed'}
        
        Work Experience ({len(work_experience)} positions):
        {chr(10).join(work_exp_details) if work_exp_details else 'No work experience listed'}
        
        Education ({len(education)} entries):
        {chr(10).join(education_details) if education_details else 'No education listed'}
        """
        
        # Handle minimal job descriptions
        if is_minimal_description:
            return {
                "matchScore": 0,
                "strengths": [
                    "Unable to analyze match - job description is too minimal",
                    "Please add a detailed job description to get accurate match analysis"
                ],
                "improvements": [
                    "Add a complete job description with requirements, skills, and responsibilities",
                    "Include details about required experience and qualifications",
                    "Add information about job duties and responsibilities"
                ],
                "missingSkills": [],
                "matchedSkills": []
            }
        
        # Use OpenAI to analyze match
        client = get_openai_client()
        
        # Use full job description (up to 8000 chars to capture complete job posting)
        job_desc_text = job_description[:8000]
        
        prompt = f"""You are an expert career counselor and job matching analyst. Your task is to analyze how well a candidate's profile matches a specific job posting.

JOB POSTING DETAILS:
- Job Title: {job_title}
- Company: {company}
- Location: {location if location else 'Not specified'}
- Salary: {salary if salary else 'Not specified'}

FULL JOB DESCRIPTION AND REQUIREMENTS:
{job_desc_text}

CANDIDATE PROFILE:
{user_profile_summary}

ANALYSIS INSTRUCTIONS:
1. Carefully read the ENTIRE job description above, paying special attention to:
   - Required skills and technologies
   - Required experience and qualifications
   - Education requirements
   - Job responsibilities and duties
   - Preferred qualifications
   - Any specific requirements mentioned

2. Compare the candidate's profile against these requirements:
   - Match their skills against required skills mentioned in the job description
   - Compare their work experience against required experience mentioned in the job description
   - Check if their education meets the requirements mentioned in the job description
   - Identify gaps and strengths based on what's ACTUALLY mentioned in the job description

3. Provide a detailed analysis in JSON format with this exact structure:
{{
    "matchScore": <number between 0-100, where 100 is perfect match>,
    "strengths": [<array of 3-5 specific strengths where candidate matches well, be SPECIFIC about what from the job description they match - quote or reference actual requirements>],
    "improvements": [<array of 3-5 actionable recommendations based on what's ACTUALLY missing from the job description - reference specific requirements>],
    "missingSkills": [<array of specific skills/technologies that are EXPLICITLY mentioned in the job description but NOT in the candidate's profile>],
    "matchedSkills": [<array of skills/technologies that are EXPLICITLY mentioned in the job description AND ARE in the candidate's profile>]
}}

CRITICAL REQUIREMENTS:
- Base your analysis STRICTLY and ONLY on what is actually written in the job description above
- Do NOT make assumptions or add requirements that are not in the job description
- Be specific - quote or reference actual text from the job description when possible
- If a skill or requirement is not mentioned in the job description, do NOT include it in missingSkills
- Only include skills in matchedSkills if they are explicitly mentioned in the job description AND in the candidate's profile
- Return ONLY valid JSON, no other text or markdown formatting"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert career counselor and job matching analyst. You analyze job postings in detail and compare them against candidate profiles. Always return only valid JSON without any markdown formatting or additional text."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
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

@router.post("/api/ai/extract-resume-keywords/{job_id}")
async def extract_resume_keywords(job_id: UUID, user_id: str = Depends(get_current_user)):
    """Extract resume-relevant keywords from job description using AI"""
    try:
        # Get job details
        job_response = supabase.table("jobs").select("*").eq("id", str(job_id)).eq("user_id", user_id).single().execute()
        if not job_response.data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job = job_response.data
        job_description = job.get("description", "") or ""
        
        if not job_description or len(job_description.strip()) < 50:
            return {
                "keywords": [],
                "message": "Job description is too short to extract meaningful keywords"
            }
        
        # Use OpenAI to extract resume-relevant keywords
        client = get_openai_client()
        
        # Limit description to 8000 chars
        job_desc_text = job_description[:8000]
        
        prompt = f"""Analyze the following job description and extract the REQUIRED SKILLS and TECHNOLOGIES that are mentioned. Focus specifically on skills that would be valuable to include on a resume.

JOB DESCRIPTION:
{job_desc_text}

INSTRUCTIONS:
1. Extract ONLY skills, technologies, tools, frameworks, programming languages, and technical competencies mentioned in the job description
2. Focus on REQUIRED skills - things the job explicitly asks for or mentions as necessary
3. Include:
   - Programming languages (e.g., "Python", "JavaScript", "Java")
   - Frameworks and libraries (e.g., "React", "Django", "Spring Boot")
   - Tools and platforms (e.g., "AWS", "Docker", "Git", "Jenkins")
   - Databases (e.g., "PostgreSQL", "MongoDB", "MySQL")
   - Methodologies (e.g., "Agile", "Scrum", "CI/CD")
   - Technical skills (e.g., "Machine Learning", "REST APIs", "Microservices")
   - Software and applications (e.g., "Figma", "Tableau", "Salesforce")
4. DO NOT include generic terms like "communication", "teamwork" unless they are specifically mentioned as required technical competencies
5. Prioritize specific technical terms over generic ones
6. Return a JSON array of skills (strings only, no duplicates)
7. Limit to 30 most important skills
8. Format each skill in a professional, resume-appropriate way (e.g., "React.js" not "react" or "REACT", "Node.js" not "node")

Return ONLY a valid JSON array, no other text or markdown formatting. Example format:
["JavaScript", "React", "Node.js", "AWS", "PostgreSQL", "Docker", "Agile", "REST APIs"]"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert resume writer and career advisor. Extract resume-relevant keywords from job descriptions. Always return only valid JSON arrays without any markdown formatting or additional text."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        content = response.choices[0].message.content.strip()
        print(f"OpenAI response content: {content[:200]}...")  # Log first 200 chars
        
        # Extract JSON array from response
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            try:
                keywords = json.loads(json_match.group())
                # Ensure it's a list and clean up
                if isinstance(keywords, list):
                    keywords = [str(k).strip() for k in keywords if k and str(k).strip()]
                    keywords = list(dict.fromkeys(keywords))  # Remove duplicates while preserving order
                    print(f"Extracted {len(keywords)} keywords: {keywords[:5]}...")  # Log first 5
                else:
                    keywords = []
                    print("Warning: OpenAI returned non-list response")
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                keywords = []
        else:
            print("Warning: No JSON array found in OpenAI response")
            keywords = []
        
        # Log AI event
        try:
            supabase.table("ai_events").insert({
                "user_id": user_id,
                "event_type": "resume_keyword_extraction",
                "model": "gpt-4o-mini",
                "tokens_used": getattr(response.usage, 'total_tokens', 0) if hasattr(response, 'usage') else 0,
                "metadata": {"job_id": str(job_id)}
            }).execute()
        except Exception as e:
            print(f"Warning: Could not log AI event: {str(e)}")
        
        return {
            "keywords": keywords[:30],  # Limit to 30
            "message": "Keywords extracted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error extracting resume keywords: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to extract keywords: {str(e)}")

