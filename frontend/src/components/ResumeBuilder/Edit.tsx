import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { useResumeBuilder } from '@/components/ResumeBuilder/context/ResumeBuilderContext';
import { AppHeader } from '@/components/Layout/AppHeader';
import { TemplateRenderer } from '@/components/ResumeBuilder/Templates/TemplateRenderer';
import { supabase } from '@/lib/supabaseClient';
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
  Sparkles
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
  
  // AI generation state
  const [showQuestionnaireDialog, setShowQuestionnaireDialog] = useState<string | null>(null);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<{ whatDidYouDo: string; impactResults: string }>({ whatDidYouDo: '', impactResults: '' });
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  // Wizard step state
  const [currentWizardStep, setCurrentWizardStep] = useState(0);

  // Local form state for editing
  const [localData, setLocalData] = useState(resumeData);

  // Get template ID and resume ID from URL params
  const templateIdFromUrl = searchParams.get('template');
  const templateId = templateIdFromUrl || selectedTemplate || 'modern-professional';
  const resumeIdFromUrl = searchParams.get('resume');

  // Sync local data when resumeData changes (e.g., on load)
  useEffect(() => {
    // Always sync when resumeData changes, especially when we have a resume ID
    if (resumeIdFromUrl && resumeData) {
      console.log('Edit page - Syncing resumeData to localData:', resumeData);
      setLocalData(resumeData);
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
      replaceResumeData(state.injectedResumeData);
      setLocalData(state.injectedResumeData);
      state.injectedResumeData = undefined;
    }
  }, [state?.injectedResumeData, replaceResumeData]);

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

      // Create a clone to avoid modifying the original
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.transform = 'none';
      clone.style.backgroundColor = '#ffffff';
      clone.style.width = '816px'; // Fixed width for consistency (8.5 inches at 96 DPI)
      clone.style.height = 'auto'; // Let it expand naturally
      clone.style.overflow = 'visible'; // Ensure all content is visible
      clone.style.maxHeight = 'none'; // Remove any max-height restrictions
      document.body.appendChild(clone);

      // Wait for clone to fully render and measure actual height
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Force reflow to ensure all content is rendered
      clone.offsetHeight; // Trigger reflow
      
      // Find all section elements to detect section boundaries for intelligent page breaks
      const sectionPositions: Array<{ top: number; bottom: number; element: HTMLElement }> = [];
      
      // Find wrapper divs that contain sections (these are the main containers)
      const sectionWrappers = clone.querySelectorAll('div[class*="col-span"]');
      sectionWrappers.forEach((wrapper) => {
        const rect = wrapper.getBoundingClientRect();
        const cloneRect = clone.getBoundingClientRect();
        const top = rect.top - cloneRect.top;
        const bottom = top + rect.height;
        // Only add if it contains a section element or has significant content
        const hasSection = wrapper.querySelector('section') !== null;
        if (hasSection && rect.height > 30) {
          sectionPositions.push({ top, bottom, element: wrapper as HTMLElement });
        }
      });
      
      // Also find direct section elements (in case they're not wrapped)
      const sections = clone.querySelectorAll('section');
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const cloneRect = clone.getBoundingClientRect();
        const top = rect.top - cloneRect.top;
        const bottom = top + rect.height;
        // Only add if not already covered by a wrapper
        const isCovered = sectionPositions.some(sp => {
          const spRect = sp.element.getBoundingClientRect();
          return spRect.top <= rect.top && spRect.bottom >= rect.bottom;
        });
        if (!isCovered && rect.height > 30) {
          sectionPositions.push({ top, bottom, element: section as HTMLElement });
        }
      });
      
      // Sort sections by position
      sectionPositions.sort((a, b) => a.top - b.top);
      
      console.log(`Found ${sectionPositions.length} sections for page break detection`);
      
      // Get the actual rendered height - use the maximum of all possible measurements
      const scrollHeight = clone.scrollHeight;
      const offsetHeight = clone.offsetHeight;
      const clientHeight = clone.clientHeight;
      const actualHeight = Math.max(scrollHeight, offsetHeight, clientHeight);
      
      // Set explicit height to ensure html2canvas captures everything
      clone.style.height = `${actualHeight}px`;
      clone.style.minHeight = `${actualHeight}px`;

      // Wait for height to apply and content to stabilize
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify height one more time
      const finalHeight = Math.max(clone.scrollHeight, clone.offsetHeight, actualHeight);
      if (finalHeight > actualHeight) {
        clone.style.height = `${finalHeight}px`;
        clone.style.minHeight = `${finalHeight}px`;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: false,
        removeContainer: false,
        onclone: (clonedDoc) => {
          // Ensure cloned element has correct height
          const clonedElement = clonedDoc.querySelector('.resume-paper') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.height = `${finalHeight}px`;
            clonedElement.style.minHeight = `${finalHeight}px`;
            clonedElement.style.overflow = 'visible';
          }
          
          // Force all text to use standard colors to avoid oklch issues
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            const computed = window.getComputedStyle(htmlEl);
            // Only override if color contains oklch
            if (computed.color.includes('oklch') || computed.color.includes('color(')) {
              htmlEl.style.color = '#000000';
            }
            if (computed.backgroundColor.includes('oklch') || computed.backgroundColor.includes('color(')) {
              htmlEl.style.backgroundColor = '#ffffff';
            }
          });
        }
      });

      // Remove clone
      document.body.removeChild(clone);

      // Verify canvas captured full content
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      console.log('Expected height:', finalHeight);
      console.log('Canvas height matches:', Math.abs(canvas.height - (finalHeight * 2)) < 10); // Account for scale factor

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
      console.log('Pages needed:', Math.ceil(imgHeight / pageHeight));
      
      // Multi-page support: split image across pages if needed
      if (imgHeight <= pageHeight) {
        // Single page - fits on one page
        pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        // Multi-page - split across multiple pages with intelligent section breaks
        // Calculate how many pixels represent one inch in the canvas
        const pixelsPerInch = canvas.width / imgWidth;
        const pageHeightInPixels = pageHeight * pixelsPerInch;
        
        // Convert section positions to canvas coordinates (accounting for scale factor)
        const canvasSectionPositions = sectionPositions.map(s => ({
          top: s.top * 2, // Scale factor is 2
          bottom: s.bottom * 2,
          height: (s.bottom - s.top) * 2
        }));
        
        let sourceY = 0; // Start from top of canvas (in pixels)
        let pageNumber = 0;
        
        while (sourceY < canvas.height) {
          if (pageNumber > 0) {
            pdf.addPage(); // Add new A4 page
          }
          
          // Calculate how much content fits on this page
          const remainingHeight = canvas.height - sourceY;
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
      }

      const personName = localData?.personalInfo 
        ? `${localData.personalInfo.firstName || ''}${localData.personalInfo.lastName ? '_' + localData.personalInfo.lastName : ''}`.trim().replace(/\s+/g, '_') || 'Resume'
        : 'Resume';
      pdf.save(`${personName}_Resume.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
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
    if (!localData || !questionnaireAnswers.whatDidYouDo) {
      return;
    }
    
    setIsGeneratingDescription(true);
    try {
      const experience = localData.workExperience?.find(exp => exp.id === experienceId);
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
          what_did_you_do: questionnaireAnswers.whatDidYouDo,
          impact_results: questionnaireAnswers.impactResults || undefined,
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
        setQuestionnaireAnswers({ whatDidYouDo: '', impactResults: '' });
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
            <div className="flex items-center justify-between mb-3">
              <button 
                onClick={() => navigate('/resume-builder')}
                className="flex items-center gap-2 text-gray-500 hover:text-[#295acf] transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm">Back</span>
              </button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isSaving}
                className="h-10 px-5 rounded-xl font-semibold bg-[#295acf] hover:bg-[#1f4ab8] text-white transition-all duration-200"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1.5 text-white" />
                    <span className="text-white">Save</span>
                  </>
                )}
              </Button>
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
                              placeholder="e.g. Software Engineer"
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
                              value={localData.personalInfo?.location || ''}
                              onChange={(e) => updatePersonalInfo('location', e.target.value)}
                              placeholder="City, Country"
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
                        <div className="space-y-3">
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addSkill}
                            className="w-full h-11 border-2 border-dashed border-blue-300 text-blue-600 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50 rounded-lg font-medium transition-all"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Skill
                          </Button>
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
                onClick={() => navigate('/resume-builder')}
                className="bg-[#295acf] hover:bg-[#1f4ab8] text-white shadow-sm"
              >
                Preview
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
                <div style={{ padding: '16px' }}>
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

      {/* AI Work Experience Questionnaire Dialog */}
      <Dialog open={showQuestionnaireDialog !== null} onOpenChange={(open) => {
        if (!open) {
          setShowQuestionnaireDialog(null);
          setQuestionnaireAnswers({ whatDidYouDo: '', impactResults: '' });
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
            <div className="space-y-2">
              <Label htmlFor="whatDidYouDo">What did you do? (Key responsibilities and tasks)</Label>
              <Textarea
                id="whatDidYouDo"
                value={questionnaireAnswers.whatDidYouDo}
                onChange={(e) => setQuestionnaireAnswers({ ...questionnaireAnswers, whatDidYouDo: e.target.value })}
                placeholder="e.g., Managed a team of 5 developers, implemented CI/CD pipelines, led sprint planning meetings..."
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="impactResults">Impact/Results (Achievements and measurable outcomes)</Label>
              <Textarea
                id="impactResults"
                value={questionnaireAnswers.impactResults}
                onChange={(e) => setQuestionnaireAnswers({ ...questionnaireAnswers, impactResults: e.target.value })}
                placeholder="e.g., Reduced deployment time by 50%, increased team productivity by 30%, delivered 3 major features on time..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowQuestionnaireDialog(null);
                setQuestionnaireAnswers({ whatDidYouDo: '', impactResults: '' });
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
              disabled={!questionnaireAnswers.whatDidYouDo || isGeneratingDescription}
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
