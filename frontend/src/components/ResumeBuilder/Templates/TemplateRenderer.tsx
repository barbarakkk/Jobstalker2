import { useEffect, useState } from 'react';
import type { ResumeData } from '@/types/resume';
import type { TemplateConfig } from './config/templateConfigSchema';
import { loadTemplateConfig } from './templateRegistry';
import { getSectionComponent, sortSections, validateTemplateConfig } from './utils/templateUtils';
import { LayoutRenderer } from './layouts/LayoutRenderer';
import { applyContainerStyles } from './styles/TemplateStyles';

interface TemplateRendererProps {
  templateId: string;
  data: ResumeData;
  className?: string;
  overridePrimaryColor?: string;
  overrideFontFamily?: string;
  overrideHeaderFont?: string;
  overrideFontSize?: number;
}

export function TemplateRenderer({ 
  templateId, 
  data, 
  className, 
  overridePrimaryColor,
  overrideFontFamily,
  overrideHeaderFont,
  overrideFontSize
}: TemplateRendererProps) {
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId) {
        setError('No template ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const config = await loadTemplateConfig(templateId);
        
        if (!config) {
          setError(`Template "${templateId}" not found`);
          setLoading(false);
          return;
        }

        if (!validateTemplateConfig(config)) {
          setError(`Invalid template configuration for "${templateId}"`);
          setLoading(false);
          return;
        }

        setTemplateConfig(config);
        setError(null);
      } catch (err) {
        setError(`Failed to load template: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#295acf] mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (error || !templateConfig) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Error Loading Template</p>
          <p className="text-sm text-gray-600">{error || 'Template not found'}</p>
        </div>
      </div>
    );
  }

  // Sort sections by order and position
  const sortedSections = sortSections(templateConfig.sections.filter(s => s.visible !== false));

  // Group sections by position for layout rendering
  const headerSections = sortedSections.filter(s => s.position === 'top' || s.position === 'after-header');
  const mainSections = sortedSections.filter(s => s.position === 'main');
  const sidebarSections = sortedSections.filter(s => s.position === 'sidebar');
  const bottomSections = sortedSections.filter(s => s.position === 'bottom');

  // Apply container styles
  const containerStyle = applyContainerStyles(
    templateConfig.theme,
    templateConfig.styles?.container,
    undefined
  );

  // Apply font overrides to theme
  const themeWithOverrides = {
    ...templateConfig.theme,
    fontFamily: overrideFontFamily || templateConfig.theme.fontFamily,
    bodyFontSize: overrideFontSize ? `${overrideFontSize}px` : templateConfig.theme.bodyFontSize,
  };

  return (
    <div 
      className={`resume-template ${className || ''}`}
      style={{
        ...containerStyle,
        fontSize: overrideFontSize ? `${overrideFontSize}px` : undefined,
        fontFamily: overrideFontFamily || undefined,
      }}
    >
      <LayoutRenderer layout={templateConfig.layout} theme={themeWithOverrides}>
        {/* Header sections */}
        {headerSections.map((sectionConfig) => {
          const SectionComponent = getSectionComponent(sectionConfig.type);
          if (!SectionComponent) return null;
          
          return (
            <div 
              key={`${sectionConfig.type}-${sectionConfig.position}`} 
              className="col-span-full"
              style={{
                marginBottom: '0.3rem',
                paddingBottom: '0',
              }}
            >
              <SectionComponent 
                data={data} 
                config={sectionConfig}
                style={{ 
                  ...sectionConfig.style, 
                  ...{ 
                    color: templateConfig.theme.textColor,
                    primaryColor: overridePrimaryColor || templateConfig.theme.primaryColor,
                    fontFamily: overrideHeaderFont || templateConfig.theme.fontFamily, // Header uses header font
                    fontSize: overrideFontSize ? `${overrideFontSize}px` : undefined,
                  } 
                }}
              />
            </div>
          );
        })}

        {/* Main content sections */}
        {mainSections.map((sectionConfig) => {
          const SectionComponent = getSectionComponent(sectionConfig.type);
          if (!SectionComponent) return null;
          
          // For two-column: main sections take 2 columns (full width of left), for three-column: main takes 2 columns (left 2/3)
          const colSpan = templateConfig.layout.type === 'two-column' 
            ? 'col-span-1' // In 2-column grid, main takes left column
            : templateConfig.layout.type === 'three-column'
            ? 'col-span-2' // In 3-column grid, main takes first 2 columns
            : 'col-span-full'; // Single column takes full width
          
          return (
            <div 
              key={`${sectionConfig.type}-${sectionConfig.position}`} 
              className={colSpan}
              style={{
                marginBottom: sectionConfig.type === 'summary' ? '0' : '0.3rem',
                marginTop: sectionConfig.type === 'summary' ? '0' : undefined,
                paddingBottom: sectionConfig.type === 'summary' ? '0' : undefined,
                paddingTop: sectionConfig.type === 'summary' ? '0' : undefined,
              }}
            >
              <SectionComponent 
                data={data} 
                config={sectionConfig}
                style={{ 
                  ...sectionConfig.style, 
                  ...{ 
                    color: templateConfig.theme.textColor,
                    primaryColor: overridePrimaryColor || templateConfig.theme.primaryColor,
                    fontFamily: overrideFontFamily || templateConfig.theme.fontFamily, // Main sections use body font
                    fontSize: overrideFontSize ? `${overrideFontSize}px` : undefined,
                  } 
                }}
              />
            </div>
          );
        })}

        {/* Sidebar sections */}
        {sidebarSections.map((sectionConfig) => {
          const SectionComponent = getSectionComponent(sectionConfig.type);
          if (!SectionComponent) return null;
          
          // Sidebar always takes 1 column (rightmost)
          const colSpan = templateConfig.layout.type === 'two-column' 
            ? 'col-span-1' 
            : templateConfig.layout.type === 'three-column'
            ? 'col-span-1'
            : 'col-span-full'; // Single column fallback
          
          return (
            <div key={`${sectionConfig.type}-${sectionConfig.position}`} className={colSpan}>
              <SectionComponent 
                data={data} 
                config={sectionConfig}
                style={{ 
                  ...sectionConfig.style, 
                  ...{ 
                    color: templateConfig.theme.textColor,
                    primaryColor: overridePrimaryColor || templateConfig.theme.primaryColor,
                    fontFamily: overrideFontFamily || templateConfig.theme.fontFamily, // Sidebar uses body font
                    fontSize: overrideFontSize ? `${overrideFontSize}px` : undefined,
                  } 
                }}
              />
            </div>
          );
        })}

        {/* Bottom sections */}
        {bottomSections.map((sectionConfig) => {
          const SectionComponent = getSectionComponent(sectionConfig.type);
          if (!SectionComponent) return null;
          
          return (
            <div key={`${sectionConfig.type}-${sectionConfig.position}`} className="col-span-full">
              <SectionComponent 
                data={data} 
                config={sectionConfig}
                style={sectionConfig.style}
              />
            </div>
          );
        })}
      </LayoutRenderer>
    </div>
  );
}

