import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppHeader } from '@/components/Layout/AppHeader';
import { useResumeBuilder } from '@/components/ResumeBuilder/context/ResumeBuilderContext';
import { Plus, Trash2, Loader2, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { wizardApi } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';

interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  jobType?: string;
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  level?: string;
}

interface Language {
  name: string;
  proficiency: string;
}

export function AIGeneratePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template') || 'modern-professional';
  const { setSelectedTemplate } = useResumeBuilder();
  const [wizardSessionId, setWizardSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(true);

  // Form state
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    jobTitle: '',
    professionalSummary: ''
  });

  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([
    { platform: 'LinkedIn', url: '' }
  ]);

  const [summary, setSummary] = useState('');
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [targetRole, setTargetRole] = useState('');

  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);

  // Questionnaire state for work experience description
  const [showQuestionnaireDialog, setShowQuestionnaireDialog] = useState<string | null>(null); // Store exp.id when dialog is open
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState({
    whatDidYouDo: '',
    impactResults: '',
  });
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Wizard steps state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;

  useEffect(() => {
    setSelectedTemplate(templateId as any);
    createWizardSession();
  }, [templateId, setSelectedTemplate]);

  const steps = [
    { id: 1, name: 'Personal Info', description: 'Basic information' },
    { id: 2, name: 'Social Links', description: 'Social & professional profiles' },
    { id: 3, name: 'Skills', description: 'Professional skills' },
    { id: 4, name: 'Education', description: 'Education background' },
    { id: 5, name: 'Experience', description: 'Work history' },
    { id: 6, name: 'Languages', description: 'Language proficiencies' },
    { id: 7, name: 'Target Role', description: 'Target position' },
    { id: 8, name: 'Summary', description: 'Professional summary' },
  ];

  // Zod schemas per step
  const personalInfoSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    location: z.string().optional(),
    jobTitle: z.string().optional(),
    professionalSummary: z.string().optional(),
  });

  const workItemSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1, 'Job title is required'),
    company: z.string().min(1, 'Company is required'),
    location: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isCurrent: z.boolean().optional(),
    description: z.string().optional(),
  });

  const educationItemSchema = z.object({
    id: z.string().min(1),
    school: z.string().min(1, 'School is required'),
    degree: z.string().min(1, 'Degree is required'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  });

  const skillsSchema = z.array(z.object({ id: z.string(), name: z.string().min(1), category: z.string().optional() }));
  const languagesSchema = z.array(z.object({ name: z.string().min(1), proficiency: z.string().min(1) }));

  const validateStep = (step: number): boolean => {
    try {
      setErrors([]);
      if (step === 1) {
        console.log('🔍 Validating Step 1 - Personal Info:', {
          firstName: personalInfo.firstName,
          lastName: personalInfo.lastName,
          email: personalInfo.email,
          firstNameLength: personalInfo.firstName?.length,
          lastNameLength: personalInfo.lastName?.length,
          emailLength: personalInfo.email?.length
        });
        personalInfoSchema.parse(personalInfo);
        console.log('✅ Step 1 validation passed');
      } else if (step === 2) {
        // Social Links step - no validation needed (optional)
        return true;
      } else if (step === 3) {
        // Skills step - optional, validate if entries exist
        const filledSkills = skills.filter(s => s.name.trim().length > 0);
        // Only validate filled entries
        if (filledSkills.length > 0) {
          skillsSchema.parse(filledSkills);
        }
      } else if (step === 4) {
        // Filter out empty education entries (where school and degree are both empty)
        const filledEducation = education.filter(e => 
          (e.school && e.school.trim().length > 0) || (e.degree && e.degree.trim().length > 0)
        );
        // Only validate filled entries
        filledEducation.forEach((e) => educationItemSchema.parse(e));
      } else if (step === 5) {
        // Filter out empty work experience entries (where title and company are both empty)
        const filledWorkExp = workExperience.filter(w => 
          (w.title && w.title.trim().length > 0) || (w.company && w.company.trim().length > 0)
        );
        // Only validate filled entries
        filledWorkExp.forEach((w) => workItemSchema.parse(w));
      } else if (step === 6) {
        // Filter out empty languages before validation
        const filledLanguages = languages.filter(l => l.name.trim().length > 0);
        // Only validate filled entries
        if (filledLanguages.length > 0) {
          languagesSchema.parse(filledLanguages);
        }
      } else if (step === 8) {
        console.log('🔍 Validating Step 8 - Professional Summary:', {
          summary: summary,
          summaryLength: summary?.trim().length
        });
        if (!summary || !summary.trim()) {
          setErrors(['Professional Summary is required. Please tell us about yourself.']);
          console.log('❌ Step 8 validation failed: Summary is empty');
          return false;
        }
        console.log('✅ Step 8 validation passed');
      }
      return true;
    } catch (e: any) {
      console.error('❌ Validation error for step', step, ':', e);
      const msgs = e?.issues?.map((i: any) => {
        const field = i.path?.join('.') || 'field';
        return `${field}: ${i.message}`;
      }) || ['Validation failed'];
      console.error('❌ Validation error messages:', msgs);
      setErrors(msgs);
      return false;
    }
  };

  // Debounced autosave of draft to wizard session
  useEffect(() => {
    if (!wizardSessionId) return;
    setSaving(true);
    setSavingError(null);
    const handle = setTimeout(async () => {
      try {
        const draftPatch: any = {
          profile: {
            fullName: `${personalInfo.firstName} ${personalInfo.lastName}`.trim(),
            headline: personalInfo.jobTitle,
            summary: summary || personalInfo.professionalSummary,
            professionalSummary: personalInfo.professionalSummary,
            location: personalInfo.location,
            email: personalInfo.email,
            phone: personalInfo.phone,
            socialLinks: socialLinks.filter(link => link.url.trim() !== ''),
          },
          experience: workExperience.map(e => ({
            id: e.id,
            title: e.title,
            company: e.company,
            location: e.location,
            startDate: e.startDate,
            endDate: e.endDate,
            isCurrent: e.isCurrent,
            jobType: e.jobType,
            description: e.description,
          })),
          education: education.map(e => ({
            id: e.id,
            school: e.school,
            degree: e.degree,
            startDate: e.startDate,
            endDate: e.endDate,
          })),
          skills: skills.filter(s => s.name.trim().length > 0).map(s => s.name),
          languages: languages.filter(l => l.name.trim().length > 0),
          targetRole,
        };
        await wizardApi.patchSession(wizardSessionId, draftPatch, { [`step${currentStep}`]: true }, currentStep);
        setSaving(false);
      } catch (err: any) {
        console.error('Autosave failed', err);
        setSaving(false);
        setSavingError(err?.message || 'Failed to save');
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [wizardSessionId, personalInfo, summary, workExperience, education, skills, languages, targetRole, currentStep]);

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(personalInfo.firstName && personalInfo.lastName && personalInfo.email);
      case 2:
        return true; // Social Links are optional
      case 3:
        return true; // Skills are optional
      case 4:
        return true; // Education is optional
      case 5:
        return true; // Work experience is optional but validate if entries exist
      case 6:
        return true; // Languages are optional
      case 7:
        return true; // Target role is optional
      case 8:
        return !!summary.trim(); // Summary is required
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep() && validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (step: number) => {
    // Allow going back to previous steps, validate forward navigation
    if (step < currentStep || validateCurrentStep()) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const addWorkExperience = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      jobType: '',
      description: ''
    };
    setWorkExperience([...workExperience, newExp]);
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    // Convert date values to YYYY-MM format for month inputs
    let processedValue = value;
    if ((field === 'startDate' || field === 'endDate') && value) {
      // If value is in YYYY-MM-DD format, convert to YYYY-MM
      if (typeof value === 'string' && value.length === 10 && value.includes('-')) {
        processedValue = value.substring(0, 7); // Extract YYYY-MM
      }
    }
    
    setWorkExperience(workExperience.map(exp => 
      exp.id === id ? { ...exp, [field]: processedValue } : exp
    ));
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperience(workExperience.filter(exp => exp.id !== id));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      school: '',
      degree: '',
      startDate: '',
      endDate: ''
    };
    setEducation([...education, newEdu]);
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    // Convert date values to YYYY-MM format for month inputs
    let processedValue = value;
    if ((field === 'startDate' || field === 'endDate') && value) {
      // If value is in YYYY-MM-DD format, convert to YYYY-MM
      if (typeof value === 'string' && value.length === 10 && value.includes('-')) {
        processedValue = value.substring(0, 7); // Extract YYYY-MM
      }
    }
    
    setEducation(education.map(edu => 
      edu.id === id ? { ...edu, [field]: processedValue } : edu
    ));
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id));
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: '',
      category: 'Technical',
      level: 'Intermediate'
    };
    setSkills([...skills, newSkill]);
  };

  const updateSkill = (id: string, field: keyof Skill, value: any) => {
    setSkills(skills.map(skill => 
      skill.id === id ? { ...skill, [field]: value } : skill
    ));
  };

  const removeSkill = (id: string) => {
    setSkills(skills.filter(skill => skill.id !== id));
  };

  const addLanguage = () => {
    setLanguages([...languages, { name: '', proficiency: 'Native' }]);
  };

  const updateLanguage = (index: number, field: keyof Language, value: any) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: value };
    setLanguages(updated);
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const { generateWithAI } = useResumeBuilder();

  // Helper function to get auth token
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Function to generate description from questionnaire
  const generateDescriptionFromQuestionnaire = async (expId: string) => {
    const exp = workExperience.find(e => e.id === expId);
    if (!exp || !exp.title || !exp.company) {
      alert('Please fill in Job Title and Company first');
      return;
    }

    if (!questionnaireAnswers.whatDidYouDo.trim()) {
      alert('Please answer "What did you do in this role?" - it is required');
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const token = await getAuthToken();
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
        (import.meta.env.DEV ? 'http://localhost:8000' : 'https://jobstalker2-production.up.railway.app');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/generate-work-description`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          job_title: exp.title,
          company: exp.company,
          what_did_you_do: questionnaireAnswers.whatDidYouDo,
          impact_results: questionnaireAnswers.impactResults || undefined,
          target_role: targetRole || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '60';
          const rateLimit = response.headers.get('X-RateLimit-Limit') || '30';
          const retrySeconds = parseInt(retryAfter, 10);
          const retryMinutes = Math.ceil(retrySeconds / 60);
          throw new Error(`Rate limit exceeded. You can make up to ${rateLimit} AI requests per minute. Please wait ${retryMinutes} minute${retryMinutes > 1 ? 's' : ''} before trying again.`);
        }
        
        throw new Error(errorData.detail || `Failed to generate description (${response.status})`);
      }

      const result = await response.json();
      updateWorkExperience(expId, 'description', result.description);
      setShowQuestionnaireDialog(null);
      setQuestionnaireAnswers({
        whatDidYouDo: '',
        impactResults: '',
      });
    } catch (error) {
      console.error('Error generating description:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate description. Please try again.';
      alert(errorMessage);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const createWizardSession = async () => {
    setSessionError(null);
    setIsCreatingSession(true);
    
    // Optimistically load user email from auth immediately (fast, no API call needed)
    let userEmail = '';
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userEmail = user?.email || '';
      
      // Prefill basic info immediately with email while session loads
      if (userEmail) {
        setPersonalInfo(prev => ({
          ...prev,
          email: userEmail
        }));
      }
    } catch (e) {
      console.warn('Could not fetch user email:', e);
    }
    
    try {
      console.log('Creating wizard session with templateId:', templateId);
      const res = await wizardApi.createSession(templateId, true);
      console.log('Wizard session created successfully:', res);
      setWizardSessionId(res.id);
      setSessionError(null);
      setIsCreatingSession(false);
      
      // Optionally hydrate local state from draftJson if present
      const draft = res.draftJson || {} as any;
      const profile = draft.profile || {};
      
      if (profile.summary && typeof profile.summary === 'string') {
        setSummary(profile.summary);
      }
      
      // Prefill personal info from profile (now with all data from backend)
      setPersonalInfo({
        firstName: profile.firstName || profile.fullName?.split(' ')[0] || '',
        lastName: profile.lastName || profile.fullName?.split(' ').slice(1).join(' ') || '',
        email: profile.email || userEmail,
        phone: profile.phone || '',
        location: profile.location || '',
        jobTitle: profile.headline || '',
        professionalSummary: profile.professionalSummary || profile.summary || ''
      });
      // Load social links if available
      if (profile.socialLinks && Array.isArray(profile.socialLinks)) {
        setSocialLinks(profile.socialLinks.length > 0 ? profile.socialLinks : [{ platform: 'LinkedIn', url: '' }]);
      }
      if (Array.isArray(draft.experience) && draft.experience.length > 0) {
        // Convert date strings to YYYY-MM format for month inputs
        const formatDateForMonth = (dateStr: string) => {
          if (!dateStr) return '';
          if (dateStr.length === 10 && dateStr.includes('-')) {
            return dateStr.substring(0, 7); // Extract YYYY-MM from YYYY-MM-DD
          }
          return dateStr;
        };
        
        setWorkExperience(draft.experience.map((e: any, idx: number) => ({
          id: e.id || `exp-${Date.now()}-${idx}`,
          title: e.title || '',
          company: e.company || '',
          location: e.location || '',
          startDate: formatDateForMonth(e.startDate || ''),
          endDate: formatDateForMonth(e.endDate || ''),
          isCurrent: !!e.isCurrent,
          jobType: e.jobType || '',
          description: e.description || ''
        })));
      }
      if (Array.isArray(draft.education) && draft.education.length > 0) {
        // Convert date strings to YYYY-MM format for month inputs
        const formatDateForMonth = (dateStr: string) => {
          if (!dateStr) return '';
          if (dateStr.length === 10 && dateStr.includes('-')) {
            return dateStr.substring(0, 7); // Extract YYYY-MM from YYYY-MM-DD
          }
          return dateStr;
        };
        
        setEducation(draft.education.map((e: any, idx: number) => ({
          id: e.id || `edu-${Date.now()}-${idx}`,
          school: e.school || '',
          degree: e.degree || '',
          startDate: formatDateForMonth(e.startDate || ''),
          endDate: formatDateForMonth(e.endDate || '')
        })));
      }
      if (Array.isArray(draft.skills) && draft.skills.length > 0) {
        setSkills(draft.skills.map((s: any, idx: number) => ({
          id: s.id || `skill-${Date.now()}-${idx}`,
          name: typeof s === 'string' ? s : (s.name || ''),
          category: (s.category || 'Technical')
        })));
      }
      if (Array.isArray(draft.languages) && draft.languages.length > 0) {
        setLanguages(draft.languages.map((l: any) => ({
          name: l.name || '',
          proficiency: l.proficiency || 'Native'
        })));
      }
      if (typeof draft.targetRole === 'string') {
        setTargetRole(draft.targetRole);
      }
    } catch (e: any) {
      console.error('Failed to create wizard session', e);
      let errorMessage = 'Failed to create wizard session. Please refresh the page.';
      
      if (e instanceof Error) {
        errorMessage = e.message;
        // If template not found, provide more helpful message
        if (e.message.includes('Template not found') || e.message.includes('Not Found')) {
          errorMessage = `Template "${templateId}" not found. Please select a template from the template selection page.`;
        }
      }
      
      setSessionError(errorMessage);
      setIsCreatingSession(false);
      console.error('Session creation error details:', {
        error: e,
        message: errorMessage,
        templateId: templateId,
        stack: e instanceof Error ? e.stack : 'No stack trace'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 handleSubmit called - Starting resume generation...');
    setIsGenerating(true);
    setErrors([]);
    
    // Validate all required steps
    console.log('📋 Validating steps...');
    const step1Valid = validateStep(1);
    const step2Valid = validateStep(2); // Social Links - optional
    const step3Valid = validateStep(3); // Skills - optional
    const step4Valid = validateStep(4); // Education - optional
    const step5Valid = validateStep(5); // Experience - optional
    const step6Valid = validateStep(6); // Languages - optional
    const step8Valid = validateStep(8); // Summary - required
    
    console.log('✅ Validation results:', { step1Valid, step2Valid, step3Valid, step4Valid, step5Valid, step6Valid, step8Valid });
    
    if (!step1Valid || !step8Valid) {
      console.warn('❌ Validation failed, stopping submission');
      setIsGenerating(false);
      
      // Show popup dialog with validation errors
      setShowValidationDialog(true);
      
      // Navigate to the first step with errors
      if (!step1Valid) {
        console.log('📍 Navigating to Step 1 to fix validation errors');
        setCurrentStep(1);
      } else if (!step8Valid) {
        console.log('📍 Navigating to Step 8 to fix validation errors');
        setCurrentStep(8);
      }
      
      // Errors are already set by validateStep
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      if (!wizardSessionId) {
        console.error('❌ No wizard session ID found');
        throw new Error('Session not ready. Please refresh the page and try again.');
      }
      
      console.log('✅ Wizard session ID:', wizardSessionId);
      
      // Save final step data before completing
      console.log('Saving final step data before completion...');
      const draftPatch: any = {
        profile: {
          fullName: `${personalInfo.firstName} ${personalInfo.lastName}`.trim(),
          headline: personalInfo.jobTitle,
          summary: summary || personalInfo.professionalSummary,
          professionalSummary: personalInfo.professionalSummary,
          location: personalInfo.location,
          email: personalInfo.email,
          phone: personalInfo.phone,
          socialLinks: socialLinks.filter(link => link.url.trim() !== ''),
        },
        experience: workExperience.map(e => ({
          id: e.id,
          title: e.title,
          company: e.company,
          location: e.location,
          startDate: e.startDate,
          endDate: e.endDate,
          isCurrent: e.isCurrent,
          jobType: e.jobType,
          description: e.description,
        })),
        education: education.map(e => ({
          id: e.id,
          school: e.school,
          degree: e.degree,
          startDate: e.startDate,
          endDate: e.endDate,
        })),
        skills: skills.filter(s => s.name.trim().length > 0).map(s => s.name),
        languages: languages.filter(l => l.name.trim().length > 0),
        targetRole,
      };
      
      await wizardApi.patchSession(wizardSessionId, draftPatch, { step8: true }, 8);
      console.log('Final step data saved');
      
      console.log('Completing wizard session:', wizardSessionId);
      const res = await wizardApi.completeSession(wizardSessionId);
      console.log('Session completed, response:', res);
      // Ensure the chosen template is active in context and URL
      try {
        setSelectedTemplate(templateId as any);
      } catch (_) {}
      
      // Prefer resumeBuilderId as it's compatible with the editor
      // Fall back to generatedResumeId if resumeBuilderId is not available
      const savedResumeId = res.resumeBuilderId || res.generatedResumeId;
      
      if (!savedResumeId) {
        throw new Error('Failed to get resume ID from server response');
      }
      
      console.log('✅ Navigating to edit page with resume ID:', savedResumeId, 'Type:', res.resumeBuilderId ? 'resume-builder' : 'generated-resume');
      const editUrl = `/resume-builder/edit?resume=${savedResumeId}&template=${encodeURIComponent(templateId)}`;
      console.log('📍 Navigation URL:', editUrl);
      navigate(editUrl);
    } catch (error) {
      console.error('❌ Error generating resume:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        error
      });
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate resume. Please try again.';
      setErrors([errorMessage]);
      setShowValidationDialog(true); // Show popup for errors too
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      console.log('🏁 handleSubmit finished, setting isGenerating to false');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader active="resume" />
      
      {/* Validation Error Popup Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-xl font-bold text-red-900">Required Fields Missing</DialogTitle>
            </div>
            <DialogDescription className="text-gray-600 pt-2">
              Please fill in all required fields before generating your resume. You've been taken to the step with errors.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Missing or invalid fields:</p>
            <ul className="space-y-2">
              {errors.map((err, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-500 mt-1">•</span>
                  <span className="flex-1">{err}</span>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowValidationDialog(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Got it, I'll fix these
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Resume Generator</h1>
          <p className="text-gray-600 mt-2">
            Fill in your information step by step and our AI will generate a professional resume for you.
          </p>
          {/* Wizard flow: Personal Info → Experience → Education → Skills → Summary → Target Role */}
          {/* Build: v0.0.6 - Production deployment trigger */}
            <div className="mt-2 flex items-center gap-2">
              {wizardSessionId ? (
                <span className="text-sm text-green-600">Session ready • {saving ? 'Saving…' : 'Saved'}{savingError ? ` • ${savingError}` : ''}</span>
              ) : isCreatingSession ? (
                <span className="text-sm text-gray-500">Starting session…</span>
              ) : sessionError ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">Session error: {sessionError}</span>
                  <button
                    type="button"
                    onClick={createWizardSession}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-yellow-600">Session not ready</span>
                  <button
                    type="button"
                    onClick={createWizardSession}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Create Session
                  </button>
                </div>
              )}
            </div>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="mb-8">
          {/* Desktop: Full step indicator */}
          <div className="hidden md:flex items-start justify-between mb-4 w-full">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start flex-1" style={{ minWidth: 0 }}>
                <div className="flex flex-col items-center flex-1 w-full">
                  <button
                    type="button"
                    onClick={() => goToStep(step.id)}
                    disabled={!validateCurrentStep() && step.id > currentStep}
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 flex-shrink-0",
                      currentStep === step.id
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-110"
                        : currentStep > step.id
                        ? "bg-green-500 border-green-500 text-white cursor-pointer hover:scale-105"
                        : "bg-white border-gray-300 text-gray-400 cursor-pointer hover:border-gray-400",
                      step.id > currentStep && !validateCurrentStep() && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <span className="font-semibold">{step.id}</span>
                    )}
                  </button>
                  <div className="mt-2 text-center w-full">
                    <p className={cn(
                      "text-xs font-medium truncate",
                      currentStep === step.id ? "text-blue-600" : currentStep > step.id ? "text-green-600" : "text-gray-400"
                    )}>
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 hidden lg:block truncate">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Mobile: Simplified step indicator */}
          <div className="md:hidden mb-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <button
                      type="button"
                      onClick={() => goToStep(step.id)}
                      disabled={!validateCurrentStep() && step.id > currentStep}
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 text-xs",
                        currentStep === step.id
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-110"
                          : currentStep > step.id
                          ? "bg-green-500 border-green-500 text-white cursor-pointer"
                          : "bg-white border-gray-300 text-gray-400 cursor-pointer",
                        step.id > currentStep && !validateCurrentStep() && "cursor-not-allowed opacity-50"
                      )}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="font-semibold text-xs">{step.id}</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-center">
              <p className={cn(
                "text-sm font-medium",
                currentStep === steps[currentStep - 1]?.id ? "text-blue-600" : "text-gray-600"
              )}>
                {steps[currentStep - 1]?.name}: {steps[currentStep - 1]?.description}
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
            {errors.length > 0 && (
              <div className="mt-3 p-3 rounded-md bg-red-50 text-red-700 text-sm">
                {errors.map((err, idx) => (
                  <div key={idx}>• {err}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border-2 border-red-200 animate-pulse">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Please fix the following errors before generating your resume:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((err, idx) => (
                    <li key={idx} className="text-sm text-red-700 font-medium">{err}</li>
                  ))}
                </ul>
                <p className="text-xs text-red-600 mt-2 italic">You've been taken to the step with errors. Please fill in the required fields and try again.</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          // Only submit if we're on the last step
          if (currentStep === totalSteps) {
            handleSubmit(e);
          }
        }} className="space-y-8">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
          <Card className="p-6 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Personal Information</h2>
              <p className="text-gray-600 mt-1">Tell us about yourself</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={personalInfo.firstName}
                  onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={personalInfo.lastName}
                  onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={personalInfo.location}
                  onChange={(e) => setPersonalInfo({...personalInfo, location: e.target.value})}
                  placeholder="e.g., New York, NY or Remote"
                />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job Position (Optional)</Label>
                <Input
                  id="jobTitle"
                  value={personalInfo.jobTitle}
                  onChange={(e) => setPersonalInfo({...personalInfo, jobTitle: e.target.value})}
                  placeholder="e.g., Senior Software Engineer, Product Manager, Marketing Specialist"
                />
              </div>
            </div>
          </Card>
          )}

          {/* Step 2: Social & Professional Links */}
          {currentStep === 2 && (
          <Card className="p-6 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Social & Professional Links</h2>
              <p className="text-gray-600 mt-1">Add links to your LinkedIn, GitHub, portfolio, and other profiles</p>
            </div>
            <div className="space-y-4">
              {socialLinks.map((link, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-4">
                    <Label>Platform</Label>
                    <Select
                      value={link.platform}
                      onValueChange={(value) => {
                        const updated = [...socialLinks];
                        updated[index] = { ...updated[index], platform: value };
                        setSocialLinks(updated);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="GitHub">GitHub</SelectItem>
                        <SelectItem value="Portfolio">Portfolio</SelectItem>
                        <SelectItem value="Twitter">Twitter</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-7">
                    <Label>Profile URL</Label>
                    <Input
                      value={link.url}
                      onChange={(e) => {
                        const updated = [...socialLinks];
                        updated[index] = { ...updated[index], url: e.target.value };
                        setSocialLinks(updated);
                      }}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div className="md:col-span-1">
                    {socialLinks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSocialLinks(socialLinks.filter((_, i) => i !== index));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setSocialLinks([...socialLinks, { platform: 'LinkedIn', url: '' }]);
                }} 
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Social Profile
              </Button>
            </div>
          </Card>
          )}

          {/* Step 3: Skills */}
          {currentStep === 3 && (
          <Card className="p-6 shadow-lg">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Skills</h2>
                  <p className="text-gray-600 mt-1">Add your professional skills with categories and proficiency levels</p>
                </div>
                <Button type="button" onClick={addSkill} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skill
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-4">
                    <Label>Skill Name</Label>
                    <Input
                      value={skill.name}
                      onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                      placeholder="e.g., React, Leadership"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label>Category</Label>
                    <Select
                      value={skill.category}
                      onValueChange={(value) => updateSkill(skill.id, 'category', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                        <SelectItem value="Languages">Languages</SelectItem>
                        <SelectItem value="Tools">Tools</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <Label>Level</Label>
                    <Select
                      value={skill.level || 'Intermediate'}
                      onValueChange={(value) => updateSkill(skill.id, 'level', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                        <SelectItem value="Expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      type="button"
                      onClick={() => removeSkill(skill.id)}
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {skills.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No skills added yet.</p>
                  <p className="text-sm">Click "Add Skill" to get started.</p>
                </div>
              )}
            </div>
          </Card>
          )}

          {/* Step 4: Education */}
          {currentStep === 4 && (
          <Card className="p-6 shadow-lg">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Education</h2>
                  <p className="text-gray-600 mt-1">Add your education background (optional)</p>
                </div>
                <Button type="button" onClick={addEducation} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Education
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">Education {education.indexOf(edu) + 1}</h3>
                    <Button
                      type="button"
                      onClick={() => removeEducation(edu.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>School *</Label>
                      <Input
                        value={edu.school}
                        onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Degree *</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Field of Study</Label>
                      <Input
                        value={edu.field}
                        onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="month"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="month"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {education.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No education added yet.</p>
                  <p className="text-sm">Click "Add Education" to get started.</p>
                </div>
              )}
            </div>
          </Card>
          )}

          {/* Step 5: Work Experience */}
          {currentStep === 5 && (
          <Card className="p-6 shadow-lg">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Work Experience</h2>
                  <p className="text-gray-600 mt-1">Add your work history (optional)</p>
                </div>
                <Button type="button" onClick={addWorkExperience} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Experience
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {workExperience.map((exp) => (
                <div key={exp.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">Experience {workExperience.indexOf(exp) + 1}</h3>
                    <Button
                      type="button"
                      onClick={() => removeWorkExperience(exp.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Job Title *</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) => updateWorkExperience(exp.id, 'title', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Company *</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateWorkExperience(exp.id, 'company', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={exp.location}
                        onChange={(e) => updateWorkExperience(exp.id, 'location', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => updateWorkExperience(exp.id, 'startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="month"
                        value={exp.endDate}
                        onChange={(e) => updateWorkExperience(exp.id, 'endDate', e.target.value)}
                        disabled={exp.isCurrent}
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`current-${exp.id}`}
                        checked={exp.isCurrent}
                        onChange={(e) => updateWorkExperience(exp.id, 'isCurrent', e.target.checked)}
                        className="mr-2"
                      />
                      <Label htmlFor={`current-${exp.id}`}>Currently working here</Label>
                    </div>
                    <div>
                      <Label>Job Type</Label>
                      <select
                        value={exp.jobType || ''}
                        onChange={(e) => updateWorkExperience(exp.id, 'jobType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select job type</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Remote">Remote</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Description</Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (!exp.title || !exp.company) {
                            alert('Please fill in Job Title and Company first');
                            return;
                          }
                          setShowQuestionnaireDialog(exp.id);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Generate with AI
                      </Button>
                    </div>
                    <Textarea
                      value={exp.description}
                      onChange={(e) => updateWorkExperience(exp.id, 'description', e.target.value)}
                      placeholder="Describe your key responsibilities and achievements..."
                      rows={3}
                    />
                  </div>
                </div>
              ))}
              {workExperience.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No work experience added yet.</p>
                  <p className="text-sm">Click "Add Experience" to get started.</p>
                </div>
              )}
            </div>
          </Card>
          )}

          {/* Step 6: Languages */}
          {currentStep === 6 && (
          <Card className="p-6 shadow-lg">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Languages</h2>
                  <p className="text-gray-600 mt-1">Add the languages you speak with proficiency level</p>
                </div>
                <Button type="button" onClick={addLanguage} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Language
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {languages.map((lang, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-5">
                    <Label>Language</Label>
                    <Input
                      value={lang.name}
                      onChange={(e) => updateLanguage(index, 'name', e.target.value)}
                      placeholder="e.g., English, Spanish"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <Label>Proficiency</Label>
                    <Select
                      value={lang.proficiency}
                      onValueChange={(value) => updateLanguage(index, 'proficiency', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                        <SelectItem value="Native">Native</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      type="button"
                      onClick={() => removeLanguage(index)}
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {languages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No languages added yet.</p>
                  <p className="text-sm">Click "Add Language" to get started.</p>
                </div>
              )}
            </div>
          </Card>
          )}

          {/* Step 7: Target Role */}
          {currentStep === 7 && (
          <Card className="p-6 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Target Role & Review</h2>
              <p className="text-gray-600 mt-1">Optional information to help AI tailor your resume</p>
            </div>
            <div>
              <Label htmlFor="targetRole">What position are you applying for?</Label>
              <Input
                id="targetRole"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Software Engineer, Product Manager, Marketing Specialist..."
              />
              <p className="text-sm text-gray-500 mt-1">
                This helps AI tailor your resume for specific roles.
              </p>
              {/* Blockers list (computed) */}
              {errors.length > 0 && (
                <div className="mt-4 p-3 rounded-md bg-yellow-50 text-yellow-800 text-sm">
                  <div className="font-medium mb-1">Please resolve the following before finalizing:</div>
                  {errors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}
            </div>
          </Card>
          )}

          {/* Step 8: Professional Summary */}
          {currentStep === 8 && (
          <Card className="p-6 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Professional Summary</h2>
              <p className="text-gray-600 mt-1">Tell us about yourself - This is required</p>
            </div>
            <div>
              <Label htmlFor="summary">
                Tell us about yourself <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                onKeyDown={(e) => {
                  // Prevent form submission on Enter key
                  if (e.key === 'Enter' && e.ctrlKey) {
                    // Allow Ctrl+Enter for new line
                    return;
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                  }
                }}
                placeholder="Brief description of your professional background, key skills, and career objectives..."
                rows={4}
                className={errors.some(e => e.includes('Summary')) ? 'border-red-500' : ''}
              />
              {errors.some(e => e.includes('Summary')) && (
                <p className="text-red-500 text-sm mt-1">Professional Summary is required</p>
              )}
              <div className="mt-3 flex items-center gap-3">
                <Button
                  type="button"
                  disabled={!wizardSessionId || isGeneratingSummary}
                  onClick={async () => {
                    if (!wizardSessionId) {
                      alert('Session not ready. Please wait a moment and try again.');
                      return;
                    }
                    setIsGeneratingSummary(true);
                    try {
                      // Save current form data to draft first so backend has latest skills/experience
                      const draftPatch: any = {
                        profile: {
                          fullName: `${personalInfo.firstName} ${personalInfo.lastName}`.trim(),
                          headline: personalInfo.jobTitle,
                          summary: summary || personalInfo.professionalSummary,
                          professionalSummary: personalInfo.professionalSummary,
                          location: personalInfo.location,
                          email: personalInfo.email,
                          phone: personalInfo.phone,
                          socialLinks: socialLinks.filter(link => link.url.trim() !== ''),
                        },
                        experience: workExperience.map(e => ({
                          id: e.id,
                          title: e.title,
                          company: e.company,
                          location: e.location,
                          startDate: e.startDate,
                          endDate: e.endDate,
                          isCurrent: e.isCurrent,
                          jobType: e.jobType,
                          description: e.description,
                        })),
                        education: education.map(e => ({
                          id: e.id,
                          school: e.school,
                          degree: e.degree,
                          startDate: e.startDate,
                          endDate: e.endDate,
                        })),
                        skills: skills.filter(s => s.name.trim().length > 0).map(s => s.name),
                        languages: languages.filter(l => l.name.trim().length > 0),
                        targetRole,
                      };
                      await wizardApi.patchSession(wizardSessionId, draftPatch, {}, currentStep);
                      
                      // Now generate summary with latest data
                      const r = await wizardApi.generateSummary(wizardSessionId, targetRole || undefined);
                      setSummary(r.summary);
                    } catch (e: any) {
                      console.error('Generate summary failed', e);
                      let errorMessage = e?.message || e?.detail || 'Failed to generate summary. Please try again.';
                      
                      // Improve rate limit error message
                      if (errorMessage.includes('Too many requests') || errorMessage.includes('429') || errorMessage.includes('rate limit')) {
                        // Use the error message from backend which includes the actual limit
                        if (!errorMessage.includes('per minute')) {
                          errorMessage = 'Rate limit exceeded. You can make up to 30 AI requests per minute. Please wait a minute before trying again.';
                        }
                      }
                      
                      // Improve network error messages
                      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Unable to connect')) {
                        errorMessage = 'Unable to connect to the server. Please check your internet connection and ensure the backend is running.';
                      }
                      
                      alert(`Error: ${errorMessage}`);
                    } finally {
                      setIsGeneratingSummary(false);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGeneratingSummary ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Summary with AI'
                  )}
                </Button>
                <span className="text-sm text-gray-500">Uses your skills/experience and Target Role as hints.</span>
              </div>
            </div>
          </Card>
          )}

          {/* Work Experience Description Generator Dialog */}
          <Dialog open={showQuestionnaireDialog !== null} onOpenChange={(open) => {
            if (!open) {
              setShowQuestionnaireDialog(null);
              setQuestionnaireAnswers({
                whatDidYouDo: '',
                impactResults: '',
              });
            }
          }}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle>Help AI Generate Your Job Description</DialogTitle>
                <DialogDescription>
                  Answer these 2 questions to help AI create a professional description.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="whatDidYouDo">
                    What did you do in this role? <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="whatDidYouDo"
                    value={questionnaireAnswers.whatDidYouDo}
                    onChange={(e) => setQuestionnaireAnswers({...questionnaireAnswers, whatDidYouDo: e.target.value})}
                    placeholder="Describe your main responsibilities and daily tasks..."
                    rows={3}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="impactResults">
                    What was the impact or results? (Include numbers if possible)
                  </Label>
                  <Textarea
                    id="impactResults"
                    value={questionnaireAnswers.impactResults}
                    onChange={(e) => setQuestionnaireAnswers({...questionnaireAnswers, impactResults: e.target.value})}
                    placeholder="e.g., Increased sales by 30%, Reduced processing time by 50%, Managed team of 5..."
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowQuestionnaireDialog(null);
                    setQuestionnaireAnswers({
                      whatDidYouDo: '',
                      impactResults: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => showQuestionnaireDialog && generateDescriptionFromQuestionnaire(showQuestionnaireDialog)}
                  disabled={!questionnaireAnswers.whatDidYouDo.trim() || isGeneratingDescription}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGeneratingDescription ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Description'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>


          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/resume-builder/templates')}
              >
                Cancel
              </Button>
            </div>
            
            <div className="flex gap-3">
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!validateCurrentStep()}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isGenerating || !wizardSessionId}
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('🔘 Generate button clicked');
                    if (!wizardSessionId) {
                      console.error('❌ Button clicked but no wizard session ID');
                      setErrors(['Session not ready. Please refresh the page.']);
                      return;
                    }
                    // Call handleSubmit directly
                    handleSubmit(e as any);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Resume...
                    </>
                  ) : (
                    <>
                      Generate Resume with AI
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
