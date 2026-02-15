import type { ResumeData } from '@/types/resume';
import type { SectionConfig, StyleConfig } from '../config/templateConfigSchema';

interface CleanImpactEducationSectionProps {
  data: ResumeData;
  config?: SectionConfig;
  style?: StyleConfig;
}

export function CleanImpactEducationSection({ data, config, style }: CleanImpactEducationSectionProps) {
  const education = data.education || [];
  
  if (education.length === 0) return null;

  const containerStyle: React.CSSProperties = {
    ...style,
    ...config?.style,
  };

  const showTitle = config?.showTitle !== false;
  const title = config?.title || 'EDUCATION';
  const accentColor: string = String(style?.primaryColor || config?.style?.primaryColor || '#1ca3b8');

  return (
    <section style={containerStyle} className={`clean-impact-section ${config?.className || ''}`}>
      {showTitle && (
        <h2 
          className="text-xs font-bold uppercase tracking-wider"
          style={{ 
            color: accentColor,
            fontSize: '12px',
            letterSpacing: '1.2px',
            borderBottom: `2px solid ${accentColor}`,
            paddingBottom: '6px',
            marginBottom: '12px'
          }}
        >
          {title}
        </h2>
      )}
      <div className="space-y-4" style={{ paddingTop: '2px' }}>
        {education.map((edu) => {
          return (
            <div key={edu.id} className="clean-impact-education-entry">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div 
                    className="font-bold text-base"
                    style={{ color: '#1c1e21' }}
                  >
                    {edu.degree}
                  </div>
                  {edu.school && (
                    <div 
                      className="text-sm mt-1"
                      style={{ color: '#5a6b7a', fontSize: '13px' }}
                    >
                      {edu.school}
                    </div>
                  )}
                </div>
                <div 
                  className="text-sm whitespace-nowrap flex-shrink-0"
                  style={{ color: '#5a6b7a' }}
                >
                  {edu.startDate} — {edu.endDate}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

