export type SectionType = 'header' | 'summary' | 'work' | 'education' | 'skills' | 'languages';

export type LayoutType = 'single-column' | 'two-column' | 'three-column' | 'custom-grid';

export interface StyleConfig {
  background?: string;
  color?: string;
  padding?: string;
  margin?: string;
  border?: string;
  borderBottom?: string;
  borderTop?: string;
  borderRadius?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  [key: string]: string | number | undefined;
}

export interface SectionConfig {
  type: SectionType;
  position: 'top' | 'after-header' | 'main' | 'sidebar' | 'bottom' | string;
  order?: number;
  visible?: boolean;
  style?: StyleConfig;
  className?: string;
  title?: string;
  showTitle?: boolean;
}

export interface LayoutConfig {
  type: LayoutType;
  columns?: number;
  maxWidth?: string;
  gap?: string;
  padding?: string;
  className?: string;
  gridTemplateColumns?: string;
  gridTemplateAreas?: string;
}

export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  backgroundColor?: string;
  accentColor?: string;
  borderColor?: string;
  fontFamily?: string;
  headingFontSize?: string;
  bodyFontSize?: string;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  description?: string;
  category?: string;
  badge?: string;
  preview?: string;
  colors?: string[];
}

export interface TemplateConfig {
  metadata: TemplateMetadata;
  layout: LayoutConfig;
  sections: SectionConfig[];
  theme: ThemeConfig;
  styles?: {
    container?: StyleConfig;
    section?: StyleConfig;
    [key: string]: StyleConfig | undefined;
  };
}

export interface TemplateInfo {
  id: string;
  name: string;
  description?: string;
  category?: string;
  badge?: string;
  preview?: string;
  colors?: string[];
}

export interface TemplateManifest {
  templates: TemplateInfo[];
}

