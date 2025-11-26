import type { ResumeData } from '@/types/resume';
import type { SectionConfig, StyleConfig } from '../config/templateConfigSchema';

interface SummarySectionProps {
  data: ResumeData;
  config?: SectionConfig;
  style?: StyleConfig;
}

export function SummarySection({ data, config, style }: SummarySectionProps) {
  if (!data.summary) return null;

  const containerStyle: React.CSSProperties = {
    ...style,
    ...config?.style,
  };

  const showTitle = config?.showTitle !== false;
  const title = config?.title || 'Professional Summary';

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
          className="text-xl font-bold mb-3"
          style={{ 
            color: String(style?.color || config?.style?.color || primaryColor),
            borderBottom: `2px solid ${primaryColor}`,
            paddingBottom: '0.5rem'
          }}
        >
          {title}
        </h2>
      )}
      <p 
        className="text-sm leading-relaxed whitespace-pre-line"
        style={{ color: style?.color || config?.style?.color }}
      >
        {data.summary}
      </p>
    </section>
  );
}

