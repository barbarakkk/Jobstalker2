import type { ResumeData } from '@/types/resume';
import type { SectionConfig, StyleConfig } from '../config/templateConfigSchema';

interface CleanImpactSummarySectionProps {
  data: ResumeData;
  config?: SectionConfig;
  style?: StyleConfig;
}

export function CleanImpactSummarySection({ data, config, style }: CleanImpactSummarySectionProps) {
  if (!data.summary) return null;

  const containerStyle: React.CSSProperties = {
    ...style,
    ...config?.style,
  };

  const showTitle = config?.showTitle !== false;
  const title = config?.title || 'SUMMARY';
  const accentColor: string = String(style?.primaryColor || config?.style?.primaryColor || '#1ca3b8');

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
      <p 
        className="text-sm leading-relaxed"
        style={{ 
          color: '#1c1e21',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
      >
        {data.summary}
      </p>
    </section>
  );
}

