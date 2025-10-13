import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ResumeData, PersonalInfo, WorkExperience, Education, Skill } from '@/types/resume';

type ResumeTemplateId = 
  | 'modern-pro' 
  | 'classic-executive' 
  | 'tech-min'
  | 'jsonresume-theme-modern'
  | 'jsonresume-theme-flat'
  | 'jsonresume-theme-elegant'
  | 'jsonresume-theme-classy'
  | 'jsonresume-theme-kendall'
  | 'jsonresume-theme-stackoverflow'
  | 'jsonresume-theme-paper'
  | 'jsonresume-theme-short'
  | 'jsonresume-theme-spartan';

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
  currentStep: number;
  setCurrentStep: (s: number) => void;
  isDirty: boolean;
  lastSaved?: number;
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
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplateId>('jsonresume-theme-modern');
  const [resumeData, setResumeData] = useState<ResumeData>(defaultData);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<number | undefined>(undefined);

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
    currentStep,
    setCurrentStep,
    isDirty,
    lastSaved,
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
    currentStep,
    isDirty,
    lastSaved,
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


