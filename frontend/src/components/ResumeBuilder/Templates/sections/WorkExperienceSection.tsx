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

  // Get primary color and font overrides from theme if available in style
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
        marginBottom: '0.4rem', // Reduced spacing between sections
      }} 
      className={config?.className}
    >
      {showTitle && (
        <h2 
          className="text-xl font-bold mb-1"
          style={{ 
            color: String(style?.color || config?.style?.color || primaryColor),
            borderBottom: `2px solid ${primaryColor}`,
            paddingBottom: '0.25rem',
            marginBottom: '0.25rem'
          }}
        >
          {title}
        </h2>
      )}
      <div className="space-y-2">
        {workExperience.map((work) => (
          <div key={work.id} className="border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-1">
              <div className="flex-1">
              <div className="font-semibold text-gray-900" style={{ color: String(primaryColor) }}>{work.title}</div>
              {work.company && (
                <div className="font-medium text-sm" style={{ color: String(primaryColor), opacity: 0.8 }}>
                  {work.company}
                  {work.jobType && <span className="ml-2 text-xs">• {work.jobType}</span>}
                </div>
              )}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(work.startDate)} - {work.isCurrent ? 'Present' : formatDate(work.endDate || '')}
              </div>
            </div>
            {work.location && (
              <div className="text-xs text-gray-600 mb-1">
                {work.location}
              </div>
            )}
            {work.description && (
              <div className="text-sm text-gray-700 leading-normal mt-1">
                {work.description.split('\n').filter(line => line.trim()).map((line, index) => {
                  // Remove all asterisks, bullet symbols, and dashes from the line
                  let cleanedLine = line.replace(/^[\*\u2022\u2023\u25E6\u2043\u2219•\-]\s*/, '').trim();
                  cleanedLine = cleanedLine.replace(/[\*\u2022\u2023\u25E6\u2043\u2219•]/g, '').trim();
                  if (!cleanedLine) return null;
                  return (
                    <div key={index} className="flex items-start mb-0.5">
                      <span className="mr-2 text-gray-700" style={{ color: String(primaryColor) }}>•</span>
                      <span>{cleanedLine}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

