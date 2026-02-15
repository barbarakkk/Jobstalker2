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

  const useTwoColumns = skills.length > 3;
  const mid = useTwoColumns ? Math.ceil(skills.length / 2) : skills.length;
  const leftSkills = skills.slice(0, mid);
  const rightSkills = skills.slice(mid);

  const renderSkillList = (list: typeof skills) => (
    <ul className="list-none pl-0 space-y-1" style={{ paddingTop: '0.125rem', marginTop: '0' }}>
      {list.map((skill) => (
        <li
          key={skill.id}
          className="text-sm flex items-start py-0.5"
          style={{
            color: String(primaryColor),
            lineHeight: 1.5,
          }}
        >
          <span className="mr-2 flex-shrink-0" style={{ color: String(primaryColor) }}>•</span>
          <span>{skill.name}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <section
      style={{
        ...containerStyle,
        fontFamily: bodyFont,
        fontSize: fontSize,
        marginBottom: '0.75rem',
      }}
      className={`skills-section ${config?.className || ''}`.trim()}
    >
      {showTitle && (
        <h2
          className="text-xl font-bold"
          style={{
            color: String(style?.color || config?.style?.color || primaryColor),
            borderBottom: `2px solid ${primaryColor}`,
            paddingBottom: '0.5rem',
            marginBottom: '0.9rem',
          }}
        >
          {title}
        </h2>
      )}
      {useTwoColumns ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-0 skills-section-content skills-section-content--two-cols" style={{ paddingTop: '0.125rem' }}>
          <div>{renderSkillList(leftSkills)}</div>
          <div>{renderSkillList(rightSkills)}</div>
        </div>
      ) : (
        <div className="skills-section-content">
          {renderSkillList(skills)}
        </div>
      )}
    </section>
  );
}

