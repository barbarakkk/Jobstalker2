import type { LayoutConfig } from '../config/templateConfigSchema';
import { parseLayout } from '../utils/templateUtils';

interface LayoutRendererProps {
  layout: LayoutConfig;
  children: React.ReactNode;
  theme?: any;
}

export function LayoutRenderer({ layout, children, theme }: LayoutRendererProps) {
  const layoutClasses = parseLayout(layout);
  
  // Reduce padding if it's too large (cap at 0.5rem/8px for more compact layout)
  let padding = layout.padding || '0.5rem';
  if (padding) {
    // Convert rem to px and cap at 8px (0.5rem)
    const paddingMatch = padding.match(/(\d+\.?\d*)(rem|px)/);
    if (paddingMatch) {
      const value = parseFloat(paddingMatch[1]);
      const unit = paddingMatch[2];
      if (unit === 'rem' && value > 0.5) {
        padding = '0.5rem'; // Cap at 0.5rem (8px)
      } else if (unit === 'px' && value > 8) {
        padding = '8px'; // Cap at 8px
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
  
  // Handle gap if it's a custom value - reduce if too large for compact layout
  if (layout.gap && (layout.gap.includes('rem') || layout.gap.includes('px'))) {
    let gap = layout.gap;
    const gapMatch = gap.match(/(\d+\.?\d*)(rem|px)/);
    if (gapMatch) {
      const value = parseFloat(gapMatch[1]);
      const unit = gapMatch[2];
      if (unit === 'rem' && value > 0.25) {
        gap = '0.25rem'; // Cap at 0.25rem (4px) for more compact layout
      } else if (unit === 'px' && value > 4) {
        gap = '4px'; // Cap at 4px
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
        className={layoutClasses}
        style={gridStyle}
      >
        {children}
      </div>
    </div>
  );
}

