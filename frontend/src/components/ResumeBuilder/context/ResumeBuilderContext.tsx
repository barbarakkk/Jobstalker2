import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ResumeData, PersonalInfo, WorkExperience, Education, Skill } from '@/types/resume';
import { supabase } from '@/lib/supabaseClient';

type ResumeTemplateId = string;

interface ResumeBuilderContextValue {
  selectedTemplate: ResumeTemplateId;
  setSelectedTemplate: (t: ResumeTemplateId) => void;
  resumeData: ResumeData;
  updatePersonalInfo: (data: Partial<PersonalInfo>) => void;
  addWorkExperience: (exp: WorkExperience) => void;
  removeWorkExperience: (id: string) => void;
  addEducation: (edu: Education) => void;
  removeEducation: (id: string) => void;
  addSkill: (skill: Skill) => void;
  removeSkill: (id: string) => void;
  setSummary: (summary: string) => void;
  replaceResumeData: (data: ResumeData) => void; // Add function to replace entire resume data
  currentStep: number;
  setCurrentStep: (s: number) => void;
  isDirty: boolean;
  lastSaved?: number;
  // AI generation methods
  generateWithAI: (formData: any) => Promise<string | null>; // Returns saved resume ID
  isAIGenerated: boolean;
  aiGenerationInProgress: boolean;
  // Resume persistence methods
  currentResumeId: string | null;
  setCurrentResumeId: (id: string | null) => void;
  saveResume: (title: string, templateId: string, resumeData: ResumeData) => Promise<string>;
  updateResume: (resumeId: string, title?: string, resumeData?: ResumeData) => Promise<void>;
  loadResume: (resumeId: string) => Promise<void>;
  listResumes: () => Promise<any[]>;
  deleteResume: (resumeId: string) => Promise<void>;
}

const defaultData: ResumeData = {
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    jobTitle: '',
  },
  workExperience: [],
  education: [],
  skills: [],
  languages: [],
  summary: '',
};

const ResumeBuilderContext = createContext<ResumeBuilderContextValue | undefined>(undefined);

