import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useResumeBuilder } from '@/components/ResumeBuilder/context/ResumeBuilderContext';
import { AppHeader } from '@/components/Layout/AppHeader';
import { TemplateRenderer } from '@/components/ResumeBuilder/Templates/TemplateRenderer';
import { supabase } from '@/lib/supabaseClient';
import { profileApi, skillsApi, experienceApi, educationApi, resumeAiApi } from '@/lib/api';
import type { Profile, Skill as ProfileSkill, WorkExperience as ProfileWorkExperience, Education as ProfileEducation } from '@/types/resume';
import type { Education as ApiEducation, WorkExperience as ApiWorkExperience, Skill as ApiSkill } from '@/lib/types';
import { 
  Loader2, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  FileText,
  Save,
  Check,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  AlertCircle,
  Info,
  XCircle,
  Sparkles,
  Wand2,
  UserCircle
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { WorkExperience, Education, Skill } from '@/types/resume';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { calculateATSScore, type ATSScore } from '@/utils/atsScorer';

export function ResumeEditPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation() as any;
  const { 
    resumeData, 
    replaceResumeData, 
    selectedTemplate,
    setSelectedTemplate,
    currentResumeId,
    loadResume,
    updateResume,
  } = useResumeBuilder() as any;
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.7);
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null);
  const [showAtsDialog, setShowAtsDialog] = useState(false);
  
  // AI generation state (single field for job description)
  const [showQuestionnaireDialog, setShowQuestionnaireDialog] = useState<string | null>(null);
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  // AI skills generation state
  const [skillsInputMode, setSkillsInputMode] = useState<'manual' | 'ai'>('manual');
  const [aiSkillsDescription, setAiSkillsDescription] = useState('');
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  const [aiSkillsContext, setAiSkillsContext] = useState<'resume' | 'job'>('resume');
  
  // Wizard step state
  const [currentWizardStep, setCurrentWizardStep] = useState(0);

  // Local form state for editing
  const [localData, setLocalData] = useState(resumeData);

  // Get template ID and resume ID from URL params
  const templateIdFromUrl = searchParams.get('template');
  const templateId = templateIdFromUrl || selectedTemplate || 'modern-professional';
  const resumeIdFromUrl = searchParams.get('resume');

  // Placeholder patterns so "Your Location" / "Your Role" are treated as empty (gray placeholder in form)
  const locationPlaceholderRe = /^your\s+location$|^location$/i;
  const jobTitlePlaceholderRe = /^your\s+role$|^your\s+job\s+title$|^role$/i;

  // Suppress extension-related errors during PDF download
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || event.reason?.toString() || '';
      // Suppress extension-related message channel errors
      if (errorMessage.includes('message channel closed') || 
          errorMessage.includes('asynchronous response') ||
          errorMessage.includes('Extension context invalidated')) {
        event.preventDefault(); // Prevent error from showing in console
        return;
      }
    };

    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || event.error?.toString() || '';
      // Suppress extension-related errors
      if (errorMessage.includes('message channel closed') || 
          errorMessage.includes('asynchronous response') ||
          errorMessage.includes('Extension context invalidated')) {
        event.preventDefault(); // Prevent error from showing in console
        return;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Sync local data when resumeData changes (e.g., on load)
  useEffect(() => {
    if (resumeIdFromUrl && resumeData) {
      const loc = (resumeData.personalInfo?.location || '').trim();
      const job = (resumeData.personalInfo?.jobTitle || '').trim();
      setLocalData({
        ...resumeData,
        personalInfo: {
          ...resumeData.personalInfo,
          location: !loc || locationPlaceholderRe.test(loc) ? '' : (resumeData.personalInfo?.location ?? ''),
          jobTitle: !job || jobTitlePlaceholderRe.test(job) ? '' : (resumeData.personalInfo?.jobTitle ?? ''),
        },
      });
    }
  }, [resumeData, resumeIdFromUrl]);

  useEffect(() => {
    if (templateIdFromUrl && templateIdFromUrl !== selectedTemplate) {
      setSelectedTemplate(templateIdFromUrl);
    }
  }, [templateIdFromUrl, selectedTemplate, setSelectedTemplate]);

  useEffect(() => {
    if (resumeIdFromUrl && resumeIdFromUrl !== currentResumeId) {
      loadResume(resumeIdFromUrl).catch((error: unknown) => {
        console.error('Error loading resume:', error);
      });
    }
  }, [resumeIdFromUrl, currentResumeId, loadResume]);

  useEffect(() => {
    if (state?.injectedResumeData) {
      const d = state.injectedResumeData;
      const loc = (d.personalInfo?.location || '').trim();
      const job = (d.personalInfo?.jobTitle || '').trim();
      const locationPlaceholderRe = /^your\s+location$|^location$/i;
      const jobTitlePlaceholderRe = /^your\s+role$|^your\s+job\s+title$|^role$/i;
      const normalized = {
        ...d,
        personalInfo: {
          ...d.personalInfo,
          location: !loc || locationPlaceholderRe.test(loc) ? '' : (d.personalInfo?.location ?? ''),
          jobTitle: !job || jobTitlePlaceholderRe.test(job) ? '' : (d.personalInfo?.jobTitle ?? ''),
        },
      };
      replaceResumeData(normalized);
      setLocalData(normalized);
      state.injectedResumeData = undefined;
    }
  }, [state?.injectedResumeData, replaceResumeData]);


  // Auto-fill from profile data if resume is empty (only run once)
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  useEffect(() => {
    const loadProfileData = async () => {
      // When editing a saved resume (?resume=xxx), never overwrite with profile - only use data from loadResume
      if (resumeIdFromUrl) {
        setHasAutoFilled(true);
        return;
      }
      // Only auto-fill once and if resume data is empty or minimal
      if (hasAutoFilled || !localData) return;

      const hasPersonalInfo = localData.personalInfo?.firstName || localData.personalInfo?.lastName || localData.personalInfo?.email;
      const hasWorkExp = localData.workExperience?.length > 0;
      const hasEducation = localData.education?.length > 0;
      const hasSkills = localData.skills?.length > 0;

      // If resume already has data, skip auto-fill
      if (hasPersonalInfo && (hasWorkExp || hasEducation || hasSkills)) {
        setHasAutoFilled(true);
        return;
      }

      try {
        // Fetch profile data in parallel
        const [profileResult, skillsResult, experienceResult, educationResult] = await Promise.allSettled([
          profileApi.getProfile(),
          skillsApi.getSkills(),
          experienceApi.getExperience(),
          educationApi.getEducation()
        ]);

        const updates: any = { ...localData };

        // Helper function to convert date to YYYY-MM format
        const formatDateForPicker = (dateStr: string | undefined | null): string => {
          if (!dateStr || dateStr.trim() === '') return '';
          try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${year}-${month}`;
          } catch (e) {
            return '';
          }
        };

        // Update personal info if missing
        if (profileResult.status === 'fulfilled' && !hasPersonalInfo) {
          const profile = profileResult.value;
          let firstName = profile.first_name || '';
          let lastName = profile.last_name || '';
          if (!firstName && !lastName && profile.full_name) {
            const nameParts = profile.full_name.trim().split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }

          const rawLocation = (profile.location || updates.personalInfo?.location || '').trim();
          const rawJobTitle = (profile.job_title || updates.personalInfo?.jobTitle || '').trim();
          updates.personalInfo = {
            ...updates.personalInfo,
            firstName: firstName || updates.personalInfo?.firstName || '',
            lastName: lastName || updates.personalInfo?.lastName || '',
            email: profile.email || updates.personalInfo?.email || '',
            phone: profile.phone || updates.personalInfo?.phone || '',
            location: !rawLocation || /^your\s+location$|^location$/i.test(rawLocation) ? '' : (profile.location || updates.personalInfo?.location || ''),
            jobTitle: !rawJobTitle || /^your\s+role$|^your\s+job\s+title$|^role$/i.test(rawJobTitle) ? '' : (profile.job_title || updates.personalInfo?.jobTitle || ''),
            linkedin: profile.social_links?.find((l: any) => l.url?.toLowerCase().includes('linkedin'))?.url || updates.personalInfo?.linkedin || '',
            website: profile.social_links?.find((l: any) => !l.url?.toLowerCase().includes('linkedin') && l.url?.includes('http'))?.url || updates.personalInfo?.website || ''
          };

          if (profile.professional_summary && !updates.summary) {
            updates.summary = profile.professional_summary;
          }
        }

        // Update work experience if missing
        if (experienceResult.status === 'fulfilled' && !hasWorkExp) {
          const experience = experienceResult.value;
          updates.workExperience = experience.map((exp: ApiWorkExperience) => ({
            id: exp.id || `exp-${Date.now()}-${Math.random()}`,
            title: exp.title || '',
            company: exp.company || '',
            location: exp.location || '',
            startDate: formatDateForPicker(exp.start_date),
            endDate: exp.is_current ? '' : formatDateForPicker(exp.end_date),
            isCurrent: exp.is_current || false,
            description: exp.description || ''
          }));
        }

        // Update education if missing
        if (educationResult.status === 'fulfilled' && !hasEducation) {
          const educationData = educationResult.value;
          updates.education = educationData.map((edu: ApiEducation) => ({
            id: edu.id || `edu-${Date.now()}-${Math.random()}`,
            school: edu.school || '',
            degree: edu.degree || '',
            field: '',
            startDate: formatDateForPicker(edu.start_date),
            endDate: formatDateForPicker(edu.end_date)
          }));
        }

        // Update skills if missing
        if (skillsResult.status === 'fulfilled' && !hasSkills) {
          const skillsData = skillsResult.value;
          updates.skills = skillsData.map((skill: ApiSkill) => ({
            id: skill.id || `skill-${Date.now()}-${Math.random()}`,
            name: skill.name || '',
            category: 'Technical'
          }));
        }

        // Apply updates
        setLocalData(updates);
        replaceResumeData(updates);
        setHasAutoFilled(true);
      } catch (error) {
        console.error('Error loading profile data:', error);
        setHasAutoFilled(true); // Mark as attempted even on error
      }
    };

    // Only run if we have localData, haven't auto-filled yet, and we're not editing a saved resume (resumeIdFromUrl)
    if (localData && !hasAutoFilled && !resumeIdFromUrl) {
      loadProfileData();
    }
  }, [localData, hasAutoFilled, resumeIdFromUrl, replaceResumeData]);

  const goToStep = (step: number) => {
    if (step >= 0 && step < sectionConfig.length) {
      setCurrentWizardStep(step);
    }
  };

  const nextStep = () => {
    if (currentWizardStep < sectionConfig.length - 1) {
      setCurrentWizardStep(currentWizardStep + 1);
    }
  };

  const previousStep = () => {
    if (currentWizardStep > 0) {
      setCurrentWizardStep(currentWizardStep - 1);
    }
  };

  // Update handlers that sync to context
  const updatePersonalInfo = (field: string, value: string) => {
    const updated = {
      ...localData,
      personalInfo: { ...localData.personalInfo, [field]: value }
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const updateSummary = (value: string) => {
    const updated = { ...localData, summary: value };
    setLocalData(updated);
    replaceResumeData(updated);
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
    const updated = {
      ...localData,
      workExperience: [...(localData.workExperience || []), newExp]
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const updateWorkExperience = (id: string, field: string, value: any) => {
    const updated = {
      ...localData,
      workExperience: localData.workExperience.map((exp: WorkExperience) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const removeWorkExperience = (id: string) => {
    const updated = {
      ...localData,
      workExperience: localData.workExperience.filter((exp: WorkExperience) => exp.id !== id)
    };
    setLocalData(updated);
    replaceResumeData(updated);
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
    const updated = {
      ...localData,
      education: [...(localData.education || []), newEdu]
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const updateEducation = (id: string, field: string, value: any) => {
    const updated = {
      ...localData,
      education: localData.education.map((edu: Education) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const removeEducation = (id: string) => {
    const updated = {
      ...localData,
      education: localData.education.filter((edu: Education) => edu.id !== id)
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: '',
      category: 'Technical'
    };
    const updated = {
      ...localData,
      skills: [...(localData.skills || []), newSkill]
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const updateSkill = (id: string, field: string, value: any) => {
    const updated = {
      ...localData,
      skills: localData.skills.map((skill: Skill) =>
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const removeSkill = (id: string) => {
    const updated = {
      ...localData,
      skills: localData.skills.filter((skill: Skill) => skill.id !== id)
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const generateSkillsWithAI = async () => {
    if (!aiSkillsDescription.trim() || aiSkillsDescription.trim().length < 20) {
      return;
    }

    try {
      setIsGeneratingSkills(true);
      const response = await resumeAiApi.generateSkills(aiSkillsDescription, aiSkillsContext);
      
      // Add generated skills to existing skills (avoid duplicates)
      const existingSkillNames = (localData.skills || []).map((s: Skill) => s.name.toLowerCase().trim());
      const newSkills: Skill[] = response.skills
        .filter((skillName: string) => !existingSkillNames.includes(skillName.toLowerCase().trim()))
        .map((skillName: string) => ({
          id: `skill-${Date.now()}-${Math.random()}`,
          name: skillName,
          category: 'Technical'
        }));

      if (newSkills.length > 0) {
        const updated = {
          ...localData,
          skills: [...(localData.skills || []), ...newSkills]
        };
        setLocalData(updated);
        replaceResumeData(updated);
        
        // Show success message
        console.log(`Successfully generated ${newSkills.length} skills`);
      } else {
        console.log('No new skills to add (all skills already exist)');
      }
      
      // Clear the description after successful generation
      setAiSkillsDescription('');
    } catch (error: any) {
      console.error('Error generating skills:', error);
      const errorMessage = error?.message || 'Failed to generate skills. Please try again.';
      alert(`Error: ${errorMessage}\n\nIf you see a 404 error, please restart the backend server.`);
    } finally {
      setIsGeneratingSkills(false);
    }
  };

  const handleSave = async () => {
    if (!currentResumeId || !localData) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      // Check if user is authenticated before saving
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        alert('Your session has expired. Please log in again.');
        navigate('/login');
        return;
      }
      
      await updateResume(currentResumeId, undefined, localData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving resume:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save. Please try again.';
      if (errorMessage.includes('Authentication failed')) {
        alert('Your session has expired. Please log in again.');
        navigate('/login');
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Wait for fonts to be ready so html2canvas captures text correctly
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise(resolve => setTimeout(resolve, 100));

      const container = document.querySelector('.resume-preview-container') as HTMLElement;
      if (!container) {
        alert('Resume content not found');
        return;
      }
      
      const element = container.querySelector('.resume-paper') as HTMLElement;
      if (!element) {
        alert('Resume content not found');
        return;
      }

      // Use a fixed-size off-screen wrapper so the clone lays out at exact PDF dimensions.
      // Use left: -9999px instead of visibility: hidden so the clone stays visible for html2canvas.
      const PDF_WIDTH_PX = 816; // 8.5" at 96 DPI
      const wrapper = document.createElement('div');
      wrapper.setAttribute('aria-hidden', 'true');
      wrapper.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: ${PDF_WIDTH_PX}px;
        max-width: ${PDF_WIDTH_PX}px;
        min-width: ${PDF_WIDTH_PX}px;
        overflow: visible;
        pointer-events: none;
        z-index: -9999;
      `;
      document.body.appendChild(wrapper);

      const clone = element.cloneNode(true) as HTMLElement;
      clone.classList.add('pdf-export-clone');
      clone.style.cssText = `
        position: relative;
        left: 0;
        top: 0;
        transform: none;
        width: ${PDF_WIDTH_PX}px;
        max-width: ${PDF_WIDTH_PX}px;
        min-width: ${PDF_WIDTH_PX}px;
        height: auto;
        min-height: 0;
        max-height: none;
        overflow: visible;
        background-color: #ffffff;
        box-shadow: none;
        visibility: visible;
        opacity: 1;
      `;
      wrapper.appendChild(clone);

      // Remove any transform from inner wrapper so layout is 1:1
      const inner = clone.querySelector('div');
      if (inner) {
        (inner as HTMLElement).style.transform = 'none';
      }

      // Wait for layout to settle (two frames)
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 350));

      const scrollHeight = clone.scrollHeight;
      const offsetHeight = clone.offsetHeight;
      const actualHeight = Math.max(scrollHeight, offsetHeight, 1056);
      clone.style.height = `${actualHeight}px`;
      clone.style.minHeight = `${actualHeight}px`;
      await new Promise(resolve => setTimeout(resolve, 150));

      const finalHeight = Math.max(clone.scrollHeight, clone.offsetHeight, actualHeight);
      clone.style.height = `${finalHeight}px`;
      clone.style.minHeight = `${finalHeight}px`;

      // Section positions for page-break logic (measure relative to clone)
      const sectionPositions: Array<{ top: number; bottom: number; element: HTMLElement }> = [];
      const cloneRect = clone.getBoundingClientRect();
      clone.querySelectorAll('section').forEach((section) => {
        const rect = (section as HTMLElement).getBoundingClientRect();
        const top = rect.top - cloneRect.top;
        const bottom = top + rect.height;
        if (rect.height > 20) {
          sectionPositions.push({ top, bottom, element: section as HTMLElement });
        }
      });
      clone.querySelectorAll('div[class*="col-span"]').forEach((wrapper) => {
        const rect = (wrapper as HTMLElement).getBoundingClientRect();
        const top = rect.top - cloneRect.top;
        const bottom = top + rect.height;
        const hasSection = (wrapper as HTMLElement).querySelector('section') !== null;
        if (hasSection && rect.height > 30 && !sectionPositions.some(sp => sp.element === wrapper)) {
          sectionPositions.push({ top, bottom, element: wrapper as HTMLElement });
        }
      });
      sectionPositions.sort((a, b) => a.top - b.top);

      const canvas = await html2canvas(clone, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        removeContainer: false,
        windowWidth: PDF_WIDTH_PX,
        windowHeight: finalHeight,
        onclone: (clonedDoc, clonedElement) => {
          const root = (clonedElement as HTMLElement);
          root.style.height = `${finalHeight}px`;
          root.style.minHeight = `${finalHeight}px`;
          root.style.overflow = 'visible';
          root.style.width = `${PDF_WIDTH_PX}px`;
          root.style.visibility = 'visible';
          root.style.opacity = '1';
          root.querySelectorAll('*').forEach((el) => {
            (el as HTMLElement).style.visibility = 'visible';
            (el as HTMLElement).style.opacity = '1';
          });

          // Inject PDF-safe styles: readable spacing, no overlapping text
          const style = clonedDoc.createElement('style');
          style.textContent = `
            .pdf-export-clone { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .pdf-export-clone * { box-sizing: border-box; word-spacing: normal !important; letter-spacing: 0.02em !important; font-kerning: normal !important; }
            .pdf-export-clone p,
            .pdf-export-clone span,
            .pdf-export-clone li,
            .pdf-export-clone div[class*="text-"] { white-space: normal !important; word-spacing: normal !important; letter-spacing: 0.02em !important; font-kerning: normal !important; }
            .pdf-export-clone > div { padding: 18px 22px !important; }
            .pdf-export-clone .resume-layout-grid { align-items: start !important; }
            .pdf-export-clone [class*="col-span"] { gap: 0.3rem !important; }
            .pdf-export-clone .skills-section-content--two-cols { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 0 0.5rem !important; }
            .pdf-export-clone section {
              margin-bottom: 0.25rem !important;
              padding-bottom: 0 !important;
              min-height: 0 !important;
              overflow: visible !important;
            }
            .pdf-export-clone section h2 {
              margin-top: 0 !important;
              margin-bottom: 0.35rem !important;
              padding-bottom: 0.25rem !important;
            }
            .pdf-export-clone p,
            .pdf-export-clone div[class*="text-"] {
              line-height: 1.5 !important;
              margin-top: 0.25em !important;
              margin-bottom: 0.4em !important;
            }
            .pdf-export-clone h1, .pdf-export-clone h2 {
              line-height: 1.3 !important;
              margin-top: 0 !important;
              margin-bottom: 0.35rem !important;
              padding-bottom: 0.25rem !important;
            }
            .pdf-export-clone .leading-normal, .pdf-export-clone .leading-relaxed { line-height: 1.5 !important; }
            .pdf-export-clone .space-y-1 > * + * { margin-top: 0.35rem !important; }
            .pdf-export-clone .space-y-2 > * + * { margin-top: 0.5rem !important; }
            .pdf-export-clone .space-y-3 > * + * { margin-top: 0.5rem !important; }
            .pdf-export-clone .space-y-4 > * + * { margin-top: 0.65rem !important; }
            .pdf-export-clone .space-y-6 > * + * { margin-top: 0.75rem !important; }
            .pdf-export-clone [class*="gap-"] { gap: 0.5rem !important; }
            .pdf-export-clone .border-b { padding-bottom: 0.4rem !important; margin-bottom: 0.35rem !important; }
            .pdf-export-clone .mb-2 { margin-bottom: 0.35rem !important; }
            .pdf-export-clone .clean-impact-section h2 { padding-bottom: 0.2rem !important; margin-bottom: 0.25rem !important; }
            .pdf-export-clone .clean-impact-section { margin-top: 0.25rem !important; }
            .pdf-export-clone header,
            .pdf-export-clone header .header-inner,
            .pdf-export-clone header * { border: none !important; border-bottom: none !important; box-shadow: none !important; }
            .pdf-export-clone .header-inner { padding-bottom: 0.2rem !important; margin-bottom: 0.2rem !important; }
            .pdf-export-clone .header-contact-line,
            .pdf-export-clone .header-contact-line * { word-break: break-word !important; overflow-wrap: break-word !important; line-height: 1.5 !important; overflow: visible !important; color: #000000 !important; }
            .pdf-export-clone .header-contact-line { padding-right: 0.5rem !important; padding-bottom: 0.25rem !important; gap: 0.5rem 0.25rem !important; }
            .pdf-export-clone .header-contact-value { color: #000000 !important; isolation: isolate !important; }
            .pdf-export-clone header .grid.grid-cols-2 * { word-break: break-word !important; overflow-wrap: break-word !important; }
            .pdf-export-clone .header-contact-grid > div { min-width: 0 !important; word-break: break-word !important; overflow-wrap: break-word !important; overflow: visible !important; padding-right: 0.35rem !important; }
            .pdf-export-clone .header-contact-grid { padding-bottom: 0.25rem !important; overflow: visible !important; border: none !important; border-bottom: none !important; }
          `;
          root.appendChild(style);

          // Override inline margins/padding to match resume UI (tighter contact / summary / work spacing)
          const rootEl = clonedElement as HTMLElement;
          rootEl.querySelectorAll('section').forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.marginBottom = '0.25rem';
            htmlEl.style.paddingBottom = '0';
          });
          rootEl.querySelectorAll('section h2').forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.marginTop = '0';
            htmlEl.style.marginBottom = '0.35rem';
            htmlEl.style.paddingBottom = '0.25rem';
          });
          rootEl.querySelectorAll('[class*="col-span"]').forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.gap = '0.3rem';
          });

          // Remove all borders/lines under header and contact so no whitish lines show
          const headerEl = rootEl.querySelector('header');
          if (headerEl) {
            (headerEl as HTMLElement).style.border = 'none';
            (headerEl as HTMLElement).style.borderBottom = 'none';
            (headerEl as HTMLElement).style.boxShadow = 'none';
            headerEl.querySelectorAll('*').forEach((el) => {
              const h = el as HTMLElement;
              h.style.border = 'none';
              h.style.borderBottom = 'none';
              h.style.boxShadow = 'none';
            });
          }

          // Preserve word/letter spacing so html2canvas doesn't jumble text (known bug: zero letter-spacing drops spaces)
          rootEl.querySelectorAll('*').forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.wordSpacing = 'normal';
            htmlEl.style.letterSpacing = '0.02em';
            htmlEl.style.fontKerning = 'normal';
            htmlEl.style.whiteSpace = 'normal';
          });

          // Convert oklch colors to RGB/hex for PDF compatibility
          // html2canvas and jsPDF don't support oklch color format
          // We'll use the browser's built-in conversion by creating temporary elements
          const convertOklchToRgb = (oklchValue: string, property: string = 'color'): string => {
            if (!oklchValue || (!oklchValue.includes('oklch') && !oklchValue.includes('color('))) {
              return oklchValue;
            }
            
            try {
              // Ensure body exists
              if (!clonedDoc.body) {
                clonedDoc.appendChild(clonedDoc.createElement('body'));
              }
              
              // Create a temporary element to use browser's color conversion
              const tempEl = clonedDoc.createElement('div');
              tempEl.style.setProperty(property, oklchValue);
              tempEl.style.position = 'absolute';
              tempEl.style.visibility = 'hidden';
              tempEl.style.pointerEvents = 'none';
              clonedDoc.body.appendChild(tempEl);
              
              const computed = clonedDoc.defaultView?.getComputedStyle(tempEl);
              const rgbValue = computed?.getPropertyValue(property) || computed?.[property as keyof CSSStyleDeclaration];
              
              clonedDoc.body.removeChild(tempEl);
              
              // If conversion succeeded and doesn't contain oklch, return it
              if (rgbValue && typeof rgbValue === 'string' && !rgbValue.includes('oklch') && !rgbValue.includes('color(')) {
                return rgbValue;
              }
            } catch (e) {
              // Conversion failed, fall through to defaults
            }
            
            // Fallback defaults
            if (property === 'color') return '#000000';
            if (property === 'backgroundColor') return 'transparent';
            return '#000000';
          };

          // Override CSS variables that contain oklch values
          const cssVariableOverrides: Record<string, string> = {
            '--background': '#ffffff',
            '--foreground': '#252525',
            '--card': '#ffffff',
            '--card-foreground': '#252525',
            '--popover': '#ffffff',
            '--popover-foreground': '#252525',
            '--primary': '#295acf',
            '--primary-foreground': '#fafafa',
            '--secondary': '#f7f7f7',
            '--secondary-foreground': '#343434',
            '--muted': '#f7f7f7',
            '--muted-foreground': '#8e8e8e',
            '--accent': '#f7f7f7',
            '--accent-foreground': '#343434',
            '--destructive': '#dc2626',
            '--border': '#ebebeb',
            '--input': '#ebebeb',
            '--ring': '#b5b5b5',
            '--chart-1': '#e67e22',
            '--chart-2': '#3498db',
            '--chart-3': '#9b59b6',
            '--chart-4': '#f39c12',
            '--chart-5': '#c0392b',
            '--sidebar': '#fbfbfb',
            '--sidebar-foreground': '#252525',
            '--sidebar-primary': '#343434',
            '--sidebar-primary-foreground': '#fbfbfb',
            '--sidebar-accent': '#f7f7f7',
            '--sidebar-accent-foreground': '#343434',
            '--sidebar-border': '#ebebeb',
            '--sidebar-ring': '#b5b5b5'
          };

          // Inject CSS variable overrides
          const cssVarStyle = clonedDoc.createElement('style');
          cssVarStyle.textContent = `
            :root {
              ${Object.entries(cssVariableOverrides).map(([varName, value]) => 
                `${varName}: ${value} !important;`
              ).join('\n              ')}
            }
          `;
          root.appendChild(cssVarStyle);

          // Process all elements and convert oklch colors in computed styles
          const colorProperties = [
            'color',
            'backgroundColor',
            'borderColor',
            'borderTopColor',
            'borderRightColor',
            'borderBottomColor',
            'borderLeftColor',
            'outlineColor',
            'textDecorationColor',
            'columnRuleColor'
          ];

          clonedDoc.querySelectorAll('*').forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            const computed = clonedDoc.defaultView?.getComputedStyle(htmlEl);
            if (!computed) return;

            colorProperties.forEach(prop => {
              const value = computed.getPropertyValue(prop) || (computed as any)[prop];
              if (value && typeof value === 'string' && (value.includes('oklch') || value.includes('color('))) {
                const normalized = convertOklchToRgb(value, prop);
                (htmlEl.style as any)[prop] = normalized;
              }
            });
          });
        }
      });

      // Measure LinkedIn link in clone for PDF link annotation (before removing clone)
      let linkedInLink: { url: string; left: number; top: number; width: number; height: number } | null = null;
      const linkEl = clone.querySelector('a[href*="linkedin"], a[href*="linkedin.com"]') as HTMLAnchorElement | null;
      if (linkEl && linkEl.href) {
        const cloneRect = clone.getBoundingClientRect();
        const linkRect = linkEl.getBoundingClientRect();
        let url = (linkEl.getAttribute('href') || linkEl.href || '').trim();
        if (url && !url.startsWith('http')) url = `https://${url}`;
        if (url) {
          linkedInLink = {
            url,
            left: linkRect.left - cloneRect.left,
            top: linkRect.top - cloneRect.top,
            width: linkRect.width,
            height: linkRect.height
          };
        }
      }

      // Remove off-screen wrapper (and clone)
      document.body.removeChild(wrapper);

      // Verify canvas captured full content
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      console.log('Expected height:', finalHeight);
      const PDF_SCALE = 3;
      console.log('Canvas height matches:', Math.abs(canvas.height - (finalHeight * PDF_SCALE)) < 15); // Account for scale factor

      const pdf = new jsPDF({
        unit: 'in',
        format: 'letter',
        orientation: 'portrait'
      });

      const pageWidth = 8.5; // Letter size width in inches
      const pageHeight = 11; // Letter size height in inches
      const imgWidth = pageWidth;
      
      // Calculate the total image height in inches
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      console.log('Total image height in inches:', imgHeight);
      // Only use multiple pages when content is clearly more than one page (avoid blank 2nd page)
      const singlePageMaxHeight = pageHeight + 0.4; // Up to 11.4" → fit on one page by scaling
      const useSinglePage = imgHeight <= singlePageMaxHeight;
      if (useSinglePage) {
        // Single page: fit content on one page (scale down if slightly over 11")
        const drawHeight = imgHeight <= pageHeight ? imgHeight : pageHeight;
        pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, imgWidth, drawHeight);
        // Clickable LinkedIn link on page 1 (coordinates in inches)
        if (linkedInLink) {
          const scaleX = 8.5 / 816;
          const scaleY = drawHeight / finalHeight;
          pdf.link(
            linkedInLink.left * scaleX,
            linkedInLink.top * scaleY,
            linkedInLink.width * scaleX,
            linkedInLink.height * scaleY,
            { url: linkedInLink.url }
          );
        }
      } else {
        // Multi-page - split across multiple pages with intelligent section breaks
        // Calculate how many pixels represent one inch in the canvas
        const pixelsPerInch = canvas.width / imgWidth;
        const pageHeightInPixels = pageHeight * pixelsPerInch;
        
        // Convert section positions to canvas coordinates (accounting for scale factor)
        const canvasSectionPositions = sectionPositions.map(s => ({
          top: s.top * PDF_SCALE,
          bottom: s.bottom * PDF_SCALE,
          height: (s.bottom - s.top) * PDF_SCALE
        }));
        
        let sourceY = 0; // Start from top of canvas (in pixels)
        let pageNumber = 0;
        const minPageHeightInches = 0.5; // Only add a new page if remainder is at least 0.5" (avoids blank 2nd page)
        const minPageHeightPixels = minPageHeightInches * pixelsPerInch;
        
        while (sourceY < canvas.height) {
          const remainingHeight = canvas.height - sourceY;
          // Add a new page only when there's enough content for it (avoids blank last page)
          if (pageNumber > 0 && remainingHeight < minPageHeightPixels) {
            break;
          }
          if (pageNumber > 0) {
            pdf.addPage(); // Add new page
          }
          
          // Calculate how much content fits on this page
          let sourceHeight = Math.min(pageHeightInPixels, remainingHeight);
          
          // Check if we would cut through a section
          const pageEndY = sourceY + sourceHeight;
          for (const section of canvasSectionPositions) {
            // If a section starts within this page but doesn't fit completely
            if (section.top >= sourceY && section.top < pageEndY && section.bottom > pageEndY) {
              // Check if section fits on next page, if not, we have to split it
              const sectionHeight = section.bottom - section.top;
              if (sectionHeight <= pageHeightInPixels) {
                // Section can fit on next page - move break point to before section
                sourceHeight = section.top - sourceY;
                console.log(`Moving page break before section to avoid splitting (section at ${section.top}, new break at ${sourceY + sourceHeight})`);
                break;
              }
              // If section is too tall, we'll have to split it (but try to avoid this)
            }
          }
          
          // Ensure we have at least some content
          if (sourceHeight <= 0) {
            sourceHeight = Math.min(pageHeightInPixels, remainingHeight);
          }
          
          console.log(`Page ${pageNumber + 1}: sourceY=${sourceY}, sourceHeight=${sourceHeight}, remaining=${remainingHeight}`);
          
          // Create a temporary canvas for this page's content
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const pageCtx = pageCanvas.getContext('2d');
          
          if (pageCtx) {
            // Fill with white background
            pageCtx.fillStyle = '#ffffff';
            pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            
            // Draw the portion of the image for this page
            pageCtx.drawImage(
              canvas,
              0, sourceY,                    // Source x, y (in pixels)
              canvas.width, sourceHeight,    // Source width, height (in pixels)
              0, 0,                          // Dest x, y
              canvas.width, sourceHeight     // Dest width, height
            );
            
            const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
            // Calculate the height in inches for PDF (should be pageHeight for full pages, or remaining for last page)
            const pageImgHeight = sourceHeight / pixelsPerInch;
            
            console.log(`Adding page ${pageNumber + 1} with height ${pageImgHeight} inches`);
            
            // Add image to PDF page
            pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidth, pageImgHeight);
          }
          
          // Move to next page position
          sourceY += sourceHeight;
          pageNumber++;
          
          // Safety check to prevent infinite loop
          if (pageNumber > 100) {
            console.error('Too many pages, breaking loop');
            break;
          }
        }
        
        console.log(`PDF generation complete. Total pages: ${pageNumber}`);
        // Clickable LinkedIn link on page 1 (first page shows top 11" of content)
        if (linkedInLink) {
          pdf.setPage(1);
          const scaleX = 8.5 / 816;
          const firstPageClonePx = 11 * (816 / 8.5);
          const scaleY = 11 / firstPageClonePx;
          pdf.link(
            linkedInLink.left * scaleX,
            linkedInLink.top * scaleY,
            linkedInLink.width * scaleX,
            linkedInLink.height * scaleY,
            { url: linkedInLink.url }
          );
        }
      }

      const personName = localData?.personalInfo 
        ? `${localData.personalInfo.firstName || ''}${localData.personalInfo.lastName ? '_' + localData.personalInfo.lastName : ''}`.trim().replace(/\s+/g, '_') || 'Resume'
        : 'Resume';
      const fileName = `${personName}_Resume.pdf`;

      // Use blob download method as primary approach (more reliable, less prone to extension interference)
      // This method creates a blob URL and triggers download via a temporary link element
      // It's less likely to trigger browser extension message listeners
      try {
        // Generate PDF as blob
        const pdfBlob = pdf.output('blob', { type: 'application/pdf' });
        
        // Create blob URL
        const blobUrl = URL.createObjectURL(pdfBlob);
        
        // Create temporary download link
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';
        downloadLink.setAttribute('download', fileName); // Ensure download attribute is set
        
        // Append to body
        document.body.appendChild(downloadLink);
        
        // Trigger download
        // Use a small delay to ensure the link is properly attached to DOM
        await new Promise(resolve => setTimeout(resolve, 10));
        downloadLink.click();
        
        // Clean up after download starts
        setTimeout(() => {
          if (downloadLink.parentNode) {
            document.body.removeChild(downloadLink);
          }
          URL.revokeObjectURL(blobUrl);
        }, 200);
      } catch (blobError) {
        console.log('Blob download failed, trying jsPDF save method:', blobError);
        
        // Fallback to jsPDF's built-in save method
        try {
          // Suppress extension-related console errors temporarily
          const originalError = console.error;
          const errorFilter = (message: string) => {
            return message.includes('message channel closed') || 
                   message.includes('asynchronous response') ||
                   message.includes('Extension context invalidated');
          };
          
          console.error = (...args: any[]) => {
            const message = args.join(' ');
            if (!errorFilter(message)) {
              originalError.apply(console, args);
            }
          };
          
          pdf.save(fileName);
          
          // Restore console.error after a delay
          setTimeout(() => {
            console.error = originalError;
          }, 500);
        } catch (saveError) {
          console.error('jsPDF save also failed:', saveError);
          
          // Last resort: try data URI in new window
          try {
            const pdfDataUri = pdf.output('datauristring');
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              newWindow.document.write(`
                <html>
                  <head><title>${fileName}</title></head>
                  <body style="margin:0;padding:0;">
                    <iframe src="${pdfDataUri}" width="100%" height="100%" style="border:none;"></iframe>
                  </body>
                </html>
              `);
              newWindow.document.close();
            } else {
              throw new Error('Popup blocked');
            }
          } catch (finalError) {
            console.error('All PDF download methods failed:', finalError);
            alert('Failed to download PDF. This may be due to browser extensions interfering with downloads. Please try:\n\n1. Disabling browser extensions temporarily\n2. Checking your browser\'s download settings\n3. Using a different browser or incognito mode');
          }
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again. If the issue persists, try disabling browser extensions temporarily.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCalculateATS = () => {
    if (!localData) return;
    const score = calculateATSScore(localData);
    setAtsScore(score);
    setShowAtsDialog(true);
  };

  const getAuthToken = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const generateSummary = async () => {
    if (!localData) return;
    setIsGeneratingSummary(true);
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

      const response = await fetch(`${API_BASE_URL}/api/ai/profile-summary`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resumeData: localData,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || 'Failed to generate summary');
      }
      
      const data = await response.json();
      if (data.summary) {
        updateSummary(data.summary);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary. Please try again.';
      alert(errorMessage);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const generateWorkDescription = async (experienceId: string) => {
    if (!localData || !jobDescriptionInput.trim()) {
      return;
    }
    
    setIsGeneratingDescription(true);
    try {
      const experience = localData.workExperience?.find((exp: WorkExperience) => exp.id === experienceId);
      if (!experience) {
        throw new Error('Experience not found');
      }

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
          job_title: experience.title,
          company: experience.company,
          what_did_you_do: jobDescriptionInput.trim(),
          impact_results: undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || 'Failed to generate description');
      }
      
      const data = await response.json();
      if (data.description) {
        updateWorkExperience(experienceId, 'description', data.description);
        setShowQuestionnaireDialog(null);
        setJobDescriptionInput('');
      }
    } catch (error) {
      console.error('Error generating description:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate description. Please try again.';
      alert(errorMessage);
    } finally {
      setIsGeneratingDescription(false);
    }
  };


  if (!localData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#295acf] mx-auto mb-4" />
          <p className="text-gray-500">Loading your resume...</p>
        </div>
      </div>
    );
  }

  const sectionConfig = [
    { id: 'contacts', label: 'Contact Info', icon: User, color: 'blue' },
    { id: 'experience', label: 'Work Experience', icon: Briefcase, color: 'green', count: localData.workExperience?.length || 0 },
    { id: 'education', label: 'Education', icon: GraduationCap, color: 'orange', count: localData.education?.length || 0 },
    { id: 'skills', label: 'Skills', icon: Wrench, color: 'red', count: localData.skills?.length || 0 },
    { id: 'summary', label: 'Professional Summary', icon: FileText, color: 'purple' },
  ];

  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-[#295acf]/10', text: 'text-[#295acf]' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    orange: { bg: 'bg-amber-50', text: 'text-amber-600' },
    red: { bg: 'bg-rose-50', text: 'text-rose-600' },
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AppHeader active="resume" />
      
      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Resume saved successfully!</span>
          </div>
        </div>
      )}
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Editor (Wizard Form) */}
        <div className="w-[550px] bg-gradient-to-b from-slate-50 to-white border-r border-gray-200 flex flex-col flex-shrink-0 shadow-sm">
          {/* Sidebar Header */}
          <div className="px-5 py-4 bg-white border-b border-gray-100">
            <div className="flex items-center mb-3">
              <button 
                onClick={() => navigate('/resume-builder')}
                className="flex items-center gap-2 text-gray-500 hover:text-[#295acf] transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm">Back</span>
              </button>
            </div>
          </div>

          {/* Wizard Step Indicators */}
          <div className="px-5 py-4 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              {sectionConfig.map((section, index) => {
                const Icon = section.icon;
                const colors = colorClasses[section.color];
                const isActive = index === currentWizardStep;
                const isCompleted = index < currentWizardStep;
                
                return (
                  <div key={section.id} className="flex items-center flex-1">
                    <button
                      onClick={() => goToStep(index)}
                      className="flex flex-col items-center gap-2 flex-1 group"
                    >
                      <div className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive 
                          ? `${colors.bg} ring-2 ring-[#295acf] ring-offset-2` 
                          : isCompleted
                          ? `${colors.bg} opacity-60`
                          : 'bg-gray-100'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-5 h-5 text-[#295acf]" />
                        ) : (
                          <Icon className={`w-5 h-5 ${isActive ? colors.text : 'text-gray-400'}`} />
                        )}
                      </div>
                      <span className={`text-[10px] font-medium text-center max-w-[60px] ${
                        isActive ? 'text-[#295acf]' : 'text-gray-400'
                      }`}>
                        {section.label.split(' ')[0]}
                      </span>
                    </button>
                    {index < sectionConfig.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                        isCompleted ? 'bg-[#295acf]' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wizard Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6">
            {sectionConfig.map((section, index) => {
              if (index !== currentWizardStep) return null;
              
              const Icon = section.icon;
              const colors = colorClasses[section.color];
              
              return (
                <div key={section.id} className="h-full flex flex-col">
                  {/* Step Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shadow-sm`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">{section.label}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Step {index + 1} of {sectionConfig.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-4">
                      {section.id === 'contacts' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">First name</Label>
                              <Input
                                value={localData.personalInfo?.firstName || ''}
                                onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
                                className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-[#295acf] focus:ring-[#295acf] focus:bg-white transition-colors"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Last name</Label>
                              <Input
                                value={localData.personalInfo?.lastName || ''}
                                onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                                className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-[#295acf] focus:ring-[#295acf] focus:bg-white transition-colors"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Job Title</Label>
                            <Input
                              value={localData.personalInfo?.jobTitle || ''}
                              onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
                              placeholder="e.g. Software Engineer, Data Analyst"
                              className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-[#295acf] focus:ring-[#295acf] focus:bg-white transition-colors placeholder:text-gray-300"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Phone</Label>
                              <Input
                                value={localData.personalInfo?.phone || ''}
                                onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                                placeholder="+1 234 567 8900"
                                className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-[#295acf] focus:ring-[#295acf] focus:bg-white transition-colors placeholder:text-gray-300"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Email</Label>
                              <Input
                                value={localData.personalInfo?.email || ''}
                                onChange={(e) => updatePersonalInfo('email', e.target.value)}
                                placeholder="you@email.com"
                                className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-[#295acf] focus:ring-[#295acf] focus:bg-white transition-colors placeholder:text-gray-300"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Location</Label>
                            <Input
                              value={(() => {
                                const loc = (localData.personalInfo?.location || '').trim();
                                if (!loc || /^your\s+location$/i.test(loc) || loc.toLowerCase() === 'location') return '';
                                return loc;
                              })()}
                              onChange={(e) => updatePersonalInfo('location', e.target.value)}
                              placeholder="Your location"
                              className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-[#295acf] focus:ring-[#295acf] focus:bg-white transition-colors placeholder:text-gray-300"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">LinkedIn</Label>
                            <Input
                              value={localData.personalInfo?.linkedin || ''}
                              onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                              placeholder="linkedin.com/in/yourprofile"
                              className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-[#295acf] focus:ring-[#295acf] focus:bg-white transition-colors placeholder:text-gray-300"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Website</Label>
                            <Input
                              value={localData.personalInfo?.website || ''}
                              onChange={(e) => updatePersonalInfo('website', e.target.value)}
                              placeholder="yourwebsite.com"
                              className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-[#295acf] focus:ring-[#295acf] focus:bg-white transition-colors placeholder:text-gray-300"
                            />
                          </div>
                        </div>
                      )}

                      {section.id === 'summary' && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium text-gray-700">Professional Summary</Label>
                            <Button
                              type="button"
                              size="sm"
                              onClick={generateSummary}
                              disabled={isGeneratingSummary}
                              className="bg-[#295acf] hover:bg-[#1f4ab8] text-white disabled:opacity-50"
                            >
                              {isGeneratingSummary ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 mr-1" />
                                  Generate with AI
                                </>
                              )}
                            </Button>
                          </div>
                          <Textarea
                            value={localData.summary || ''}
                            onChange={(e) => updateSummary(e.target.value)}
                            rows={5}
                            placeholder="Write a compelling professional summary that highlights your key achievements and career goals..."
                            className="resize-none bg-gray-50/80 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-purple-500 focus:bg-white transition-colors placeholder:text-gray-300"
                          />
                          <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                            <span className="inline-block w-1 h-1 bg-purple-400 rounded-full"></span>
                            Keep it concise, 2-4 sentences work best
                          </p>
                        </div>
                      )}

                      {section.id === 'experience' && (
                        <div className="space-y-3">
                          {(localData.workExperience || []).map((exp: WorkExperience, index: number) => (
                            <div key={exp.id} className="p-4 bg-gradient-to-br from-emerald-50/50 to-white rounded-xl border border-emerald-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">
                                    {index + 1}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700">
                                    {exp.title || exp.company || 'New Experience'}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeWorkExperience(exp.id)}
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <Input
                                value={exp.title}
                                onChange={(e) => updateWorkExperience(exp.id, 'title', e.target.value)}
                                placeholder="Job Title"
                                className="h-10 text-sm bg-white border-gray-200 rounded-lg"
                              />
                              <Input
                                value={exp.company}
                                onChange={(e) => updateWorkExperience(exp.id, 'company', e.target.value)}
                                placeholder="Company Name"
                                className="h-10 text-sm bg-white border-gray-200 rounded-lg"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Start</Label>
                                  <DatePicker
                                    type="month"
                                    value={exp.startDate || undefined}
                                    onChange={(value) => updateWorkExperience(exp.id, 'startDate', value || '')}
                                    placeholder="Select month"
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">End</Label>
                                  <DatePicker
                                    type="month"
                                    value={exp.endDate || undefined}
                                    onChange={(value) => updateWorkExperience(exp.id, 'endDate', value || '')}
                                    disabled={exp.isCurrent}
                                    placeholder={exp.isCurrent ? 'Present' : 'Select month'}
                                    className="h-9 text-sm"
                                  />
                                </div>
                              </div>
                              <label className="flex items-center gap-2 cursor-pointer py-1">
                                <input
                                  type="checkbox"
                                  checked={exp.isCurrent}
                                  onChange={(e) => updateWorkExperience(exp.id, 'isCurrent', e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-xs text-gray-600">I currently work here</span>
                              </label>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs font-medium text-gray-700">Job Description</Label>
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
                                    className="bg-[#295acf] hover:bg-[#1f4ab8] text-white disabled:opacity-50 h-7 text-xs"
                                  >
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Generate with AI
                                  </Button>
                                </div>
                                <Textarea
                                  value={exp.description}
                                  onChange={(e) => updateWorkExperience(exp.id, 'description', e.target.value)}
                                  placeholder="Describe your key responsibilities and achievements..."
                                  rows={3}
                                  className="resize-none text-sm bg-white border-gray-200 rounded-lg"
                                />
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addWorkExperience}
                            className="w-full h-11 border-2 border-dashed border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl font-medium"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Experience
                          </Button>
                        </div>
                      )}

                      {section.id === 'education' && (
                        <div className="space-y-3">
                          {(localData.education || []).map((edu: Education, index: number) => (
                            <div key={edu.id} className="p-4 bg-gradient-to-br from-amber-50/50 to-white rounded-xl border border-amber-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600">
                                    {index + 1}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700">
                                    {edu.school || edu.degree || 'New Education'}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeEducation(edu.id)}
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <Input
                                value={edu.school}
                                onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                                placeholder="School / University"
                                className="h-10 text-sm bg-white border-gray-200 rounded-lg"
                              />
                              <Input
                                value={edu.degree}
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                placeholder="Degree (e.g. Bachelor's)"
                                className="h-10 text-sm bg-white border-gray-200 rounded-lg"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Start</Label>
                                  <DatePicker
                                    type="month"
                                    value={edu.startDate || undefined}
                                    onChange={(value) => updateEducation(edu.id, 'startDate', value || '')}
                                    placeholder="Select month"
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">End</Label>
                                  <DatePicker
                                    type="month"
                                    value={edu.endDate || undefined}
                                    onChange={(value) => updateEducation(edu.id, 'endDate', value || '')}
                                    placeholder="Select month"
                                    className="h-9 text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addEducation}
                            className="w-full h-11 border-2 border-dashed border-amber-200 text-amber-600 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50 rounded-xl font-medium"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Education
                          </Button>
                        </div>
                      )}

                      {section.id === 'skills' && (
                        <div className="space-y-4">
                          {/* Skills Display */}
                          <div className="flex flex-wrap gap-2">
                            {(localData.skills || []).map((skill: Skill) => (
                              <div 
                                key={skill.id} 
                                className="group flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-lg hover:border-blue-300 transition-all hover:shadow-sm"
                              >
                                <input
                                  value={skill.name}
                                  onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                                  placeholder="Skill"
                                  className="bg-transparent border-none p-0 text-sm text-gray-700 focus:outline-none focus:ring-0 w-auto min-w-[60px] max-w-[140px] font-medium"
                                  style={{ width: `${Math.max(60, (skill.name?.length || 5) * 8)}px` }}
                                />
                                <button
                                  onClick={() => removeSkill(skill.id)}
                                  className="text-blue-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Input Mode Tabs */}
                          <Tabs value={skillsInputMode} onValueChange={(value) => setSkillsInputMode(value as 'manual' | 'ai')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                              <TabsTrigger 
                                value="manual" 
                                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                              >
                                <Wrench className="w-4 h-4 mr-2" />
                                Manual
                              </TabsTrigger>
                              <TabsTrigger 
                                value="ai" 
                                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                              >
                                <Wand2 className="w-4 h-4 mr-2" />
                                AI Generate
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="manual" className="mt-4 space-y-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={addSkill}
                                className="w-full h-11 border-2 border-dashed border-blue-300 text-blue-600 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50 rounded-lg font-medium transition-all"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Skill Manually
                              </Button>
                            </TabsContent>

                            <TabsContent value="ai" className="mt-4 space-y-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Label className="text-sm font-medium text-gray-700">Context</Label>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant={aiSkillsContext === 'resume' ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setAiSkillsContext('resume')}
                                      className={aiSkillsContext === 'resume' ? 'bg-blue-600 text-white' : ''}
                                    >
                                      <UserCircle className="w-3.5 h-3.5 mr-1.5" />
                                      About Me
                                    </Button>
                                    <Button
                                      type="button"
                                      variant={aiSkillsContext === 'job' ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setAiSkillsContext('job')}
                                      className={aiSkillsContext === 'job' ? 'bg-blue-600 text-white' : ''}
                                    >
                                      <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                                      Job/Role
                                    </Button>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="ai-skills-description" className="text-sm font-medium text-gray-700">
                                    {aiSkillsContext === 'resume' 
                                      ? 'Tell us about yourself, your experience, or your background'
                                      : 'Describe the job, role, or requirements'}
                                  </Label>
                                  <Textarea
                                    id="ai-skills-description"
                                    value={aiSkillsDescription}
                                    onChange={(e) => setAiSkillsDescription(e.target.value)}
                                    placeholder={aiSkillsContext === 'resume' 
                                      ? 'e.g., I am a software engineer with 5 years of experience building web applications using React, Node.js, and PostgreSQL. I have worked on microservices architecture and deployed applications on AWS...'
                                      : 'e.g., We are looking for a Senior Software Engineer who can build scalable web applications using React and Node.js. Experience with AWS, Docker, and PostgreSQL is required...'}
                                    className="min-h-[120px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                                  />
                                  <p className="text-xs text-gray-500">
                                    AI will extract relevant skills and technologies from your description
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  onClick={generateSkillsWithAI}
                                  disabled={isGeneratingSkills || !aiSkillsDescription.trim() || aiSkillsDescription.trim().length < 20}
                                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-sm transition-all"
                                >
                                  {isGeneratingSkills ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Generating Skills...
                                    </>
                                  ) : (
                                    <>
                                      <Wand2 className="w-4 h-4 mr-2" />
                                      Generate Skills with AI
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Wizard Navigation */}
                  <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={previousStep}
                      disabled={currentWizardStep === 0}
                      className="px-6 h-11 rounded-xl font-medium disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    
                    {currentWizardStep === sectionConfig.length - 1 ? (
                      <Button
                        onClick={handleCalculateATS}
                        className="px-6 h-11 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-200"
                      >
                        Check ATS Score
                      </Button>
                    ) : (
                      <Button
                        onClick={nextStep}
                        className="px-6 h-11 rounded-xl font-semibold bg-[#295acf] hover:bg-[#1f4ab8] text-white transition-all duration-200"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Resume Preview */}
        <div className="flex-1 flex flex-col bg-gray-200/50 overflow-hidden">
          {/* Preview Header */}
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewScale(Math.max(0.4, previewScale - 0.1))}
                className="p-1.5 rounded hover:bg-white transition-colors"
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-xs text-gray-500 w-12 text-center">{Math.round(previewScale * 100)}%</span>
              <button
                onClick={() => setPreviewScale(Math.min(1.2, previewScale + 0.1))}
                className="p-1.5 rounded hover:bg-white transition-colors"
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#295acf] hover:bg-[#1f4ab8] text-white shadow-sm"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
              <Button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="bg-[#295acf] hover:bg-[#1f4ab8] text-white shadow-sm"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Preview Area */}
          <div className="flex-1 overflow-auto p-8">
            <div className="resume-preview-container flex justify-center">
              <div 
                className="resume-paper bg-white shadow-2xl rounded-sm"
                style={{
                  width: '816px', // 8.5 inches at 96 DPI
                  minHeight: '1056px', // 11 inches at 96 DPI
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                }}
              >
                <div style={{ padding: '24px' }}>
                  <TemplateRenderer 
                    templateId={templateId}
                    data={localData}
                  />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* ATS Score Dialog */}
      <Dialog open={showAtsDialog} onOpenChange={setShowAtsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">ATS Resume Score</DialogTitle>
            <DialogDescription>
              Your resume's compatibility with Applicant Tracking Systems
            </DialogDescription>
          </DialogHeader>
          
          {atsScore && (
            <div className="space-y-6">
              {/* Score Display */}
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="transform -rotate-90 w-48 h-48">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      strokeDashoffset={`${2 * Math.PI * 88 * (1 - atsScore.percentage / 100)}`}
                      className={atsScore.percentage >= 80 ? 'text-green-500' : atsScore.percentage >= 60 ? 'text-yellow-500' : 'text-red-500'}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className={`text-5xl font-bold ${atsScore.percentage >= 80 ? 'text-green-600' : atsScore.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {atsScore.percentage}
                      </div>
                      <div className="text-sm text-gray-500">out of 100</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issues List */}
              {atsScore.issues.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Areas to Improve:</h3>
                  <div className="space-y-2">
                    {atsScore.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          issue.type === 'error' ? 'bg-red-50 border-red-200' :
                          issue.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-[#295acf]/10 border-[#295acf]/30'
                        }`}
                      >
                        {issue.type === 'error' && <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />}
                        {issue.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />}
                        {issue.type === 'info' && <Info className="w-5 h-5 text-[#295acf] mt-0.5 flex-shrink-0" />}
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{issue.section}</div>
                          <div className="text-sm text-gray-700 mt-1">{issue.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {atsScore.issues.length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">Excellent! Your resume is ATS-friendly.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Work Experience – single field */}
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
            <Label htmlFor="jobDescriptionInput">Your role & achievements *</Label>
            <Textarea
              id="jobDescriptionInput"
              value={jobDescriptionInput}
              onChange={(e) => setJobDescriptionInput(e.target.value)}
              placeholder="e.g., Led the backend team, built APIs with Python and PostgreSQL. Reduced deployment time by 40%. Managed 3 engineers."
              rows={5}
              className="mt-1 resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowQuestionnaireDialog(null);
                setJobDescriptionInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (showQuestionnaireDialog) {
                  generateWorkDescription(showQuestionnaireDialog);
                }
              }}
              disabled={!jobDescriptionInput.trim() || isGeneratingDescription}
              className="bg-[#295acf] hover:bg-[#1f4ab8] text-white"
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
    </div>
  );
}
