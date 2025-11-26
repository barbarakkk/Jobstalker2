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
        fontSize: fontSize
      }} 
      className={config?.className}
    >
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
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span 
            key={skill.id} 
            className="px-3 py-1 text-xs rounded-full font-medium border"
            style={{
              backgroundColor: `${primaryColor}15`,
              color: String(primaryColor),
              borderColor: `${primaryColor}40`
            }}
          >
            {skill.name}
          </span>
        ))}
      </div>
    </section>
  );
}

