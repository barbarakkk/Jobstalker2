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
    description: str

class Education(BaseModel):
    id: str
    school: str
    degree: str
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
    targetRole: Optional[str] = None

class ResumeData(BaseModel):
    personalInfo: PersonalInfo
    summary: str
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
    target_role: Optional[str] = None

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
                                education: List[Education], skills: List[Skill], target_role: Optional[str] = None) -> str:
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
        education_text += f"- {edu.degree} in {edu.field} from {edu.school}\n"
    
    skills_text = ", ".join([skill.name for skill in skills])
    
    prompt = f"""
    Create a compelling professional summary for a resume based on the following information:
    
    Name: {personal_info.firstName} {personal_info.lastName}
    Job Title: {personal_info.jobTitle or 'Professional'}
    Target Role: {target_role or 'General professional role'}
    
    Work Experience:
    {experience_text}
    
    Education:
    {education_text}
    
    Skills: {skills_text}
    
    Write a 3-4 sentence professional summary that:
    1. Highlights key achievements and experience
    2. Shows relevant skills for the target role
    3. Demonstrates value proposition
    4. Uses action-oriented language
    5. Is tailored for the target role if specified
    
    Keep it concise, professional, and impactful.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert resume writer. Create compelling professional summaries."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating summary: {str(e)}")
        return f"Experienced {personal_info.jobTitle or 'professional'} with expertise in {', '.join([skill.name for skill in skills[:3]])}."

def enhance_work_experience(work_experience: List[WorkExperience], target_role: Optional[str] = None) -> List[WorkExperience]:
    """Enhance work experience descriptions using AI"""
    client = get_openai_client()
    enhanced_experience = []
    
    for exp in work_experience:
        if not exp.description or len(exp.description.strip()) < 20:
            # Generate description if missing or too short
            target_role_context = f"Target Role: {target_role}" if target_role else "Target Role: General professional role"
            
            prompt = f"""
            Create a professional job description tailored specifically for the target role.
            
            {target_role_context}
            Job Title: {exp.title}
            Company: {exp.company}
            Duration: {exp.startDate} - {exp.endDate if not exp.isCurrent else 'Present'}
            Current Description: {exp.description or 'No description provided'}
            
            CRITICAL: Tailor the language, terminology, and emphasis to match the target role:
            - Use industry-specific terminology for the target role
            - Emphasize skills and achievements relevant to the target role
            - Frame responsibilities to highlight transferable skills that apply to the target role
            - Use action verbs appropriate for the target role industry
            
            Write 3-4 bullet points that:
            1. Use action verbs appropriate for the target role
            2. Highlight skills and responsibilities relevant to the target role
            3. Show impact and results (if mentioned in current description)
            4. Use terminology that resonates with the target role industry
            5. Sound professional and compelling for the target role
            
            Format as bullet points, each starting with a strong action verb.
            """
            
            system_message = f"You are an expert resume writer specializing in {target_role if target_role else 'professional'} roles. Create compelling job descriptions tailored specifically for {target_role if target_role else 'the target position'}."
            
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
            except Exception as e:
                print(f"Error enhancing experience: {str(e)}")
                enhanced_description = exp.description or "• Responsible for key duties and achieved measurable results"
        else:
            enhanced_description = exp.description
        
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
        print(f"🤖 AI RESUME: Target role: {request.targetRole}")
        
        # Generate professional summary
        summary = request.summary
        if not summary or len(summary.strip()) < 20:
            summary = generate_professional_summary(
                request.personalInfo,
                request.workExperience,
                request.education,
                request.skills,
                request.targetRole
            )
        
        # Enhance work experience descriptions
        enhanced_experience = enhance_work_experience(request.workExperience, request.targetRole)
        
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
        
        # Check if impact/results were provided
        has_impact = questionnaire.impact_results and questionnaire.impact_results.strip() and questionnaire.impact_results.lower() not in ['none', 'none provided', 'n/a', 'na']
        
        target_role_context = f"Target Role: {questionnaire.target_role}" if questionnaire.target_role else "Target Role: Not specified"
        
        prompt = f"""
        You are an expert resume writer specializing in crafting compelling, professional work experience descriptions. Transform the user's work experience into polished, impactful bullet points that stand out to recruiters.

        {target_role_context}
        Job Title: {questionnaire.job_title}
        Company: {questionnaire.company}
        
        What they did: {questionnaire.what_did_you_do}
        Impact/results: {questionnaire.impact_results if has_impact else 'NOT PROVIDED - DO NOT ADD ANY METRICS OR RESULTS'}
        User's skills: {', '.join(user_skills) if user_skills else 'None listed'}
        
        CRITICAL REQUIREMENTS FOR PROFESSIONAL OUTPUT:
        1. Use powerful, industry-appropriate action verbs (Led, Architected, Optimized, Transformed, Spearheaded, Implemented, Delivered, etc.)
        2. Start each bullet with a strong action verb - avoid weak verbs like "Helped", "Assisted", "Worked on"
        3. Use industry-specific terminology and technical language appropriate for the target role
        4. Write in past tense (unless current role) with confident, achievement-oriented language
        5. Each bullet should be 12-25 words - substantial enough to show impact
        6. Use parallel structure across bullets for professional appearance
        
        OUTPUT FORMAT:
        - Generate 2-3 bullet points
        - Each bullet MUST start with a bullet symbol (•)
        - Format: "• [Action verb] [description with metrics if available]"
        - Include metrics/percentages in ONE sentence per bullet when impact is provided
        - Place metrics at the end of the bullet for maximum impact
        
        PROFESSIONAL WRITING STANDARDS:
        - Use quantifiable language when impact is provided (e.g., "increased efficiency by 40%", "reduced costs by $50K", "improved performance by 25%")
        - Include scope/scale when relevant (team size, project size, budget, etc.)
        - Show progression and growth when applicable
        - Highlight technical depth and complexity
        - Emphasize leadership, collaboration, and strategic thinking when relevant
        - Use professional terminology: "collaborated" not "worked with", "delivered" not "did", "architected" not "made"
        
        TAILORING FOR TARGET ROLE:
        - If target role is "Software Developer/Engineer": emphasize technical architecture, code quality, system design, scalability, best practices
        - If target role is "Data Analyst/Scientist": emphasize data insights, statistical analysis, visualization, predictive modeling, business intelligence
        - If target role is "Project Manager": emphasize stakeholder management, delivery, risk mitigation, team coordination, strategic planning
        - If target role is "Product Manager": emphasize product strategy, user research, roadmap planning, cross-functional collaboration, metrics-driven decisions
        - If target role is "Designer": emphasize user experience, design systems, creative problem-solving, user research, visual design
        - Use terminology that resonates with the target role's industry and level
        
        IMPACT/RESULTS HANDLING:
        {"- CRITICAL: When impact/results are provided, include the metrics/percentages in ONE sentence within the relevant bullet point" if has_impact else "- DO NOT mention any impact, results, metrics, or achievements - focus ONLY on what they did"}
        {"- Format metrics naturally: 'increased X by Y%', 'reduced Z by $W', 'improved performance by N%', 'achieved M% success rate'" if has_impact else ""}
        {"- Place metrics at the end of the bullet for maximum impact" if has_impact else ""}
        
        SKILL INTEGRATION:
        - Naturally weave in relevant skills from the user's skill list when they align with the description
        - Prioritize skills that are most relevant to the target role
        - Use technical skill names appropriately (e.g., "React", "Python", "AWS") when contextually relevant
        
        ABSOLUTE PROHIBITIONS:
        - NO percentages, metrics, or numbers unless explicitly provided in "Impact/results"
        - NO generic filler phrases ("responsible for", "duties included", "helped with")
        - NO achievements/results language (resulting in, leading to, contributed to) unless impact is provided
        - NO typical job responsibilities that weren't mentioned in "What they did"
        - NO first-person language (I, my, me) - use third person or implied subject
        - NO casual language or slang
        
        EXAMPLES OF PROFESSIONAL OUTPUT:
        
        Example 1 (Software Developer, with impact):
        User input: "I wrote code for the website and fixed bugs" + Impact: "improved performance by 30%"
        Output:
        • Architected and developed responsive web applications using modern JavaScript frameworks, improving system performance by 30%
        • Debugged and resolved critical production issues, ensuring 99.9% system uptime and optimal user experience
        • Collaborated with cross-functional teams to implement new features, reducing development cycle time by 25%
        
        Example 2 (Data Analyst, with impact):
        User input: "I analyzed sales data and created reports" + Impact: "helped increase sales by 25%"
        Output:
        • Analyzed complex sales datasets to identify trends and generate actionable business insights, resulting in 25% sales increase
        • Developed automated reporting dashboards that reduced reporting time by 40% and improved data accuracy
        • Presented findings to executive leadership, influencing strategic business initiatives and driving revenue growth
        
        Example 3 (Project Manager, with impact):
        User input: "I managed projects and coordinated with team members" + Impact: "delivered projects on time with 95% success rate"
        Output:
        • Led end-to-end project execution for 15+ projects, coordinating cross-functional teams and achieving 95% on-time delivery success rate
        • Established project governance frameworks and risk mitigation strategies, reducing project delays by 30%
        • Facilitated stakeholder communication and managed expectations, maintaining 95% client satisfaction rate
        
        Now generate 2-3 professional, impactful bullet points with bullet symbols (•). Make it compelling, specific, and tailored to the target role. {"Include metrics and percentages when impact is provided." if has_impact else "Focus only on responsibilities - no metrics."}
        """
        
        system_message = f"""You are an expert resume writer with 15+ years of experience crafting compelling work experience descriptions for Fortune 500 companies. 
        Your writing is:
        - Professional and polished
        - Industry-specific and technically accurate
        - Achievement-oriented and impactful
        - Tailored to the target role
        - Free of generic filler language
        
        Generate 2-3 professional bullet points with bullet symbols (•). Use strong action verbs, industry terminology, and highlight technical depth. 
        {"Include metrics and percentages when impact/results are provided, placing them in one sentence per bullet." if has_impact else "NO percentages, metrics, or achievements unless explicitly provided by the user."}"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            max_tokens=250,
            temperature=0.3
        )
        
        description = response.choices[0].message.content.strip()
        
        # Post-process to ensure maximum 3 bullets, keep bullet symbols, and clean up formatting
        lines = description.split('\n')
        # Get all non-empty lines and ensure they have bullet symbols
        bullet_lines = []
        for line in lines:
            cleaned = line.strip()
            if cleaned:
                # Ensure bullet symbol is present, add if missing
                if not re.match(r'^[•\-\*\u2022\u2023\u25E6\u2043\u2219]', cleaned):
                    cleaned = '• ' + cleaned
                else:
                    # Normalize to use • symbol
                    cleaned = re.sub(r'^[•\-\*\u2022\u2023\u25E6\u2043\u2219]\s*', '• ', cleaned)
                bullet_lines.append(cleaned)
        
        # If impact wasn't provided, remove any metrics/percentages that might have been hallucinated
        if not has_impact:
            final_bullets = []
            for bullet in bullet_lines:
                # Remove percentage patterns unless they're part of skill names (like "C++")
                cleaned = re.sub(r'\b\d+%', '', bullet)
                cleaned = re.sub(r'\b\d+\s*(percent|percentage)', '', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'\b(increased|decreased|reduced|improved|enhanced)\s+by\s+\d+', '', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'\b(resulting in|leading to|contributing to)\s+[^,]+', '', cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r'\s+', ' ', cleaned).strip()  # Clean up extra spaces
                if cleaned:
                    final_bullets.append(cleaned)
            bullet_lines = final_bullets
        
        if len(bullet_lines) > 3:
            # Take only the first 3 bullets
            description = '\n'.join(bullet_lines[:3])
            print(f"⚠️ AI WORK DESC: Generated {len(bullet_lines)} bullets, truncated to 3")
        else:
            description = '\n'.join(bullet_lines)
        
        print(f"🤖 AI WORK DESC: Description generated successfully")
        
        return WorkDescriptionResponse(
            description=description,
            success=True
        )
    except Exception as e:
        print(f"❌ AI WORK DESC: Error generating description: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate description: {str(e)}")

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

@router.get("/api/resume-builder/list", response_model=List[ResumeBuilderItem])
async def list_resumes(user_id: str = Depends(get_current_user)):
    """Get all saved resumes for current user"""
    try:
        print(f"📋 RESUME BUILDER: Listing resumes for user {user_id}")
        
        # Query database
        response = supabase.table("resume_builder_data")\
            .select("id, template_id, title, created_at, updated_at, is_current")\
            .eq("user_id", user_id)\
            .order("updated_at", desc=False)\
            .execute()
        
        # Reverse to get newest first
        if response.data:
            response.data.reverse()
        
        if not response.data:
            return []
        
        # Convert to response models
        resumes = []
        for item in response.data:
            resumes.append(ResumeBuilderItem(
                id=UUID(item['id']),
                template_id=item['template_id'],
                title=item['title'],
                created_at=datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')),
                updated_at=datetime.fromisoformat(item['updated_at'].replace('Z', '+00:00')),
                is_current=item.get('is_current', False)
            ))
        
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

