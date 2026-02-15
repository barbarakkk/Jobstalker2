import type { LayoutConfig } from '../config/templateConfigSchema';
import { parseLayout } from '../utils/templateUtils';

interface LayoutRendererProps {
  layout: LayoutConfig;
  children: React.ReactNode;
  theme?: any;
}

export function LayoutRenderer({ layout, children, theme }: LayoutRendererProps) {
  const layoutClasses = parseLayout(layout);
  
  let padding = layout.padding || '0.75rem';
  if (padding) {
    const paddingMatch = padding.match(/(\d+\.?\d*)(rem|px)/);
    if (paddingMatch) {
      const value = parseFloat(paddingMatch[1]);
      const unit = paddingMatch[2];
      if (unit === 'rem' && value > 1.25) {
        padding = '1.25rem';
      } else if (unit === 'px' && value > 20) {
        padding = '20px';
      }
    }
  }
  
  const containerStyle: React.CSSProperties = {
    maxWidth: layout.maxWidth || '800px',
    padding: padding,
    width: '100%',
    fontFamily: theme?.fontFamily,
    color: theme?.textColor,
  };
  
  const gridStyle: React.CSSProperties = {};
  
  if (layout.gap && (layout.gap.includes('rem') || layout.gap.includes('px'))) {
    let gap = layout.gap;
    const gapMatch = gap.match(/(\d+\.?\d*)(rem|px)/);
    if (gapMatch) {
      const value = parseFloat(gapMatch[1]);
      const unit = gapMatch[2];
      if (unit === 'rem' && value > 0.75) {
        gap = '0.75rem';
      } else if (unit === 'px' && value > 12) {
        gap = '12px';
      }
    }
    gridStyle.gap = gap;
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
        className={`resume-layout-grid ${layoutClasses}`.trim()}
        style={gridStyle}
      >
        {children}
      </div>
    </div>
  );
}

