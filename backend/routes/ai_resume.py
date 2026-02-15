from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import openai
import os
import sys
import json
import re
from datetime import datetime
from uuid import UUID
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from supabase_client import supabase
from models import ResumeBuilderData, SaveResumeRequest, UpdateResumeRequest, ResumeBuilderItem, SaveResumeResponse

router = APIRouter()

# AI Resume Generation Models
class PersonalInfo(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    jobTitle: Optional[str] = None
    linkedin: Optional[str] = None
    website: Optional[str] = None

class WorkExperience(BaseModel):
    id: str
    title: str
    company: str
    location: Optional[str] = None
    startDate: str
    endDate: str
    isCurrent: bool = False
    jobType: Optional[str] = None
    description: Optional[str] = ""

class Education(BaseModel):
    id: str
    school: str
    degree: str
    field: Optional[str] = None
    startDate: str
    endDate: str

class Skill(BaseModel):
    id: str
    name: str
    category: str

class Language(BaseModel):
    name: str
    proficiency: str

class AIGenerateRequest(BaseModel):
    templateId: str
    personalInfo: PersonalInfo
    summary: Optional[str] = None
    workExperience: List[WorkExperience]
    education: List[Education]
    skills: List[Skill]
    languages: List[Language]

class ResumeData(BaseModel):
    personalInfo: PersonalInfo
    summary: Optional[str] = ""
    workExperience: List[WorkExperience]
    education: List[Education]
    skills: List[Skill]
    languages: List[Language]

class AIGenerateResponse(BaseModel):
    resumeData: ResumeData
    success: bool = True
    message: str = "Resume generated successfully"

class WorkDescriptionQuestionnaire(BaseModel):
    job_title: str
    company: str
    what_did_you_do: str  # Main responsibilities
    problems_solved: Optional[str] = None
    achievements: Optional[str] = None
    technologies_used: Optional[str] = None
    impact_results: Optional[str] = None

class WorkDescriptionResponse(BaseModel):
    description: str
    success: bool = True

# Authentication dependency
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Enhanced authentication check with Supabase verification"""
    # Check if authorization header exists
    if not authorization:
        raise HTTPException(
            status_code=401, 
            detail="Authorization header is required"
        )
    
    # Validate Bearer token format
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Invalid authorization format. Use 'Bearer <token>'"
        )
    
    # Extract token
    token = authorization.replace("Bearer ", "").strip()
    
    # Validate token is not empty
    if not token:
        raise HTTPException(
            status_code=401, 
            detail="Token cannot be empty"
        )
    
    try:
        # Use Supabase to verify the token
        user_response = supabase.auth.get_user(token)
        
        # Check if user exists and is valid
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=401, 
                detail="Invalid or expired token"
            )
        
        # Extract user ID
        user_id = user_response.user.id
        
        # Authentication successful - return user_id
        return user_id
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the specific error for debugging
        print(f"Authentication error in ai_resume: {str(e)}")
        
        # Provide user-friendly error message
        if "expired" in str(e).lower():
            raise HTTPException(
                status_code=401, 
                detail="Token has expired. Please log in again."
            )
        elif "invalid" in str(e).lower():
            raise HTTPException(
                status_code=401, 
                detail="Invalid token. Please log in again."
            )
        else:
            raise HTTPException(
                status_code=401, 
                detail="Authentication failed. Please try again."
            )

def get_openai_client():
    """Get OpenAI client with API key"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    return openai.OpenAI(api_key=api_key)

def generate_professional_summary(personal_info: PersonalInfo, work_experience: List[WorkExperience], 
                                education: List[Education], skills: List[Skill]) -> str:
    """Generate a professional summary using AI"""
    client = get_openai_client()
    
    # Prepare context for AI
    experience_text = ""
    for exp in work_experience:
        experience_text += f"- {exp.title} at {exp.company} ({exp.startDate} - {exp.endDate if not exp.isCurrent else 'Present'})\n"
        if exp.description:
            experience_text += f"  {exp.description}\n"
    
    education_text = ""
    for edu in education:
        if edu.field:
            education_text += f"- {edu.degree} in {edu.field} from {edu.school}\n"
        else:
            education_text += f"- {edu.degree} from {edu.school}\n"
    
    skills_text = ", ".join([skill.name for skill in skills])
    
    prompt = f"""
    Create a compelling professional summary for a resume based on the following information:
    
    Name: {personal_info.firstName} {personal_info.lastName}
    Job Title: {personal_info.jobTitle or 'Professional'}
    
    Work Experience:
    {experience_text}
    
    Education:
    {education_text}
    
    Skills: {skills_text}
    
    Write a concise 2-sentence professional summary that:
    1. Highlights your most relevant experience and key achievements that align with the job description (first sentence)
    2. Shows your top skills and value proposition that match the job requirements (second sentence)
    
    Requirements:
    - Maximum 2 sentences
    - Each sentence should be clear and impactful
    - Focus on quantifiable achievements when possible
    - Use action-oriented language
    - Keep total length under 150 words
    - Do not exceed 2 sentences under any circumstances
    - If job description is provided, tailor the summary to match the specific requirements and terminology used in the job posting
    
    Keep it concise, professional, and impactful.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert resume writer. Create concise professional summaries that are exactly 2 sentences long. Be direct and impactful."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=120,
            temperature=0.7
        )
        
        summary = response.choices[0].message.content.strip()
        # Remove any asterisks from summary
        summary = re.sub(r'[\*\u2022\u2023\u25E6\u2043\u2219•]', '', summary)
        return summary
    except Exception as e:
        print(f"Error generating summary: {str(e)}")
        return f"Experienced {personal_info.jobTitle or 'professional'} with expertise in {', '.join([skill.name for skill in skills[:3]])}."

def enhance_work_experience(work_experience: List[WorkExperience]) -> List[WorkExperience]:
    """Enhance work experience descriptions using AI"""
    client = get_openai_client()
    enhanced_experience = []
    
    for exp in work_experience:
        if not exp.description or len(exp.description.strip()) < 20:
            # Generate description if missing or too short
            prompt = f"""
            Create a professional job description.
            
            Job Title: {exp.title}
            Company: {exp.company}
            Duration: {exp.startDate} - {exp.endDate if not exp.isCurrent else 'Present'}
            Current Description: {exp.description or 'No description provided'}
            
            Write 3-4 sentences that:
            1. Use strong action verbs
            2. Highlight skills and responsibilities
            3. Show impact and results (if mentioned in current description)
            4. Use professional terminology
            5. Sound professional and compelling
            
            CRITICAL: Do NOT use asterisks (*), bullet symbols (•), or dashes (-) at the start of lines. Write as plain text sentences separated by newlines.
            """
            
            system_message = "You are an expert resume writer. Create compelling job descriptions."
            
            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=300,
                    temperature=0.7
                )
                
                enhanced_description = response.choices[0].message.content.strip()
                # Remove ALL asterisks completely - no asterisks should remain
                enhanced_description = re.sub(r'\*', '', enhanced_description)  # Remove all asterisks first
                # Remove bullet symbols
                enhanced_description = re.sub(r'[\u2022\u2023\u25E6\u2043\u2219•]', '', enhanced_description)
                # Remove leading dashes
                enhanced_description = re.sub(r'^\s*[-]\s*', '', enhanced_description, flags=re.MULTILINE)
                # Split by newlines and clean each line thoroughly
                lines = enhanced_description.split('\n')
                cleaned_lines = []
                for line in lines:
                    cleaned = line.strip()
                    # Remove any remaining asterisks (double check)
                    cleaned = re.sub(r'\*', '', cleaned)
                    # Remove any bullet symbols
                    cleaned = re.sub(r'[\u2022\u2023\u25E6\u2043\u2219•]', '', cleaned)
                    # Remove leading dashes
                    cleaned = re.sub(r'^\s*[-]\s*', '', cleaned)
                    if cleaned:
                        cleaned_lines.append(cleaned)
                enhanced_description = '\n'.join(cleaned_lines)
            except Exception as e:
                print(f"Error enhancing experience: {str(e)}")
                enhanced_description = exp.description or "Responsible for key duties and achieved measurable results"
        else:
            enhanced_description = exp.description
        
        # Clean any asterisks from existing descriptions - remove ALL asterisks completely
        if enhanced_description:
            # Remove ALL asterisks first (most important - no asterisks should remain anywhere)
            enhanced_description = re.sub(r'\*', '', enhanced_description)
            # Remove bullet symbols
            enhanced_description = re.sub(r'[\u2022\u2023\u25E6\u2043\u2219•]', '', enhanced_description)
            # Remove leading dashes
            enhanced_description = re.sub(r'^\s*[-]\s*', '', enhanced_description, flags=re.MULTILINE)
            # Split by newlines and clean each line thoroughly
            lines = enhanced_description.split('\n')
            cleaned_lines = []
            for line in lines:
                cleaned = line.strip()
                # Remove any remaining asterisks (double check - no asterisks should remain)
                cleaned = re.sub(r'\*', '', cleaned)
                # Remove any bullet symbols
                cleaned = re.sub(r'[\u2022\u2023\u25E6\u2043\u2219•]', '', cleaned)
                # Remove leading dashes
                cleaned = re.sub(r'^\s*[-]\s*', '', cleaned)
                if cleaned:
                    cleaned_lines.append(cleaned)
            enhanced_description = '\n'.join(cleaned_lines)
        
        enhanced_experience.append(WorkExperience(
            id=exp.id,
            title=exp.title,
            company=exp.company,
            location=exp.location,
            startDate=exp.startDate,
            endDate=exp.endDate,
            isCurrent=exp.isCurrent,
            description=enhanced_description
        ))
    
    return enhanced_experience

@router.post("/api/ai/generate-resume", response_model=AIGenerateResponse)
async def generate_resume(request: AIGenerateRequest, user_id: str = Depends(get_current_user)):
    """Generate a professional resume using AI"""
    try:
        print(f"🤖 AI RESUME: Generating resume for user {user_id}")
        print(f"🤖 AI RESUME: Template: {request.templateId}")
        print(f"🤖 AI RESUME: Job description provided: {bool(request.jobDescription)}")
        
        # Generate professional summary
        summary = request.summary
        if not summary or len(summary.strip()) < 20:
            summary = generate_professional_summary(
                request.personalInfo,
                request.workExperience,
                request.education,
                request.skills,
                request.targetRole,
                request.jobDescription
            )
        
        # Enhance work experience descriptions
        enhanced_experience = enhance_work_experience(
            request.workExperience, 
            request.targetRole,
            request.jobDescription
        )
        
        # Create the resume data
        resume_data = ResumeData(
            personalInfo=request.personalInfo,
            summary=summary,
            workExperience=enhanced_experience,
            education=request.education,
            skills=request.skills,
            languages=request.languages
        )
        
        print(f"🤖 AI RESUME: Resume generated successfully")
        
        return AIGenerateResponse(
            resumeData=resume_data,
            success=True,
            message="Resume generated successfully with AI enhancement"
        )
        
    except Exception as e:
        print(f"❌ AI RESUME: Error generating resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate resume: {str(e)}")

class ResumeSummaryRequest(BaseModel):
    resumeData: ResumeData

class ResumeSummaryResponse(BaseModel):
    summary: str
    success: bool = True

class TailorResumeRequest(BaseModel):
    resumeData: ResumeData

class TailorResumeResponse(BaseModel):
    resumeData: ResumeData
    success: bool = True
    message: str

@router.post("/api/ai/profile-summary", response_model=ResumeSummaryResponse)
async def generate_profile_summary_from_resume(
    request: ResumeSummaryRequest,
    user_id: str = Depends(get_current_user)
):
    """Generate a professional summary from resume data"""
    try:
        print(f"🤖 AI SUMMARY: Generating summary for user {user_id}")
        
        summary = generate_professional_summary(
            request.resumeData.personalInfo,
            request.resumeData.workExperience,
            request.resumeData.education,
            request.resumeData.skills
        )
        
        print(f"🤖 AI SUMMARY: Summary generated successfully")
        
        return ResumeSummaryResponse(
            summary=summary,
            success=True
        )
    except Exception as e:
        print(f"❌ AI SUMMARY: Error generating summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

@router.post("/api/ai/generate-work-description", response_model=WorkDescriptionResponse)
async def generate_work_description(
    questionnaire: WorkDescriptionQuestionnaire, 
    user_id: str = Depends(get_current_user)
):
    """Generate professional work experience description from questionnaire answers"""
    try:
        print(f"🤖 AI WORK DESC: Generating description for user {user_id}")
        print(f"🤖 AI WORK DESC: Job: {questionnaire.job_title} at {questionnaire.company}")
        
        # Fetch user skills from database
        try:
            skills_response = supabase.table("user_skills").select("name").eq("user_id", user_id).execute()
            user_skills = [skill.get("name", "") for skill in (skills_response.data or []) if skill.get("name")]
            print(f"🤖 AI WORK DESC: Found {len(user_skills)} skills: {', '.join(user_skills[:5])}")
        except Exception as e:
            print(f"⚠️ Could not fetch user skills: {str(e)}")
            user_skills = []
        
        client = get_openai_client()
        
        skills_context = f"User's skills from profile: {', '.join(user_skills) if user_skills else 'None listed'}"
        
        # Check if user included impact/metrics in their single-field input (they may have pasted both responsibilities and results)
        user_text = (questionnaire.what_did_you_do or "").strip()
        has_impact = bool(
            questionnaire.impact_results and questionnaire.impact_results.strip() and questionnaire.impact_results.lower() not in ['none', 'none provided', 'n/a', 'na']
        ) or bool(re.search(r'\d+%|\d+\s*(percent|%)|\b(increased|reduced|improved|delivered|achieved)\s+', user_text, re.IGNORECASE))
        
        system_message = """You are a resume editor. Your job is to polish the user's work description into 2-3 clear, professional sentences.

STRICT RULES - YOU MUST FOLLOW THESE:
1. USE ONLY information the user wrote. Do not add any facts, metrics, numbers, technologies, team sizes, or achievements they did not mention.
2. If the user did not give a number or percentage, do not invent one (no "30%", "50%", "99.9%", "15+ projects", etc.).
3. You may: rephrase for clarity, use stronger action verbs (Led, Built, Implemented), fix grammar, and tighten wording.
4. You may not: add new responsibilities, add metrics/percentages, add technologies or tools they didn't mention, or expand their role beyond what they described.
5. Keep a similar length to the user's input. If they wrote 2 short sentences, output 2-3 polished sentences—do not turn it into a long list of invented bullet points.
6. Write in past tense, third person. No bullet symbols (•), asterisks (*), or dashes at the start of lines. Plain text sentences separated by newlines."""

        prompt = f"""Job title: {questionnaire.job_title}
Company: {questionnaire.company}

User's description (polish this only - do not add anything they did not write):
---
{user_text}
---

{"The user included some numbers/metrics above—you may keep those exact numbers when polishing. Do not add any new numbers or percentages." if has_impact else "The user did not provide any metrics or percentages. Do not add any numbers, percentages, or quantitative results."}

Output 2-3 professional sentences that stay strictly faithful to the user's description. No bullets, no asterisks, no leading dashes. Plain text only."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            max_tokens=250,
            temperature=0.2
        )
        
        description = response.choices[0].message.content.strip()
        
        # Post-process to remove all asterisks and bullet symbols, clean up formatting
        lines = description.split('\n')
        # Get all non-empty lines and remove bullet symbols/asterisks
        cleaned_lines = []
        for line in lines:
            cleaned = line.strip()
            if cleaned:
                # Remove ALL asterisks first (most important - no asterisks should remain)
                cleaned = re.sub(r'\*', '', cleaned)
                # Remove bullet symbols
                cleaned = re.sub(r'[\u2022\u2023\u25E6\u2043\u2219•]', '', cleaned)
                # Remove leading dashes and bullet markers
                cleaned = re.sub(r'^[\u2022\u2023\u25E6\u2043\u2219\-\•]\s*', '', cleaned)
                cleaned = re.sub(r'^\s*[-]\s*', '', cleaned)
                # Double check for any remaining asterisks
                cleaned = re.sub(r'\*', '', cleaned)
                if cleaned:
                    cleaned_lines.append(cleaned)
        
        # If impact wasn't provided, remove any metrics/percentages that might have been hallucinated
        if not has_impact:
            final_lines = []
            for line in cleaned_lines:
                # Remove percentage patterns unless they're part of skill names (like "C++")
                cleaned = re.sub(r'\b\d+%', '', line)
                cleaned = re.sub(r'\b\d+\s*(percent|percentage)', '', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'\b(increased|decreased|reduced|improved|enhanced)\s+by\s+\d+', '', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'\b(resulting in|leading to|contributing to)\s+[^,]+', '', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'\s+', ' ', cleaned).strip()  # Clean up extra spaces
                if cleaned:
                    final_lines.append(cleaned)
            cleaned_lines = final_lines
        
        if len(cleaned_lines) > 3:
            # Take only the first 3 lines
            description = '\n'.join(cleaned_lines[:3])
            print(f"⚠️ AI WORK DESC: Generated {len(cleaned_lines)} lines, truncated to 3")
        else:
            description = '\n'.join(cleaned_lines)
        
        print(f"🤖 AI WORK DESC: Description generated successfully")
        
        return WorkDescriptionResponse(
            description=description,
            success=True
        )
    except Exception as e:
        print(f"❌ AI WORK DESC: Error generating description: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate description: {str(e)}")

