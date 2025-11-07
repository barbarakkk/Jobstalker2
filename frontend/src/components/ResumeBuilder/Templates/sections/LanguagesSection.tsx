import type { ResumeData } from '@/types/resume';
import type { SectionConfig, StyleConfig } from '../config/templateConfigSchema';

interface LanguagesSectionProps {
  data: ResumeData;
  config?: SectionConfig;
  style?: StyleConfig;
}

export function LanguagesSection({ data, config, style }: LanguagesSectionProps) {
  const languages = data.languages || [];
  
  if (languages.length === 0) return null;

  const containerStyle: React.CSSProperties = {
    ...style,
    ...config?.style,
  };

  const showTitle = config?.showTitle !== false;
  const title = config?.title || 'Languages';

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
      <div className="space-y-2">
        {languages.map((lang, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">{lang.name}</span>
            <span 
              className="text-xs px-2 py-1 rounded font-medium"
              style={{
                color: String(primaryColor),
                backgroundColor: `${primaryColor}15`,
                border: `1px solid ${primaryColor}40`
              }}
            >
              {lang.proficiency}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