export function ResumeBuilderProvider({ children }: { children: React.ReactNode }) {
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateId>('');
  const [resumeData, setResumeData] = useState<ResumeData>(defaultData);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<number | undefined>(undefined);
  const [isAIGenerated, setIsAIGenerated] = useState<boolean>(false);
  const [aiGenerationInProgress, setAiGenerationInProgress] = useState<boolean>(false);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);

  const debouncedTimerRef = useRef<number | undefined>(undefined);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    if (debouncedTimerRef.current) {
      window.clearTimeout(debouncedTimerRef.current);
    }
    debouncedTimerRef.current = window.setTimeout(() => {
      setLastSaved(Date.now());
      setIsDirty(false);
    }, 30000);
  }, []);

  const updatePersonalInfo = useCallback((data: Partial<PersonalInfo>) => {
    setResumeData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, ...data } }));
    markDirty();
  }, [markDirty]);

  const addWorkExperience = useCallback((exp: WorkExperience) => {
    setResumeData(prev => ({ ...prev, workExperience: [...prev.workExperience, exp] }));
    markDirty();
  }, [markDirty]);

  const removeWorkExperience = useCallback((id: string) => {
    setResumeData(prev => ({ ...prev, workExperience: prev.workExperience.filter(e => e.id !== id) }));
    markDirty();
  }, [markDirty]);

  const addEducation = useCallback((edu: Education) => {
    setResumeData(prev => ({ ...prev, education: [...prev.education, edu] }));
    markDirty();
  }, [markDirty]);

  const removeEducation = useCallback((id: string) => {
    setResumeData(prev => ({ ...prev, education: prev.education.filter(e => e.id !== id) }));
    markDirty();
  }, [markDirty]);

  const addSkill = useCallback((skill: Skill) => {
    setResumeData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    markDirty();
  }, [markDirty]);

  const removeSkill = useCallback((id: string) => {
    setResumeData(prev => ({ ...prev, skills: prev.skills.filter(s => s.id !== id) }));
    markDirty();
  }, [markDirty]);

  const setSummary = useCallback((summary: string) => {
    setResumeData(prev => ({ ...prev, summary }));
    markDirty();
  }, [markDirty]);

  const replaceResumeData = useCallback((data: ResumeData) => {
    console.log('Context - Replacing resume data with:', data);
    setResumeData(data);
    markDirty();
    console.log('Context - Resume data replaced successfully');
  }, [markDirty]);

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  const saveResume = useCallback(async (title: string, templateId: string, data: ResumeData): Promise<string> => {
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

      const response = await fetch(`${API_BASE_URL}/api/resume-builder/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          template_id: templateId,
          title: title || `Resume - ${new Date().toLocaleDateString()}`,
          resume_data: data,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to save resume:', errorText);
        throw new Error('Failed to save resume');
      }

      const result = await response.json();
      const savedId = result.id;
      setCurrentResumeId(savedId);
      console.log('Context - Resume saved with ID:', savedId);
      return savedId;
    } catch (error) {
      console.error('Error saving resume:', error);
      throw error;
    }
  }, [getAuthToken]);

  const updateResume = useCallback(async (resumeId: string, title?: string, data?: ResumeData): Promise<void> => {
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

      const updatePayload: any = {};
      if (title !== undefined) updatePayload.title = title;
      if (data !== undefined) updatePayload.resume_data = data;

      const response = await fetch(`${API_BASE_URL}/api/resume-builder/${resumeId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update resume:', errorText);
        throw new Error('Failed to update resume');
      }

      console.log('Context - Resume updated:', resumeId);
    } catch (error) {
      console.error('Error updating resume:', error);
      throw error;
    }
  }, [getAuthToken]);

  const loadResume = useCallback(async (resumeId: string): Promise<void> => {
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

      // First try to load from resume-builder endpoint
      let response = await fetch(`${API_BASE_URL}/api/resume-builder/${resumeId}`, {
        headers,
      });

      // If not found, try generated-resumes endpoint
      if (response.status === 404) {
        console.log('Resume not found in resume-builder, trying generated-resumes endpoint');
        response = await fetch(`${API_BASE_URL}/api/generated-resumes/${resumeId}`, {
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to load resume from generated-resumes:', errorText);
          throw new Error('Failed to load resume');
        }

        const generatedResult = await response.json();
        // Convert generated resume format to editor format
        const contentJson = generatedResult.contentJson || {};
        const profile = contentJson.profile || {};
        const fullName = profile.fullName || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const resumeData: ResumeData = {
          personalInfo: {
            firstName,
            lastName,
            email: profile.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            jobTitle: profile.headline || '',
            linkedin: profile.links?.linkedin || '',
            website: profile.links?.website || '',
          },
          summary: profile.summary || '',
          workExperience: (contentJson.experience || []).map((e: any, idx: number) => ({
            id: e.id || `exp-${idx}`,
            title: e.title || '',
            company: e.company || '',
            location: e.location || '',
            startDate: e.startDate || '',
            endDate: e.endDate || '',
            isCurrent: e.isCurrent || false,
            description: e.description || '',
          })),
          education: (contentJson.education || []).map((e: any, idx: number) => ({
            id: e.id || `edu-${idx}`,
            school: e.school || '',
            degree: e.degree || '',
            field: e.field || '',
            startDate: e.startDate || '',
            endDate: e.endDate || '',
          })),
          skills: (contentJson.skills || []).map((s: any, idx: number) => ({
            id: typeof s === 'string' ? `skill-${idx}` : (s.id || `skill-${idx}`),
            name: typeof s === 'string' ? s : (s.name || ''),
            category: typeof s === 'string' ? 'Technical' : (s.category || 'Technical'),
          })),
          languages: (contentJson.languages || []).map((l: any) => ({
            name: l.name || '',
            proficiency: l.proficiency || 'Native',
          })),
        };

        setResumeData(resumeData);
        const templateSlug = generatedResult.templateId || 'modern-professional';
        setSelectedTemplate(templateSlug);
        setCurrentResumeId(resumeId);
        setIsAIGenerated(true);
        console.log('Context - Generated resume loaded:', resumeId, 'with template:', templateSlug);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to load resume:', errorText);
        throw new Error('Failed to load resume');
      }

      const result = await response.json();
      setResumeData(result.resume_data as ResumeData);
      setSelectedTemplate(result.template_id);
      setCurrentResumeId(resumeId);
      setIsAIGenerated(true);
      console.log('Context - Resume loaded:', resumeId);
    } catch (error) {
      console.error('Error loading resume:', error);
      throw error;
    }
  }, [getAuthToken]);

  const listResumes = useCallback(async (): Promise<any[]> => {
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

      const response = await fetch(`${API_BASE_URL}/api/resume-builder/list`, {
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to list resumes:', errorText);
        throw new Error('Failed to list resumes');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error listing resumes:', error);
      throw error;
    }
  }, [getAuthToken]);

  const deleteResume = useCallback(async (resumeId: string): Promise<void> => {
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

      const response = await fetch(`${API_BASE_URL}/api/resume-builder/${resumeId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      if (currentResumeId === resumeId) {
        setCurrentResumeId(null);
        setResumeData(defaultData);
      }
      console.log('Context - Resume deleted:', resumeId);
    } catch (error) {
      console.error('Error deleting resume:', error);
      throw error;
    }
  }, [currentResumeId]);

  const generateWithAI = useCallback(async (formData: any): Promise<string | null> => {
    setAiGenerationInProgress(true);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/ai/generate-resume', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Generate resume error:', response.status, errorData);
        throw new Error(errorData.detail || `Failed to generate resume (${response.status})`);
      }

      const result = await response.json();
      setResumeData(result.resumeData);
      setIsAIGenerated(true);
      markDirty();

      // Auto-save to database
      try {
        const savedResumeId = await saveResume(
          `Resume - ${new Date().toLocaleDateString()}`,
          formData.templateId,
          result.resumeData
        );
        console.log('Context - Resume auto-saved with ID:', savedResumeId);
        return savedResumeId;
      } catch (saveError) {
        console.error('Error auto-saving resume:', saveError);
        // Don't throw - generation succeeded, just saving failed
        return null;
      }
    } catch (error) {
      console.error('Error generating resume:', error);
      throw error;
    } finally {
      setAiGenerationInProgress(false);
    }
  }, [markDirty, saveResume, getAuthToken]);


  const value = useMemo<ResumeBuilderContextValue>(() => ({
    selectedTemplate,
    setSelectedTemplate,
    resumeData,
    updatePersonalInfo,
    addWorkExperience,
    removeWorkExperience,
    addEducation,
    removeEducation,
    addSkill,
    removeSkill,
    setSummary,
    replaceResumeData,
    currentStep,
    setCurrentStep,
    isDirty,
    lastSaved,
    generateWithAI,
    isAIGenerated,
    aiGenerationInProgress,
    currentResumeId,
    setCurrentResumeId,
    saveResume,
    updateResume,
    loadResume,
    listResumes,
    deleteResume,
  }), [
    selectedTemplate,
    resumeData,
    updatePersonalInfo,
    addWorkExperience,
    removeWorkExperience,
    addEducation,
    removeEducation,
    addSkill,
    removeSkill,
    setSummary,
    replaceResumeData,
    currentStep,
    isDirty,
    lastSaved,
    generateWithAI,
    isAIGenerated,
    aiGenerationInProgress,
    currentResumeId,
    saveResume,
    updateResume,
    loadResume,
    listResumes,
    deleteResume,
  ]);

  return (
    <ResumeBuilderContext.Provider value={value}>{children}</ResumeBuilderContext.Provider>
  );
}

export function useResumeBuilder() {
  const ctx = useContext(ResumeBuilderContext);
  if (!ctx) throw new Error('useResumeBuilder must be used within ResumeBuilderProvider');
  return ctx;
}


