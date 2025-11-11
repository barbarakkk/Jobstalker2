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

  // Clean Professional variant (photo + labeled contacts)
  const isCleanProfessional = (config?.className || '').includes('ci-header');
  if (isCleanProfessional) {
    const accent = (style as any)?.primaryColor || (config?.style as any)?.primaryColor || '#1ca3b8';
    return (
      <header style={containerStyle} className={`clean-impact-header ${config?.className || ''}`}>
        <div className="flex items-start gap-4">
          {/* Photo placeholder box */}
          <div
            className="flex-shrink-0 w-22 h-22 rounded-lg overflow-hidden bg-gray-200"
            style={{ width: '88px', height: '88px', borderRadius: '10px' }}
          />

          <div className="flex-1">
            <h1
              className="font-extrabold mb-2"
              style={{ color: String(accent), fontSize: '28px', letterSpacing: '.3px' }}
            >
              {name.toUpperCase()}
            </h1>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs" style={{ color: '#5a6b7a' }}>
              {personalInfo.location && (
                <div>
                  <span>Address:</span>{' '}
                  <span style={{ color: '#1c1e21' }}>{personalInfo.location}</span>
                </div>
              )}
              {personalInfo.phone && (
                <div>
                  <span>Phone:</span>{' '}
                  <span style={{ color: '#1c1e21' }}>{personalInfo.phone}</span>
                </div>
              )}
              {personalInfo.email && (
                <div>
                  <span>Email:</span>{' '}
                  <span style={{ color: '#1c1e21' }}>{personalInfo.email}</span>
                </div>
              )}
              {personalInfo.website && (
                <div>
                  <span>Website:</span>{' '}
                  <span style={{ color: '#1c1e21' }}>{personalInfo.website}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Get font overrides from style
  const headerFont = (style as any)?.fontFamily || config?.style?.fontFamily;
  const fontSize = (style as any)?.fontSize || config?.style?.fontSize;

  return (
    <header style={containerStyle} className={config?.className}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1">
          <h1 
            className="text-3xl font-bold tracking-tight"
            style={{ 
              color: style?.color || config?.style?.color,
              fontFamily: headerFont,
              fontSize: fontSize
            }}
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