@router.post("/api/ai/tailor-resume", response_model=TailorResumeResponse)
async def tailor_resume(
    request: TailorResumeRequest,
    user_id: str = Depends(get_current_user)
):
    """Enhance an existing resume"""
    try:
        print(f"🎯 AI TAILOR: Enhancing resume for user {user_id}")
        
        # Fetch user skills from database to ensure we only use skills the user actually has
        try:
            skills_response = supabase.table("user_skills").select("name").eq("user_id", user_id).execute()
            user_skills_from_db = [skill.get("name", "").lower().strip() for skill in (skills_response.data or []) if skill.get("name")]
            print(f"🎯 AI TAILOR: Found {len(user_skills_from_db)} user skills: {', '.join(user_skills_from_db[:10])}")
        except Exception as e:
            print(f"⚠️ Could not fetch user skills: {str(e)}")
            user_skills_from_db = []
        
        # Filter resume skills to only include what user actually has
        resume_skill_names = [skill.name.lower().strip() for skill in request.resumeData.skills]
        valid_skills = []
        for skill in request.resumeData.skills:
            skill_name_lower = skill.name.lower().strip()
            # Check if skill exists in user's profile skills
            if skill_name_lower in user_skills_from_db or any(
                user_skill in skill_name_lower or skill_name_lower in user_skill 
                for user_skill in user_skills_from_db
            ):
                valid_skills.append(skill)
            else:
                print(f"⚠️ Skipping skill '{skill.name}' - not in user's profile")
        
        print(f"🎯 AI TAILOR: Filtered to {len(valid_skills)} valid skills from {len(request.resumeData.skills)} total")
        
        # Generate professional summary
        tailored_summary = generate_professional_summary(
            request.resumeData.personalInfo,
            request.resumeData.workExperience,
            request.resumeData.education,
            valid_skills
        )
        
        # Generate tailored work experience descriptions with bullet points (max 3 per job)
        client = get_openai_client()
        tailored_experience = []
        
        for exp in request.resumeData.workExperience:
            # Create a comprehensive prompt for generating work experience
            tailor_prompt = f"""
            You are an expert resume writer. Create professional work experience descriptions.
            
            CURRENT WORK EXPERIENCE:
            Job Title: {exp.title}
            Company: {exp.company}
            Duration: {exp.startDate} - {exp.endDate if not exp.isCurrent else 'Present'}
            Current Description: {exp.description or 'No description provided'}
            
            USER'S SKILLS:
            {', '.join([skill.name for skill in valid_skills[:15]])}
            
            INSTRUCTIONS:
            Generate EXACTLY 3 bullet points (one per line, separated by newlines) that describe this work experience:
            
            1. First bullet: What they did - Describe their main responsibilities and daily tasks using strong action verbs
            2. Second bullet: What they helped with - Describe how they contributed to team goals, projects, or initiatives
            3. Third bullet: How they improved efficiency/sales/performance - Describe measurable impact, improvements, or results they achieved
            
            CRITICAL REQUIREMENTS:
            - Generate EXACTLY 3 bullet points, no more, no less
            - Each bullet should be 15-25 words
            - Use powerful action verbs (Led, Developed, Implemented, Optimized, Increased, Reduced, etc.)
            - Focus on achievements and impact, especially in the third bullet
            - Write in past tense (unless current role)
            - Do NOT use asterisks (*), bullet symbols (•), or dashes (-) at the start of lines
            - Write as plain text, one sentence per line (3 lines total)
            
            FORMAT:
            Line 1: [Action verb] [what they did] [relevant details]
            Line 2: [Action verb] [what they helped with] [how they contributed]
            Line 3: [Action verb] [how they improved efficiency/sales/performance] [measurable impact if possible]
            
            Generate the 3 bullet points now:
            """
            
            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are an expert resume writer. Generate exactly 3 professional bullet points for work experience descriptions. Do not use asterisks, bullet symbols, or dashes."},
                        {"role": "user", "content": tailor_prompt}
                    ],
                    max_tokens=250,
                    temperature=0.7
                )
                
                generated_description = response.choices[0].message.content.strip()
                
                # Remove ALL asterisks completely
                generated_description = re.sub(r'\*', '', generated_description)
                # Remove bullet symbols
                generated_description = re.sub(r'[\u2022\u2023\u25E6\u2043\u2219•]', '', generated_description)
                # Remove leading dashes
                generated_description = re.sub(r'^\s*[-]\s*', '', generated_description, flags=re.MULTILINE)
                
                # Split by newlines and clean each line
                lines = generated_description.split('\n')
                cleaned_lines = []
                for line in lines:
                    cleaned = line.strip()
                    # Remove any remaining asterisks
                    cleaned = re.sub(r'\*', '', cleaned)
                    # Remove any bullet symbols
                    cleaned = re.sub(r'[\u2022\u2023\u25E6\u2043\u2219•]', '', cleaned)
                    # Remove leading dashes
                    cleaned = re.sub(r'^\s*[-]\s*', '', cleaned)
                    # Remove numbered prefixes (1., 2., 3., etc.)
                    cleaned = re.sub(r'^\d+[\.\)]\s*', '', cleaned)
                    if cleaned:
                        cleaned_lines.append(cleaned)
                
                # Limit to exactly 3 bullet points
                if len(cleaned_lines) > 3:
                    cleaned_lines = cleaned_lines[:3]
                elif len(cleaned_lines) < 3 and len(cleaned_lines) > 0:
                    # If we have fewer than 3, pad with generic descriptions
                    while len(cleaned_lines) < 3:
                        cleaned_lines.append(f"Contributed to key initiatives and achieved measurable results at {exp.company}")
                
                tailored_description = '\n'.join(cleaned_lines[:3])
                
            except Exception as e:
                print(f"⚠️ Error tailoring work experience for {exp.title}: {str(e)}")
                # Fallback: use existing description or create a simple one
                tailored_description = exp.description or f"Responsible for key duties and achieved measurable results at {exp.company}"
            
            tailored_experience.append(WorkExperience(
                id=exp.id,
                title=exp.title,
                company=exp.company,
                location=exp.location,
                startDate=exp.startDate,
                endDate=exp.endDate,
                isCurrent=exp.isCurrent,
                description=tailored_description
            ))
        
        print(f"🎯 AI TAILOR: Generated descriptions for {len(tailored_experience)} work experiences")
        
        # Use all valid skills
        final_skills = valid_skills[:20]  # Limit to 20
        
        # Create tailored resume data
        tailored_resume_data = ResumeData(
            personalInfo=request.resumeData.personalInfo,
            summary=tailored_summary,
            workExperience=tailored_experience,
            education=request.resumeData.education,
            skills=final_skills,
            languages=request.resumeData.languages
        )
        
        print(f"🎯 AI TAILOR: Resume tailored successfully")
        
        return TailorResumeResponse(
            resumeData=tailored_resume_data,
            success=True,
            message="Resume enhanced successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ AI TAILOR: Error tailoring resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to tailor resume: {str(e)}")

