import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { AppHeader } from '@/components/Layout/AppHeader';
import { useResumeBuilder } from '@/components/ResumeBuilder/context/ResumeBuilderContext';
import { Plus, Trash2, Loader2, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Sparkles, X, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';
import { profileApi, skillsApi, experienceApi, educationApi } from '@/lib/api';
import type { Profile, Skill as ProfileSkill, WorkExperience as ProfileWorkExperience, Education as ProfileEducation } from '@/types/resume';

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
  field?: string;
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
  const { setSelectedTemplate, generateWithAI } = useResumeBuilder();

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

  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);

  // Single-field state for AI work description
  const [showQuestionnaireDialog, setShowQuestionnaireDialog] = useState<string | null>(null);
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Wizard steps state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  useEffect(() => {
    setSelectedTemplate(templateId as any);
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
      } else if (step === 7) {
        console.log('🔍 Validating Step 7 - Professional Summary:', {
          summary: summary,
          summaryLength: summary?.trim().length
        });
        if (!summary || !summary.trim()) {
          setErrors(['Professional Summary is required. Please tell us about yourself.']);
          console.log('❌ Step 7 validation failed: Summary is empty');
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

    if (!jobDescriptionInput.trim()) {
      alert('Please describe your role and achievements');
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
          what_did_you_do: jobDescriptionInput.trim(),
          impact_results: undefined,
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
      setJobDescriptionInput('');
    } catch (error) {
      console.error('Error generating description:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate description. Please try again.';
      alert(errorMessage);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email || '';
        
        if (userEmail) {
          setPersonalInfo(prev => ({
            ...prev,
            email: userEmail
          }));
        }
      } catch (e) {
        console.warn('Could not fetch user email:', e);
      }
    };
    
    loadUserData();
  }, []);

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
      console.log('Generating resume with AI...');
      
      // Prepare form data for AI generation
      const formData = {
        templateId,
        personalInfo: {
          firstName: personalInfo.firstName,
          lastName: personalInfo.lastName,
          email: personalInfo.email,
          phone: personalInfo.phone,
          location: personalInfo.location,
          jobTitle: personalInfo.jobTitle,
          linkedin: socialLinks.find(l => l.platform === 'LinkedIn')?.url || '',
          website: socialLinks.find(l => l.platform === 'Website')?.url || '',
        },
        summary: summary || personalInfo.professionalSummary,
        workExperience: workExperience.map(e => ({
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
        skills: skills.filter(s => s.name.trim().length > 0).map(s => ({
          id: s.id,
          name: s.name,
          category: s.category,
        })),
        languages: languages.filter(l => l.name.trim().length > 0),
      };
      
      const savedResumeId = await generateWithAI(formData);
      
      if (!savedResumeId) {
        throw new Error('Failed to generate resume');
      }
      
      console.log('✅ Navigating to edit page with resume ID:', savedResumeId);
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
              className="w-full bg-[#295acf] hover:bg-[#1f4ab8]"
            >
              Got it, I'll fix these
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="container mx-auto p-6 max-w-4xl">

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
                        ? "bg-[#295acf] border-[#295acf] text-white shadow-lg scale-110"
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
                      currentStep === step.id ? "text-[#295acf]" : currentStep > step.id ? "text-green-600" : "text-gray-400"
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
                          ? "bg-[#295acf] border-[#295acf] text-white shadow-lg scale-110"
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
                currentStep === steps[currentStep - 1]?.id ? "text-[#295acf]" : "text-gray-600"
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
                className="bg-[#295acf] h-2 rounded-full transition-all duration-300"
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
                <Button type="button" onClick={addSkill} size="sm" className="bg-[#295acf] hover:bg-[#1f4ab8] text-white">
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
                <Button type="button" onClick={addEducation} size="sm" className="bg-[#295acf] hover:bg-[#1f4ab8] text-white">
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
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <DatePicker
                        type="month"
                        value={edu.startDate}
                        onChange={(value) => updateEducation(edu.id, 'startDate', value)}
                        placeholder="Select month"
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <DatePicker
                        type="month"
                        value={edu.endDate}
                        onChange={(value) => updateEducation(edu.id, 'endDate', value)}
                        placeholder="Select month"
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
                <Button type="button" onClick={addWorkExperience} size="sm" className="bg-[#295acf] hover:bg-[#1f4ab8] text-white">
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
                      <DatePicker
                        type="month"
                        value={exp.startDate}
                        onChange={(value) => updateWorkExperience(exp.id, 'startDate', value)}
                        placeholder="Select month"
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <DatePicker
                        type="month"
                        value={exp.endDate}
                        onChange={(value) => updateWorkExperience(exp.id, 'endDate', value)}
                        placeholder="Select month"
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
                        className="bg-[#295acf] hover:bg-[#1f4ab8] text-white disabled:opacity-50"
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
                <Button type="button" onClick={addLanguage} size="sm" className="bg-[#295acf] hover:bg-[#1f4ab8] text-white">
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

          {/* Step 7: Professional Summary */}
          {currentStep === 7 && (
          <Card className="p-6 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Professional Summary</h2>
              <p className="text-gray-600 mt-1">Tell us about yourself - This is required</p>
              <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Why Professional Summary is Important</p>
                    <p className="text-sm text-blue-800">
                      A professional summary is one of the most important sections of your resume. It's the first thing recruiters read and helps them quickly understand your value proposition. A well-written summary can significantly increase your chances of getting an interview. Take your time to craft a compelling summary that highlights your key achievements, skills, and career goals.
                    </p>
                  </div>
                </div>
              </div>
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
            </div>
          </Card>
          )}

          {/* Work Experience Description Generator Dialog */}
          <Dialog open={showQuestionnaireDialog !== null} onOpenChange={(open) => {
            if (!open) {
              setShowQuestionnaireDialog(null);
              setJobDescriptionInput('');
            }
          }}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle>Help AI Generate Your Job Description</DialogTitle>
                <DialogDescription>
                  Describe your role and achievements. Include responsibilities and impact or metrics if you have them.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <Label htmlFor="jobDescriptionInput">
                  Your role & achievements <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="jobDescriptionInput"
                  value={jobDescriptionInput}
                  onChange={(e) => setJobDescriptionInput(e.target.value)}
                  placeholder="e.g., Led the backend team, built APIs with Python and PostgreSQL. Reduced deployment time by 40%. Managed 3 engineers."
                  rows={5}
                  required
                  className="mt-1"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowQuestionnaireDialog(null);
                    setJobDescriptionInput('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => showQuestionnaireDialog && generateDescriptionFromQuestionnaire(showQuestionnaireDialog)}
                  disabled={!jobDescriptionInput.trim() || isGeneratingDescription}
                  className="bg-[#295acf] hover:bg-[#1f4ab8]"
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
                  className="bg-[#295acf] hover:bg-[#1f4ab8] text-white flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isGenerating}
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('🔘 Generate button clicked');
                    // Call handleSubmit directly
                    handleSubmit(e as any);
                  }}
                  className="bg-[#295acf] hover:bg-[#1f4ab8] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white"
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
