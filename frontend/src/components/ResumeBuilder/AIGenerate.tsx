import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { AppHeader } from '@/components/Layout/AppHeader';
import { useResumeBuilder } from '@/components/ResumeBuilder/context/ResumeBuilderContext';
import { Plus, Trash2, Loader2, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
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
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
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
    linkedin: '',
    website: ''
  });

  const [summary, setSummary] = useState('');
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [targetRole, setTargetRole] = useState('');

  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);

  // Questionnaire state for work experience description
  const [showQuestionnaireDialog, setShowQuestionnaireDialog] = useState<string | null>(null); // Store exp.id when dialog is open
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState({
    whatDidYouDo: '',
    problemsSolved: '',
    achievements: '',
    technologiesUsed: '',
    impactResults: '',
  });
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Wizard steps state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  useEffect(() => {
    setSelectedTemplate(templateId as any);
    createWizardSession();
  }, [templateId, setSelectedTemplate]);

  const steps = [
    { id: 1, name: 'Personal Info', description: 'Basic information' },
    { id: 2, name: 'Experience', description: 'Work history' },
    { id: 3, name: 'Education', description: 'Education background' },
    { id: 4, name: 'Skills', description: 'Skills & languages' },
    { id: 5, name: 'Summary', description: 'Professional summary' },
    { id: 6, name: 'Target Role', description: 'Final details' },
  ];

  // Zod schemas per step
  const personalInfoSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    location: z.string().optional(),
    jobTitle: z.string().optional(),
    linkedin: z.string().optional(),
    website: z.string().optional(),
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
    field: z.string().optional(),
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
        // Filter out empty work experience entries (where title and company are both empty)
        const filledWorkExp = workExperience.filter(w => 
          (w.title && w.title.trim().length > 0) || (w.company && w.company.trim().length > 0)
        );
        // Only validate filled entries
        filledWorkExp.forEach((w) => workItemSchema.parse(w));
      } else if (step === 3) {
        // Filter out empty education entries (where school and degree are both empty)
        const filledEducation = education.filter(e => 
          (e.school && e.school.trim().length > 0) || (e.degree && e.degree.trim().length > 0)
        );
        // Only validate filled entries
        filledEducation.forEach((e) => educationItemSchema.parse(e));
      } else if (step === 4) {
        // Filter out empty skills and languages before validation
        const filledSkills = skills.filter(s => s.name.trim().length > 0);
        const filledLanguages = languages.filter(l => l.name.trim().length > 0);
        // Only validate filled entries
        if (filledSkills.length > 0) {
          skillsSchema.parse(filledSkills);
        }
        if (filledLanguages.length > 0) {
          languagesSchema.parse(filledLanguages);
        }
      } else if (step === 5) {
        console.log('🔍 Validating Step 5 - Professional Summary:', {
          summary: summary,
          summaryLength: summary?.trim().length
        });
        if (!summary || !summary.trim()) {
          setErrors(['Professional Summary is required. Please tell us about yourself.']);
          console.log('❌ Step 5 validation failed: Summary is empty');
          return false;
        }
        console.log('✅ Step 5 validation passed');
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
            summary,
            location: personalInfo.location,
            email: personalInfo.email,
            phone: personalInfo.phone,
            links: {
              linkedin: personalInfo.linkedin,
              website: personalInfo.website,
            },
          },
          experience: workExperience.map(e => ({
            id: e.id,
            title: e.title,
            company: e.company,
            location: e.location,
            startDate: e.startDate,
            endDate: e.endDate,
            isCurrent: e.isCurrent,
            description: e.description,
          })),
          education: education.map(e => ({
            id: e.id,
            school: e.school,
            degree: e.degree,
            field: e.field,
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
        return true; // Work experience is optional but validate if entries exist
      case 3:
        return true; // Education is optional
      case 4:
        return true; // Skills are optional
      case 5:
        return !!summary.trim(); // Summary is required
      case 6:
        return true; // Target role is optional
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
      field: '',
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
      category: 'Technical'
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
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
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
          problems_solved: questionnaireAnswers.problemsSolved || undefined,
          achievements: questionnaireAnswers.achievements || undefined,
          technologies_used: questionnaireAnswers.technologiesUsed || undefined,
          impact_results: questionnaireAnswers.impactResults || undefined,
          target_role: targetRole || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || 'Failed to generate description');
      }

      const result = await response.json();
      updateWorkExperience(expId, 'description', result.description);
      setShowQuestionnaireDialog(null);
      setQuestionnaireAnswers({
        whatDidYouDo: '',
        problemsSolved: '',
        achievements: '',
        technologiesUsed: '',
        impactResults: '',
      });
    } catch (error) {
      console.error('Error generating description:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate description. Please try again.');
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const createWizardSession = async () => {
    setSessionError(null);
    setIsCreatingSession(true);
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
      
      // Get user email from Supabase auth as fallback
      let userEmail = '';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userEmail = user?.email || '';
      } catch (e) {
        console.warn('Could not fetch user email:', e);
      }
      
      if (profile.summary && typeof profile.summary === 'string') {
        setSummary(profile.summary);
      }
      
      // Prefill personal info from profile
      setPersonalInfo({
        firstName: profile.firstName || profile.fullName?.split(' ')[0] || '',
        lastName: profile.lastName || profile.fullName?.split(' ').slice(1).join(' ') || '',
        email: profile.email || userEmail,
        phone: '',
        location: profile.location || '',
        jobTitle: profile.headline || '',
        linkedin: '',
        website: ''
      });
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
          field: e.field || '',
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
    const step2Valid = validateStep(2);
    const step3Valid = validateStep(3);
    const step4Valid = validateStep(4);
    const step5Valid = validateStep(5);
    
    console.log('✅ Validation results:', { step1Valid, step2Valid, step3Valid, step4Valid, step5Valid });
    
    if (!step1Valid || !step2Valid || !step3Valid || !step4Valid || !step5Valid) {
      console.warn('❌ Validation failed, stopping submission');
      setIsGenerating(false);
      
      // Show popup dialog with validation errors
      setShowValidationDialog(true);
      
      // Navigate to the first step with errors
      if (!step1Valid) {
        console.log('📍 Navigating to Step 1 to fix validation errors');
        setCurrentStep(1);
      } else if (!step2Valid) {
        console.log('📍 Navigating to Step 2 to fix validation errors');
        setCurrentStep(2);
      } else if (!step3Valid) {
        setCurrentStep(3);
      } else if (!step4Valid) {
        setCurrentStep(4);
      } else if (!step5Valid) {
        console.log('📍 Navigating to Step 5 to fix validation errors');
        setCurrentStep(5);
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
          summary,
          location: personalInfo.location,
          email: personalInfo.email,
          phone: personalInfo.phone,
          links: {
            linkedin: personalInfo.linkedin,
            website: personalInfo.website,
          },
        },
        experience: workExperience.map(e => ({
          id: e.id,
          title: e.title,
          company: e.company,
          location: e.location,
          startDate: e.startDate,
          endDate: e.endDate,
          isCurrent: e.isCurrent,
          description: e.description,
        })),
        education: education.map(e => ({
          id: e.id,
          school: e.school,
          degree: e.degree,
          field: e.field,
          startDate: e.startDate,
          endDate: e.endDate,
        })),
        skills: skills.filter(s => s.name.trim().length > 0).map(s => s.name),
        languages: languages.filter(l => l.name.trim().length > 0),
        targetRole,
      };
      
      await wizardApi.patchSession(wizardSessionId, draftPatch, { step6: true }, 6);
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
          {/* Build: v0.0.5 - Updated step order */}
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
          <div className="hidden md:flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    type="button"
                    onClick={() => goToStep(step.id)}
                    disabled={!validateCurrentStep() && step.id > currentStep}
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200",
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
                  <div className="mt-2 text-center">
                    <p className={cn(
                      "text-xs font-medium",
                      currentStep === step.id ? "text-blue-600" : currentStep > step.id ? "text-green-600" : "text-gray-400"
                    )}>
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 hidden lg:block">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-2 -mt-6",
                    currentStep > step.id ? "bg-green-500" : "bg-gray-300"
                  )} />
                )}
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
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-1 -mt-4",
                      currentStep > step.id ? "bg-green-500" : "bg-gray-300"
                    )} />
                  )}
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

        <form onSubmit={handleSubmit} className="space-y-8">
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
                />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={personalInfo.jobTitle}
                  onChange={(e) => setPersonalInfo({...personalInfo, jobTitle: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={personalInfo.linkedin}
                  onChange={(e) => setPersonalInfo({...personalInfo, linkedin: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={personalInfo.website}
                  onChange={(e) => setPersonalInfo({...personalInfo, website: e.target.value})}
                />
              </div>
            </div>
          </Card>
          )}

          {/* Step 2: Work Experience */}
          {currentStep === 2 && (
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
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Description</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!exp.title || !exp.company) {
                            alert('Please fill in Job Title and Company first');
                            return;
                          }
                          setShowQuestionnaireDialog(exp.id);
                        }}
                        className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
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

          {/* Step 3: Education */}
          {currentStep === 3 && (
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
                      <Label>School/University *</Label>
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

          {/* Step 4: Skills & Languages */}
          {currentStep === 4 && (
          <>
          <Card className="p-6 shadow-lg">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Skills</h2>
                  <p className="text-gray-600 mt-1">Add your technical and soft skills (optional)</p>
                </div>
                <Button type="button" onClick={addSkill} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skill
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      value={skill.name}
                      onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                      placeholder="Skill name"
                    />
                  </div>
                  <div className="w-32">
                    <select
                      value={skill.category}
                      onChange={(e) => updateSkill(skill.id, 'category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Soft Skills">Soft Skills</option>
                      <option value="Languages">Languages</option>
                      <option value="Tools">Tools</option>
                    </select>
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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

          <Card className="p-6 shadow-lg mt-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Languages</h2>
                  <p className="text-gray-600 mt-1">Add languages you speak (optional)</p>
                </div>
                <Button type="button" onClick={addLanguage} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Language
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {languages.map((lang, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      value={lang.name}
                      onChange={(e) => updateLanguage(index, 'name', e.target.value)}
                      placeholder="Language name"
                    />
                  </div>
                  <div className="w-32">
                    <select
                      value={lang.proficiency}
                      onChange={(e) => updateLanguage(index, 'proficiency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="Native">Native</option>
                      <option value="Fluent">Fluent</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Basic">Basic</option>
                    </select>
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeLanguage(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
          </>
          )}

          {/* Step 5: Professional Summary */}
          {currentStep === 5 && (
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
                  disabled={!wizardSessionId}
                  onClick={async () => {
                    if (!wizardSessionId) return;
                    try {
                      const r = await wizardApi.generateSummary(wizardSessionId, targetRole || undefined);
                      setSummary(r.summary);
                    } catch (e) {
                      console.error('Generate summary failed', e);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Generate Summary with AI
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
                problemsSolved: '',
                achievements: '',
                technologiesUsed: '',
                impactResults: '',
              });
            }
          }}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle>Help AI Generate Your Job Description</DialogTitle>
                <DialogDescription>
                  Answer these questions to help AI create a professional description. The more details you provide, the better the result.
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
                  <Label htmlFor="problemsSolved">
                    What problems did you solve?
                  </Label>
                  <Textarea
                    id="problemsSolved"
                    value={questionnaireAnswers.problemsSolved}
                    onChange={(e) => setQuestionnaireAnswers({...questionnaireAnswers, problemsSolved: e.target.value})}
                    placeholder="Describe challenges you faced and how you solved them..."
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="achievements">
                    What were your key achievements?
                  </Label>
                  <Textarea
                    id="achievements"
                    value={questionnaireAnswers.achievements}
                    onChange={(e) => setQuestionnaireAnswers({...questionnaireAnswers, achievements: e.target.value})}
                    placeholder="Mention specific accomplishments, awards, or recognitions..."
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="technologiesUsed">
                    What technologies, tools, or skills did you use?
                  </Label>
                  <Textarea
                    id="technologiesUsed"
                    value={questionnaireAnswers.technologiesUsed}
                    onChange={(e) => setQuestionnaireAnswers({...questionnaireAnswers, technologiesUsed: e.target.value})}
                    placeholder="List programming languages, frameworks, software, methodologies..."
                    rows={2}
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
                      problemsSolved: '',
                      achievements: '',
                      technologiesUsed: '',
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

          {/* Step 6: Target Role */}
          {currentStep === 6 && (
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
                  type="submit"
                  disabled={isGenerating || !wizardSessionId}
                  onClick={(e) => {
                    console.log('🔘 Generate button clicked');
                    if (!wizardSessionId) {
                      console.error('❌ Button clicked but no wizard session ID');
                      e.preventDefault();
                      setErrors(['Session not ready. Please refresh the page.']);
                      return;
                    }
                    // Let form submission handle it
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
