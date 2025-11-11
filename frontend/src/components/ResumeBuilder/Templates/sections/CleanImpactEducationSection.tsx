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
  const accentColor = style?.primaryColor || config?.style?.primaryColor || '#1ca3b8';

  return (
    <section style={containerStyle} className={`clean-impact-section ${config?.className || ''}`}>
      {showTitle && (
        <h2 
          className="text-xs font-bold mb-2 uppercase tracking-wider"
          style={{ 
            color: accentColor,
            fontSize: '12px',
            letterSpacing: '1.2px',
            borderBottom: `2px solid ${accentColor}`,
            paddingBottom: '4px',
            marginBottom: '8px'
          }}
        >
          {title}
        </h2>
      )}
      <div className="space-y-4">
        {education.map((edu) => {
          // Parse field into potential details/bullets
          const details = edu.field ? [edu.field] : [];
          
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
              
              {details.length > 0 && (
                <ul className="list-none pl-4 space-y-1" style={{ marginLeft: '16px' }}>
                  {details.map((detail, index) => (
                    <li 
                      key={index} 
                      className="text-sm"
                      style={{ 
                        color: '#1c1e21',
                        marginTop: '3px',
                        marginBottom: '3px',
                        listStyle: 'disc',
                        listStylePosition: 'outside'
                      }}
                    >
                      {detail}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