@router.get("/api/ai/health")
async def ai_health_check():
    """Health check for AI services"""
    try:
        # Check if OpenAI API key is configured
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {"status": "error", "message": "OpenAI API key not configured"}
        
        # Test OpenAI connection
        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )
        
        return {
            "status": "healthy",
            "message": "AI services are operational",
            "openai_configured": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error", 
            "message": f"AI services error: {str(e)}",
            "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
            "timestamp": datetime.utcnow().isoformat()
        }

# Resume Builder Data API Endpoints

@router.post("/api/resume-builder/save", response_model=SaveResumeResponse)
async def save_resume(request: SaveResumeRequest, user_id: str = Depends(get_current_user)):
    """Save generated resume data to database"""
    try:
        print(f"💾 RESUME BUILDER: Saving resume for user {user_id}")
        print(f"💾 RESUME BUILDER: Template: {request.template_id}, Title: {request.title}")
        
        # Check resume limit based on subscription tier
        from utils.subscription import check_resume_limit, get_user_subscription_tier
        can_create, current_count, max_allowed = await check_resume_limit(user_id)
        
        if not can_create:
            tier = await get_user_subscription_tier(user_id)
            raise HTTPException(
                status_code=403,
                detail=f"Resume limit reached. Free tier allows {max_allowed} resume(s). You currently have {current_count}. Upgrade to Pro for up to 20 professional resumes."
            )
        
        # Prepare data for insertion
        resume_data = {
            "user_id": user_id,
            "template_id": request.template_id,
            "title": request.title or "My Resume",
            "resume_data": json.dumps(request.resume_data),  # Convert to JSON string for JSONB
            "is_current": False
        }
        
        # Insert into database
        response = supabase.table("resume_builder_data").insert(resume_data).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=400, detail="Failed to save resume")
        
        saved_resume = response.data[0]
        print(f"💾 RESUME BUILDER: Resume saved successfully with ID: {saved_resume['id']}")
        
        return SaveResumeResponse(
            id=UUID(saved_resume['id']),
            success=True,
            message="Resume saved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ RESUME BUILDER: Error saving resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save resume: {str(e)}")

