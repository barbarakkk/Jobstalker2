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

  const primaryColor = style?.primaryColor || config?.style?.primaryColor || '#000000';
  const bodyFont = (style as any)?.fontFamily || config?.style?.fontFamily;
  const fontSize = (style as any)?.fontSize || config?.style?.fontSize;

  // Format date to "Jun 2015" format
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      // Handle YYYY-MM format
      if (dateString.match(/^\d{4}-\d{2}$/)) {
        const date = new Date(dateString + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      // Handle YYYY-MM-DD format
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      // Try to parse as-is
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      return dateString; // Return as-is if can't parse
    } catch {
      return dateString; // Return as-is if error
    }
  };
  
  return (
    <section 
      style={{
        ...containerStyle,
        fontFamily: bodyFont,
        fontSize: fontSize,
        marginBottom: '0.75rem',
      }} 
      className={config?.className}
    >
      {showTitle && (
        <h2 
          className="text-xl font-bold"
          style={{ 
            color: String(style?.color || config?.style?.color || primaryColor),
            borderBottom: `2px solid ${primaryColor}`,
            paddingBottom: '0.5rem',
            marginBottom: '0.5rem',
            lineHeight: '1.2'
          }}
        >
          {title}
        </h2>
      )}
      <div className="space-y-3" style={{ paddingTop: '0.125rem' }}>
        {education.map((edu) => (
          <div key={edu.id} className="pb-3 last:pb-0">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-0.5">
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-900" style={{ color: String(primaryColor) }}>{edu.degree}</div>
                <div className="text-xs text-gray-600 mt-0.5">{edu.school}</div>
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(edu.startDate)} - {formatDate(edu.endDate || '')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

