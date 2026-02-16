import type { ResumeData } from '@/types/resume';
import type { SectionConfig, StyleConfig } from '../config/templateConfigSchema';

interface CleanImpactWorkSectionProps {
  data: ResumeData;
  config?: SectionConfig;
  style?: StyleConfig;
}

export function CleanImpactWorkSection({ data, config, style }: CleanImpactWorkSectionProps) {
  const workExperience = data.workExperience || [];
  
  if (workExperience.length === 0) return null;

  const containerStyle: React.CSSProperties = {
    ...style,
    ...config?.style,
  };

  const showTitle = config?.showTitle !== false;
  const title = config?.title || 'WORK EXPERIENCE';
  const accentColor: string = String(style?.primaryColor || config?.style?.primaryColor || '#1ca3b8');

  // Parse description into bullets (split by newlines or common bullet patterns)
  const parseBullets = (description: string): string[] => {
    if (!description) return [];
    
    // Split by newlines first
    const lines = description.split(/\n+/).filter(line => line.trim());
    
    // If lines contain bullet markers, clean them up - remove ALL asterisks and bullet symbols
    return lines.map(line => {
      // Remove common bullet markers, asterisks, and dashes
      let cleaned = line.replace(/^[\u2022\u2023\u25E6\u2043\u2219\*\-\•]\s*/, '');
      cleaned = cleaned.replace(/[\*\u2022\u2023\u25E6\u2043\u2219•]/g, ''); // Remove asterisks anywhere in line
      cleaned = cleaned.replace(/\*/g, ''); // Remove any remaining asterisks
      cleaned = cleaned.replace(/^\s*[-]\s*/, ''); // Remove leading dashes
      return cleaned.trim();
    }).filter(line => line.length > 0);
  };

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
            marginBottom: '8px',
            lineHeight: '1.2'
          }}
        >
          {title}
        </h2>
      )}
      <div className="space-y-4" style={{ paddingTop: '0' }}>
        {workExperience.map((work) => {
          const bullets = parseBullets(work.description || '');
          
          return (
            <div key={work.id} className="clean-impact-work-entry">
              <div className="flex items-start justify-between gap-4 mb-2.5">
                <div className="flex-1">
                  <div 
                    className="font-bold text-base"
                    style={{ color: '#1c1e21' }}
                  >
                    {work.title}, {work.company}
                    {work.jobType && <span className="ml-2 text-xs font-normal" style={{ color: '#5a6b7a' }}>• {work.jobType}</span>}
                  </div>
                </div>
                <div 
                  className="text-sm whitespace-nowrap flex-shrink-0"
                  style={{ color: '#5a6b7a' }}
                >
                  {work.startDate} — {work.isCurrent ? 'Present' : (work.endDate || '')}
                </div>
              </div>
              
              {bullets.length > 0 && (
                <ul className="list-none pl-0 space-y-1" style={{ marginLeft: '0', lineHeight: 1.5 }}>
                  {bullets.map((bullet, index) => (
                    <li 
                      key={index} 
                      className="text-sm flex items-start"
                      style={{ 
                        color: '#1c1e21',
                        marginTop: '4px',
                        marginBottom: '4px',
                      }}
                    >
                      <span className="mr-2 flex-shrink-0" style={{ color: accentColor }}>•</span>
                      <span>{bullet}</span>
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