@router.get("/api/resume-builder/list")
async def list_resumes(user_id: str = Depends(get_current_user)):
    """Get all saved resumes for current user"""
    try:
        print(f"📋 RESUME BUILDER: Listing resumes for user {user_id}")
        
        # Query database with resume_data included for preview
        response = supabase.table("resume_builder_data")\
            .select("id, template_id, title, resume_data, created_at, updated_at, is_current")\
            .eq("user_id", user_id)\
            .order("updated_at", desc=False)\
            .execute()
        
        # Reverse to get newest first
        if response.data:
            response.data.reverse()
        
        if not response.data:
            return []
        
        # Get all templates to map UUID to slug
        templates_res = supabase.table("templates").select("id, slug").execute()
        template_map = {}
        if templates_res.data:
            for t in templates_res.data:
                template_map[t['id']] = t['slug']
        
        # Convert to response with template slug
        resumes = []
        for item in response.data:
            template_uuid = item['template_id']
            # Convert UUID to slug if possible
            template_slug = template_map.get(template_uuid, template_uuid)
            
            resumes.append({
                "id": item['id'],
                "template_id": template_slug,  # Return slug instead of UUID
                "title": item['title'],
                "resume_data": item.get('resume_data', {}),
                "created_at": item['created_at'],
                "updated_at": item['updated_at'],
                "is_current": item.get('is_current', False)
            })
        
        print(f"📋 RESUME BUILDER: Found {len(resumes)} resumes")
        return resumes
        
    except Exception as e:
        print(f"❌ RESUME BUILDER: Error listing resumes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list resumes: {str(e)}")

