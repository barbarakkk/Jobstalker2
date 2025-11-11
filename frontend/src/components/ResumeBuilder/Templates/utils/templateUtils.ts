import type { TemplateConfig, SectionConfig, LayoutConfig, StyleConfig } from '../config/templateConfigSchema';
import { HeaderSection } from '../sections/HeaderSection';
import { SummarySection } from '../sections/SummarySection';
import { WorkExperienceSection } from '../sections/WorkExperienceSection';
import { EducationSection } from '../sections/EducationSection';
import { SkillsSection } from '../sections/SkillsSection';
import { LanguagesSection } from '../sections/LanguagesSection';
import { CleanImpactHeaderSection } from '../sections/CleanImpactHeaderSection';
import { CleanImpactSummarySection } from '../sections/CleanImpactSummarySection';
import { CleanImpactWorkSection } from '../sections/CleanImpactWorkSection';
import { CleanImpactEducationSection } from '../sections/CleanImpactEducationSection';
import { CleanImpactAdditionalSection } from '../sections/CleanImpactAdditionalSection';
import type { ResumeData } from '@/types/resume';

export function applyStyles(config: StyleConfig | undefined, baseStyles: React.CSSProperties = {}): React.CSSProperties {
  if (!config) return baseStyles;
  
  const style: React.CSSProperties = { ...baseStyles };
  
  Object.entries(config).forEach(([key, value]) => {
    if (value !== undefined) {
      // Convert kebab-case to camelCase for CSS properties
      const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      style[camelKey as keyof React.CSSProperties] = String(value) as any;
    }
  });
  
  return style;
}

export function getSectionComponent(type: string) {
  switch (type) {
    case 'header':
      return HeaderSection;
    case 'summary':
      return SummarySection;
    case 'work':
      return WorkExperienceSection;
    case 'education':
      return EducationSection;
    case 'skills':
      return SkillsSection;
    case 'languages':
      return LanguagesSection;
    // Clean Impact template sections
    case 'header-clean-impact':
      return CleanImpactHeaderSection;
    case 'summary-clean-impact':
      return CleanImpactSummarySection;
    case 'work-clean-impact':
      return CleanImpactWorkSection;
    case 'education-clean-impact':
      return CleanImpactEducationSection;
    case 'additional-clean-impact':
      return CleanImpactAdditionalSection;
    default:
      return null;
  }
}

export function validateTemplateConfig(config: any): config is TemplateConfig {
  if (!config || typeof config !== 'object') return false;
  
  if (!config.metadata || !config.metadata.id || !config.metadata.name) return false;
  if (!config.layout || !config.layout.type) return false;
  if (!Array.isArray(config.sections)) return false;
  if (!config.theme || typeof config.theme !== 'object') return false;
  
  return true;
}

export function parseLayout(layoutConfig: LayoutConfig): string {
  const classes: string[] = [];
  
  switch (layoutConfig.type) {
    case 'single-column':
      classes.push('grid', 'grid-cols-1');
      break;
    case 'two-column':
      // Force 2 columns even on smaller screens for preview consistency
      classes.push('grid', 'grid-cols-2');
      break;
    case 'three-column':
      // Force 3 columns for executive template
      classes.push('grid', 'grid-cols-3');
      break;
    case 'custom-grid':
      if (layoutConfig.gridTemplateColumns) {
        classes.push('grid');
      }
      break;
  }
  
  // Parse gap - handle both string like "1.5rem" and Tailwind classes
  if (layoutConfig.gap) {
    if (layoutConfig.gap.includes('rem') || layoutConfig.gap.includes('px')) {
      // Custom gap value, will be applied via style
    } else {
      // Tailwind gap class
      classes.push(`gap-${layoutConfig.gap.replace('gap-', '')}`);
    }
  } else {
    classes.push('gap-6');
  }
  
  if (layoutConfig.className) {
    classes.push(layoutConfig.className);
  }
  
  return classes.join(' ');
}

export function getSectionData(data: ResumeData, sectionType: string): any {
  switch (sectionType) {
    case 'header':
    case 'summary':
    case 'work':
    case 'education':
    case 'skills':
    case 'languages':
      return data;
    default:
      return data;
  }
}

export function sortSections(sections: SectionConfig[]): SectionConfig[] {
  return [...sections].sort((a, b) => {
    // First sort by order if specified
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    
    // Then sort by position
    const positionOrder: Record<string, number> = {
      'top': 1,
      'after-header': 2,
      'main': 3,
      'sidebar': 4,
      'bottom': 5,
    };
    
    const aOrder = positionOrder[a.position] || 99;
    const bOrder = positionOrder[b.position] || 99;
    return aOrder - bOrder;
  });
}

