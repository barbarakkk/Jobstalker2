import type { LayoutConfig } from '../config/templateConfigSchema';
import { parseLayout } from '../utils/templateUtils';

interface LayoutRendererProps {
  layout: LayoutConfig;
  children: React.ReactNode;
  theme?: any;
}

export function LayoutRenderer({ layout, children, theme }: LayoutRendererProps) {
  const layoutClasses = parseLayout(layout);
  
  const containerStyle: React.CSSProperties = {
    maxWidth: layout.maxWidth || '800px',
    padding: layout.padding || '2rem',
    width: '100%',
    fontFamily: theme?.fontFamily,
    color: theme?.textColor,
  };
  
  const gridStyle: React.CSSProperties = {};
  
  // Handle gap if it's a custom value
  if (layout.gap && (layout.gap.includes('rem') || layout.gap.includes('px'))) {
    gridStyle.gap = layout.gap;
  }
  
  if (layout.gridTemplateColumns) {
    gridStyle.gridTemplateColumns = layout.gridTemplateColumns;
  }
  
  if (layout.gridTemplateAreas) {
    gridStyle.gridTemplateAreas = layout.gridTemplateAreas;
  }
  
  return (
    <div style={containerStyle} className="mx-auto">
      <div 
        className={layoutClasses}
        style={gridStyle}
      >
        {children}
      </div>
    </div>
  );
}