@router.get("/api/resume-builder/{resume_id}", response_model=ResumeBuilderData)
async def get_resume(resume_id: UUID, user_id: str = Depends(get_current_user)):
    """Load specific resume data by ID"""
    try:
        print(f"📄 RESUME BUILDER: Loading resume {resume_id} for user {user_id}")
        
        # Query database
        response = supabase.table("resume_builder_data")\
            .select("*")\
            .eq("id", str(resume_id))\
            .eq("user_id", user_id)\
            .execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        item = response.data[0]
        
        # Parse resume_data from JSON string
        resume_data_dict = json.loads(item['resume_data']) if isinstance(item['resume_data'], str) else item['resume_data']
        
        # Convert template_id from UUID to slug if it's a UUID
        template_id = item['template_id']
        try:
            # Check if it's a UUID (has dashes and is 36 chars)
            if len(template_id) == 36 and '-' in template_id:
                # Try to fetch slug from templates table
                tpl = supabase.table("templates").select("slug").eq("id", template_id).maybe_single().execute()
                if tpl and hasattr(tpl, 'data') and tpl.data and tpl.data.get("slug"):
                    template_id = tpl.data["slug"]
                    print(f"📄 RESUME BUILDER: Converted template UUID to slug: {template_id}")
        except Exception as e:
            print(f"⚠️ RESUME BUILDER: Could not convert template UUID to slug: {e}")
            # Continue with original template_id
        
        print(f"📄 RESUME BUILDER: Resume loaded successfully")
        return ResumeBuilderData(
            id=UUID(item['id']),
            user_id=UUID(item['user_id']),
            template_id=template_id,
            title=item['title'],
            resume_data=resume_data_dict,
            is_current=item.get('is_current', False),
            created_at=datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')) if item.get('created_at') else None,
            updated_at=datetime.fromisoformat(item['updated_at'].replace('Z', '+00:00')) if item.get('updated_at') else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ RESUME BUILDER: Error loading resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load resume: {str(e)}")

@router.put("/api/resume-builder/{resume_id}", response_model=ResumeBuilderData)
async def update_resume(resume_id: UUID, request: UpdateResumeRequest, user_id: str = Depends(get_current_user)):
    """Update existing resume data"""
    try:
        print(f"✏️ RESUME BUILDER: Updating resume {resume_id} for user {user_id}")
        
        # Build update data
        update_data = {}
        if request.title is not None:
            update_data['title'] = request.title
        if request.resume_data is not None:
            update_data['resume_data'] = json.dumps(request.resume_data)
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update in database
        response = supabase.table("resume_builder_data")\
            .update(update_data)\
            .eq("id", str(resume_id))\
            .eq("user_id", user_id)\
            .execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Resume not found or no changes made")
        
        item = response.data[0]
        
        # Parse resume_data
        resume_data_dict = json.loads(item['resume_data']) if isinstance(item['resume_data'], str) else item['resume_data']
        
        print(f"✏️ RESUME BUILDER: Resume updated successfully")
        return ResumeBuilderData(
            id=UUID(item['id']),
            user_id=UUID(item['user_id']),
            template_id=item['template_id'],
            title=item['title'],
            resume_data=resume_data_dict,
            is_current=item.get('is_current', False),
            created_at=datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')) if item.get('created_at') else None,
            updated_at=datetime.fromisoformat(item['updated_at'].replace('Z', '+00:00')) if item.get('updated_at') else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ RESUME BUILDER: Error updating resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update resume: {str(e)}")

@router.delete("/api/resume-builder/{resume_id}")
async def delete_resume(resume_id: UUID, user_id: str = Depends(get_current_user)):
    """Delete saved resume"""
    try:
        print(f"🗑️ RESUME BUILDER: Deleting resume {resume_id} for user {user_id}")
        
        # Delete from database
        response = supabase.table("resume_builder_data")\
            .delete()\
            .eq("id", str(resume_id))\
            .eq("user_id", user_id)\
            .execute()
        
        print(f"🗑️ RESUME BUILDER: Resume deleted successfully")
        return {
            "success": True,
            "message": "Resume deleted successfully"
        }
        
    except Exception as e:
        print(f"❌ RESUME BUILDER: Error deleting resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete resume: {str(e)}")

# Templates API Endpoints

@router.get("/api/templates")
async def list_templates(user_id: str = Depends(get_current_user)):
    """List all available resume templates"""
    try:
        print(f"📋 TEMPLATES: Listing templates for user {user_id}")
        
        # Get all active templates from database
        response = supabase.table("templates")\
            .select("id, name, slug, schema, preview_url, is_active, created_at, updated_at")\
            .eq("is_active", True)\
            .execute()
        
        if not response.data:
            print(f"📋 TEMPLATES: No templates found")
            return []
        
        # Format templates for frontend
        templates = []
        for template in response.data:
            schema = template.get("schema", {})
            if isinstance(schema, str):
                try:
                    schema = json.loads(schema)
                except:
                    schema = {}
            
            # Extract metadata from schema if available
            metadata = schema.get("metadata", {}) if isinstance(schema, dict) else {}
            
            templates.append({
                "id": template.get("id"),
                "slug": template.get("slug"),
                "name": template.get("name") or metadata.get("name", "Untitled Template"),
                "description": metadata.get("description", ""),
                "category": metadata.get("category", "professional"),
                "badge": metadata.get("badge"),
                "preview_url": template.get("preview_url"),
                "colors": metadata.get("colors", []),
                "is_active": template.get("is_active", True),
            })
        
        print(f"📋 TEMPLATES: Found {len(templates)} template(s)")
        return templates
        
    except Exception as e:
        print(f"❌ TEMPLATES: Error listing templates: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list templates: {str(e)}")

@router.get("/api/templates/{template_id}")
async def get_template(template_id: str, user_id: str = Depends(get_current_user)):
    """Get template details by slug or ID"""
    try:
        print(f"📋 TEMPLATES: Getting template {template_id} for user {user_id}")
        
        # Try to find template by slug first (most common case)
        response = supabase.table("templates")\
            .select("id, name, slug, schema, preview_url, is_active, created_at, updated_at")\
            .eq("slug", template_id)\
            .eq("is_active", True)\
            .maybe_single()\
            .execute()
        
        # If not found by slug, try by ID (UUID)
        if not response.data:
            try:
                # Check if template_id is a valid UUID
                UUID(template_id)
                response = supabase.table("templates")\
                    .select("id, name, slug, schema, preview_url, is_active, created_at, updated_at")\
                    .eq("id", template_id)\
                    .eq("is_active", True)\
                    .maybe_single()\
                    .execute()
            except ValueError:
                # Not a valid UUID, continue with slug search result (which is None)
                pass
        
        if not response.data:
            print(f"❌ TEMPLATES: Template {template_id} not found")
            raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
        
        template = response.data
        
        # Parse schema if it's a string
        schema = template.get("schema", {})
        if isinstance(schema, str):
            try:
                schema = json.loads(schema)
            except:
                schema = {}
        
        # Return template with schema
        result = {
            "id": template.get("id"),
            "slug": template.get("slug"),
            "name": template.get("name"),
            "schema": schema,
            "preview_url": template.get("preview_url"),
            "is_active": template.get("is_active", True),
        }
        
        print(f"📋 TEMPLATES: Template {template_id} found successfully")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ TEMPLATES: Error getting template {template_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get template: {str(e)}")
