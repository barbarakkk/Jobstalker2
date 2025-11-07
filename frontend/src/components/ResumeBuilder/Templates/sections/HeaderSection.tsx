import type { ResumeData } from '@/types/resume';
import type { SectionConfig, StyleConfig } from '../config/templateConfigSchema';

interface HeaderSectionProps {
  data: ResumeData;
  config?: SectionConfig;
  style?: StyleConfig;
}

export function HeaderSection({ data, config, style }: HeaderSectionProps) {
  const personalInfo = data.personalInfo;
  const name = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() || 'Your Name';
  
  // Apply custom styles from config
  const containerStyle: React.CSSProperties = {
    ...style,
    ...config?.style,
  };

  return (
    <header style={containerStyle} className={config?.className}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1">
          <h1 
            className="text-3xl font-bold tracking-tight"
            style={{ color: style?.color || config?.style?.color }}
          >
            {name}
          </h1>
          {personalInfo.jobTitle && (
            <div className="text-lg text-gray-600 mt-1">
              {personalInfo.jobTitle}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 text-sm text-gray-600">
          {personalInfo.email && (
            <div className="flex items-center gap-2">
              <span>✉</span>
              <span>{personalInfo.email}</span>
            </div>
          )}
          {personalInfo.phone && (
            <div className="flex items-center gap-2">
              <span>📞</span>
              <span>{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.location && (
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>{personalInfo.location}</span>
            </div>
          )}
          {personalInfo.linkedin && (
            <div className="flex items-center gap-2">
              <span>💼</span>
              <span>{personalInfo.linkedin}</span>
            </div>
          )}
          {personalInfo.website && (
            <div className="flex items-center gap-2">
              <span>🌐</span>
              <span>{personalInfo.website}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

