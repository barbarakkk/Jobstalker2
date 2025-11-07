import type { ResumeData } from '@/types/resume';
import type { SectionConfig, StyleConfig } from '../config/templateConfigSchema';

interface EducationSectionProps {
  data: ResumeData;
  config?: SectionConfig;
  style?: StyleConfig;
}

export function EducationSection({ data, config, style }: EducationSectionProps) {
  const education = data.education || [];
  
  if (education.length === 0) return null;

  const containerStyle: React.CSSProperties = {
    ...style,
    ...config?.style,
  };

  const showTitle = config?.showTitle !== false;
  const title = config?.title || 'Education';

  const primaryColor = style?.primaryColor || config?.style?.primaryColor || '#2563eb';
  
  return (
    <section style={containerStyle} className={config?.className}>
      {showTitle && (
        <h2 
          className="text-xl font-bold mb-4"
          style={{ 
            color: String(style?.color || config?.style?.color || primaryColor),
            borderBottom: `2px solid ${primaryColor}`,
            paddingBottom: '0.5rem'
          }}
        >
          {title}
        </h2>
      )}
      <div className="space-y-3">
        {education.map((edu) => (
          <div key={edu.id} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
            <div className="font-semibold text-sm text-gray-900" style={{ color: String(primaryColor) }}>{edu.degree}</div>
            {edu.field && (
              <div className="text-sm" style={{ color: String(primaryColor), opacity: 0.8 }}>{edu.field}</div>
            )}
            <div className="text-xs text-gray-600 mt-1">{edu.school}</div>
            <div className="text-xs text-gray-500 mt-1">{edu.startDate} — {edu.endDate}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

