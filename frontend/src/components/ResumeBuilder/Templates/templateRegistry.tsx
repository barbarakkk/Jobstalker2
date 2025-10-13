import type { ResumeData } from '@/types/resume';
import { ModernProfessional } from './ModernProfessional';
import { ClassicExecutive } from './ClassicExecutive';
import { TechMinimalist } from './TechMinimalist';
import { ModernJSONResume } from './ModernJSONResume';

export type TemplateId = 
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

export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  'modern-pro': 'Modern Professional',
  'classic-executive': 'Classic Executive',
  'tech-min': 'Tech Minimalist',
  'jsonresume-theme-modern': 'Modern',
  'jsonresume-theme-flat': 'Flat',
  'jsonresume-theme-elegant': 'Elegant',
  'jsonresume-theme-classy': 'Classy',
  'jsonresume-theme-kendall': 'Kendall',
  'jsonresume-theme-stackoverflow': 'StackOverflow',
  'jsonresume-theme-paper': 'Paper',
  'jsonresume-theme-short': 'Short',
  'jsonresume-theme-spartan': 'Spartan',
};

export function renderTemplate(id: TemplateId, data: ResumeData, handlers?: any) {
  switch (id) {
    case 'modern-pro':
      return <ModernProfessional data={data} {...handlers} />;
    case 'classic-executive':
      return <ClassicExecutive data={data} {...handlers} />;
    case 'tech-min':
      return <TechMinimalist data={data} {...handlers} />;
    // JSON Resume templates - for now, use ModernJSONResume for all JSON Resume themes
    case 'jsonresume-theme-modern':
    case 'jsonresume-theme-flat':
    case 'jsonresume-theme-elegant':
    case 'jsonresume-theme-classy':
    case 'jsonresume-theme-kendall':
    case 'jsonresume-theme-stackoverflow':
    case 'jsonresume-theme-paper':
    case 'jsonresume-theme-short':
    case 'jsonresume-theme-spartan':
      return <ModernJSONResume data={data} theme={id} {...handlers} />;
    default:
      return <ModernProfessional data={data} {...handlers} />;
  }
}


