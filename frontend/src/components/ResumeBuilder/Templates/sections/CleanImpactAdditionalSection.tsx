import type { ResumeData } from '@/types/resume';
import type { SectionConfig, StyleConfig } from '../config/templateConfigSchema';

interface CleanImpactAdditionalSectionProps {
  data: ResumeData;
  config?: SectionConfig;
  style?: StyleConfig;
}

export function CleanImpactAdditionalSection({ data, config, style }: CleanImpactAdditionalSectionProps) {
  const skills = data.skills || [];
  const languages = data.languages || [];
  
  // Check if there's any content to show
  const hasContent = skills.length > 0 || languages.length > 0;
  
  if (!hasContent) return null;

  const containerStyle: React.CSSProperties = {
    ...style,
    ...config?.style,
  };

  const showTitle = config?.showTitle !== false;
  const title = config?.title || 'ADDITIONAL INFORMATION';
  const accentColor = style?.primaryColor || config?.style?.primaryColor || '#1ca3b8';

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill.name);
    return acc;
  }, {} as Record<string, string[]>);

  // Format languages
  const languagesList = languages.map(lang => 
    lang.proficiency ? `${lang.name} (${lang.proficiency})` : lang.name
  );

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
      <div className="space-y-2 clean-impact-additional">
        {skills.length > 0 && (
          <div className="text-sm" style={{ marginTop: '6px', marginBottom: '6px' }}>
            <span className="font-bold" style={{ color: '#1c1e21' }}>Technical Skills:</span>{' '}
            <span style={{ color: '#1c1e21' }}>
              {Object.entries(skillsByCategory).map(([category, skillNames], idx) => (
                <span key={category}>
                  {idx > 0 && ', '}
                  {skillNames.join(', ')}
                </span>
              ))}
            </span>
          </div>
        )}
        
        {languages.length > 0 && (
          <div className="text-sm" style={{ marginTop: '6px', marginBottom: '6px' }}>
            <span className="font-bold" style={{ color: '#1c1e21' }}>Languages:</span>{' '}
            <span style={{ color: '#1c1e21' }}>
              {languagesList.join(', ')}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

