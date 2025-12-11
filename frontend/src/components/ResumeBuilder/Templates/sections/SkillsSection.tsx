import type { ResumeData } from '@/types/resume';
import type { SectionConfig, StyleConfig } from '../config/templateConfigSchema';

interface SkillsSectionProps {
  data: ResumeData;
  config?: SectionConfig;
  style?: StyleConfig;
}

export function SkillsSection({ data, config, style }: SkillsSectionProps) {
  const skills = data.skills || [];
  
  if (skills.length === 0) return null;

  const containerStyle: React.CSSProperties = {
    ...style,
    ...config?.style,
  };

  const showTitle = config?.showTitle !== false;
  const title = config?.title || 'Skills';

  const primaryColor = style?.primaryColor || config?.style?.primaryColor || '#000000';
  const bodyFont = (style as any)?.fontFamily || config?.style?.fontFamily;
  const fontSize = (style as any)?.fontSize || config?.style?.fontSize;
  
  return (
    <section 
      style={{
        ...containerStyle,
        fontFamily: bodyFont,
        fontSize: fontSize,
        marginBottom: '0.75rem', // Reduced spacing between sections
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
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span 
            key={skill.id} 
            className="text-sm"
            style={{
              color: String(primaryColor),
            }}
          >
            {skill.name}{index < skills.length - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
    </section>
  );
}

