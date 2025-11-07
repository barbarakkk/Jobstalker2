import type { ResumeData } from '@/types/resume';
import type { SectionConfig, StyleConfig } from '../config/templateConfigSchema';

interface WorkExperienceSectionProps {
  data: ResumeData;
  config?: SectionConfig;
  style?: StyleConfig;
}

export function WorkExperienceSection({ data, config, style }: WorkExperienceSectionProps) {
  const workExperience = data.workExperience || [];
  
  if (workExperience.length === 0) return null;

  const containerStyle: React.CSSProperties = {
    ...style,
    ...config?.style,
  };

  const showTitle = config?.showTitle !== false;
  const title = config?.title || 'Work Experience';

  // Get primary color from theme if available in style
  const primaryColor = style?.primaryColor || config?.style?.primaryColor || '#2563eb';
  
  return (
    <section style={containerStyle} className={config?.className}>
      {showTitle && (
        <h2 
          className="text-xl font-bold mb-4"
          style={{ 
            color: style?.color || config?.style?.color || primaryColor,
            borderBottom: `2px solid ${primaryColor}`,
            paddingBottom: '0.5rem'
          }}
        >
          {title}
        </h2>
      )}
      <div className="space-y-4">
        {workExperience.map((work) => (
          <div key={work.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
              <div className="flex-1">
              <div className="font-semibold text-gray-900" style={{ color: primaryColor }}>{work.title}</div>
              {work.company && (
                <div className="font-medium text-sm" style={{ color: primaryColor, opacity: 0.8 }}>{work.company}</div>
              )}
              </div>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {work.startDate} — {work.isCurrent ? 'Present' : (work.endDate || '')}
              </div>
            </div>
            {work.location && (
              <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                <span>📍</span>
                <span>{work.location}</span>
              </div>
            )}
            {work.description && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mt-2">
                {work.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

