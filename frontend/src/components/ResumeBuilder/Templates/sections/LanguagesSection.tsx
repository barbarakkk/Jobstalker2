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
    marginBottom: '0.5rem', // Reduced bottom margin to prevent cutoff
  };

  const showTitle = config?.showTitle !== false;
  const title = config?.title || 'Languages';

  const primaryColor = style?.primaryColor || config?.style?.primaryColor || '#000000';
  const bodyFont = (style as any)?.fontFamily || config?.style?.fontFamily;
  const fontSize = (style as any)?.fontSize || config?.style?.fontSize;
  
  return (
    <section 
      style={{
        ...containerStyle,
        fontFamily: bodyFont,
        fontSize: fontSize
      }} 
      className={config?.className}
    >
      {showTitle && (
        <h2 
          className="text-xl font-bold mb-2" // Reduced from mb-4 to mb-2
          style={{ 
            color: String(style?.color || config?.style?.color || primaryColor),
            borderBottom: `2px solid ${primaryColor}`,
            paddingBottom: '0.5rem',
            marginBottom: '0.6rem'
          }}
        >
          {title}
        </h2>
      )}
      <div className="space-y-1.5"> {/* Reduced from space-y-2 to space-y-1.5 */}
        {languages.map((lang, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: String(primaryColor) }}>{lang.name}</span>
            <span 
              className="text-sm"
              style={{
                color: String(primaryColor),
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

