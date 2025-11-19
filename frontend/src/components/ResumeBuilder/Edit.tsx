import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useResumeBuilder } from '@/components/ResumeBuilder/context/ResumeBuilderContext';
import { AppHeader } from '@/components/Layout/AppHeader';
import { EditorToolbar } from '@/components/ResumeBuilder/EditorToolbar';
import { TemplateRenderer } from '@/components/ResumeBuilder/Templates/TemplateRenderer';
import { Loader2, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function ResumeEditPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation() as any;
  const { 
    resumeData, 
    replaceResumeData, 
    selectedTemplate,
    setSelectedTemplate,
    currentResumeId,
    setCurrentResumeId,
    loadResume,
    saveResume,
    updateResume,
    isDirty
  } = useResumeBuilder() as any;
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  // Load font settings from localStorage or use defaults
  const loadFontSettings = () => {
    try {
      const saved = localStorage.getItem(`resume-font-settings-${currentResumeId || 'default'}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load font settings:', e);
    }
    return {};
  };
  
  const [fontSettings, setFontSettings] = useState<{
    headerFont?: string;
    bodyFont?: string;
    fontSize?: number;
  }>(loadFontSettings());

  // Save font settings to localStorage when they change
  useEffect(() => {
    if (currentResumeId || Object.keys(fontSettings).length > 0) {
      try {
        localStorage.setItem(
          `resume-font-settings-${currentResumeId || 'default'}`,
          JSON.stringify(fontSettings)
        );
      } catch (e) {
        console.error('Failed to save font settings:', e);
      }
    }
  }, [fontSettings, currentResumeId]);
  
  // Get template ID from URL params or context, default to modern-professional
  const templateIdFromUrl = searchParams.get('template');
  const templateId = templateIdFromUrl || selectedTemplate || 'modern-professional';
  
  // Get resume ID from URL params
  const resumeIdFromUrl = searchParams.get('resume');

  // Set template from URL if provided
  useEffect(() => {
    if (templateIdFromUrl && templateIdFromUrl !== selectedTemplate) {
      console.log('Edit Page - Setting template from URL:', templateIdFromUrl);
      setSelectedTemplate(templateIdFromUrl);
    }
  }, [templateIdFromUrl, selectedTemplate, setSelectedTemplate]);

  // Load resume if ID is in URL and not already loaded
  useEffect(() => {
    if (resumeIdFromUrl && resumeIdFromUrl !== currentResumeId) {
      console.log('Edit Page - Loading resume from URL:', resumeIdFromUrl);
      loadResume(resumeIdFromUrl).catch((error: unknown) => {
        console.error('Error loading resume:', error);
      });
    }
  }, [resumeIdFromUrl, currentResumeId, loadResume]);

  // If navigation provided fresh data, hydrate context once
  useEffect(() => {
    if (state?.injectedResumeData) {
      console.log('Edit Page - Injecting fresh resume data from navigation:', state.injectedResumeData);
      replaceResumeData(state.injectedResumeData);
      // clear state reference so we do not loop
      state.injectedResumeData = undefined;
    }
  }, [state?.injectedResumeData, replaceResumeData]);

  const handleAutoSave = async () => {
    if (!currentResumeId || !resumeData) return;

    try {
      await updateResume(currentResumeId, undefined, resumeData);
      console.log('Edit Page - Auto-saved resume');
    } catch (error) {
      console.error('Error auto-saving resume:', error);
    }
  };

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (isDirty && currentResumeId && resumeData) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 30000); // Auto-save after 30 seconds of inactivity

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, currentResumeId]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      // Get the resume container element - find the actual resume template content
      const container = document.querySelector('.resume-edit-container') as HTMLElement;
      if (!container) {
        alert('Resume content not found');
        return;
      }
      
      // Find the actual resume template element (the one with resume-template class or the inner content)
      const element = container.querySelector('.resume-template') as HTMLElement || 
                      container.querySelector('.bg-white > div') as HTMLElement ||
                      container.querySelector('.bg-white') as HTMLElement;
      
      if (!element) {
        alert('Resume content not found');
        return;
      }

      // Get the actual width of the resume (use the container's max-width or element width)
      const resumeWidth = element.offsetWidth || 800; // Default to 800px if not found
      const resumeHeight = element.scrollHeight || element.offsetHeight || 1000;
      
      // Create an isolated iframe to avoid oklch CSS parsing issues
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = resumeWidth + 'px';
      iframe.style.height = resumeHeight + 'px';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      document.body.appendChild(iframe);

      // Wait for iframe to load
      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        iframe.src = 'about:blank';
      });

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Could not access iframe document');
      }

      // Clone the element with all its children
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Remove any interactive elements that shouldn't be in PDF
      clonedElement.querySelectorAll('button, input, select, textarea, a[href="#"]').forEach(el => {
        el.remove();
      });

      // Helper function to convert any color format to RGB/hex using browser's color conversion
      const convertColorToRgb = (value: string, property: string): string => {
        if (!value || typeof value !== 'string' || value === 'none' || value === 'transparent') {
          return value;
        }
        
        // If it contains oklch or other unsupported formats, use browser conversion
        if (value.includes('oklch') || value.includes('lch') || value.includes('lab')) {
          // Create a temporary element to get the computed RGB value
          const tempEl = document.createElement('div');
          tempEl.style.position = 'absolute';
          tempEl.style.visibility = 'hidden';
          tempEl.style[property as any] = value;
          document.body.appendChild(tempEl);
          
          const computed = window.getComputedStyle(tempEl);
          const rgbValue = computed.getPropertyValue(property);
          document.body.removeChild(tempEl);
          
          // If browser converted it successfully, use that
          if (rgbValue && !rgbValue.includes('oklch') && !rgbValue.includes('lch') && !rgbValue.includes('lab')) {
            return rgbValue;
          }
          
          // Fallback: use safe defaults based on property type
          if (property.includes('background') || property.includes('bg')) {
            return '#ffffff';
          }
          if (property.includes('border')) {
            return '#e5e7eb';
          }
          return '#000000';
        }
        
        return value;
      };

      // Apply ALL computed styles as inline styles (this converts oklch to RGB)
      const applyAllComputedStyles = (el: HTMLElement, sourceEl: HTMLElement) => {
        const computed = window.getComputedStyle(sourceEl);
        const colorProps = [
          'color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor',
          'borderBottomColor', 'borderLeftColor'
        ];
        const otherProps = [
          'borderWidth', 'borderStyle',
          'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'lineHeight',
          'textAlign', 'textDecoration', 'padding', 'paddingTop', 'paddingRight',
          'paddingBottom', 'paddingLeft', 'margin', 'marginTop', 'marginRight',
          'marginBottom', 'marginLeft', 'width', 'height', 'display', 'position',
          'top', 'left', 'right', 'bottom', 'flexDirection', 'justifyContent',
          'alignItems', 'gap', 'boxSizing'
        ];

        // Handle color properties with oklch conversion
        colorProps.forEach(prop => {
          const value = computed.getPropertyValue(prop);
          if (value) {
            const convertedValue = convertColorToRgb(value, prop);
            el.style.setProperty(prop, convertedValue);
          }
        });

        // Handle other properties normally
        otherProps.forEach(prop => {
          const value = computed.getPropertyValue(prop);
          if (value && !value.includes('oklch')) {
            el.style.setProperty(prop, value);
          }
        });

        // Apply all CSS custom properties that might be used (skip oklch ones)
        for (let i = 0; i < computed.length; i++) {
          const prop = computed[i];
          if (prop.startsWith('--')) {
            const value = computed.getPropertyValue(prop);
            if (value && !value.includes('oklch')) {
              el.style.setProperty(prop, value);
            }
          }
        }
      };

      // Get font families from the original element to preserve them
      const originalFontFamily = window.getComputedStyle(element).fontFamily;

      // Apply all important styles directly to cloned element recursively
      const applyAllStyles = (source: HTMLElement, target: HTMLElement) => {
        const computed = window.getComputedStyle(source);
        
        // Copy all non-oklch styles, but preserve white-space for text elements
        Array.from(computed).forEach(prop => {
          const value = computed.getPropertyValue(prop);
          if (value && !value.includes('oklch') && !value.includes('lch') && !value.includes('lab')) {
            // Don't override white-space for text containers - we'll set it explicitly later
            if (prop === 'white-space' && ['P', 'SPAN', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH', 'LABEL'].includes(target.tagName)) {
              return; // Skip, we'll set it to pre-wrap
            }
            target.style.setProperty(prop, value);
          }
        });
        
        // Recursively apply to children
        const sourceChildren = source.children;
        const targetChildren = target.children;
        for (let i = 0; i < sourceChildren.length && i < targetChildren.length; i++) {
          applyAllStyles(sourceChildren[i] as HTMLElement, targetChildren[i] as HTMLElement);
        }
      };

      // Apply all styles to cloned element
      applyAllStyles(element, clonedElement);

      // Fix text nodes to preserve spacing - ensure all text nodes have proper spacing
      const fixTextNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          // Ensure text nodes have spaces preserved
          if (text && text.trim()) {
            node.textContent = text;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          // Ensure white-space is preserved for text containers
          if (['P', 'SPAN', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH', 'LABEL'].includes(el.tagName)) {
            if (!el.style.whiteSpace || el.style.whiteSpace === 'normal') {
              el.style.whiteSpace = 'pre-wrap';
            }
            if (!el.style.lineHeight || el.style.lineHeight === 'normal') {
              el.style.lineHeight = '1.5';
            }
          }
          // Recursively fix child nodes
          Array.from(node.childNodes).forEach(fixTextNodes);
        }
      };
      
      // Fix all text nodes in cloned element
      fixTextNodes(clonedElement);

      // Clean HTML string to remove any remaining oklch references
      let cleanHtml = clonedElement.outerHTML;
      // Remove oklch from style attributes using regex
      cleanHtml = cleanHtml.replace(/oklch\([^)]+\)/gi, (match) => {
        // Replace with a safe fallback - try to determine if it's a light or dark color
        if (match.includes('1 0 0') || match.includes('0.98') || match.includes('0.97')) {
          return '#ffffff'; // Very light colors -> white
        }
        if (match.includes('0.145') || match.includes('0.1') || match.includes('0.2')) {
          return '#1f2937'; // Dark colors -> dark gray
        }
        return '#000000'; // Default fallback
      });

      // Create clean HTML document in iframe
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * {
                box-sizing: border-box;
              }
              body {
                margin: 0;
                padding: 0;
                background: white;
                font-family: ${originalFontFamily || 'Arial, sans-serif'};
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
              }
              /* Preserve all layout styles */
              .resume-template {
                width: 100%;
                max-width: 100%;
              }
              /* CRITICAL: Preserve text spacing and prevent overlapping */
              p, span, div, h1, h2, h3, h4, h5, h6, li, td, th, label {
                white-space: pre-wrap !important;
                word-wrap: break-word !important;
                word-spacing: normal !important;
                letter-spacing: normal !important;
                line-height: 1.5 !important;
                overflow-wrap: break-word !important;
              }
              /* Ensure text doesn't collapse */
              * {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-rendering: optimizeLegibility;
              }
              /* Preserve flexbox and grid layouts */
              [style*="display: flex"], [style*="display: grid"] {
                display: inherit !important;
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; width: ${resumeWidth}px;">
            <div style="width: ${resumeWidth}px; margin: 0 auto;">
              ${clonedElement.outerHTML}
            </div>
          </body>
        </html>
      `);
      iframeDoc.close();

      // Wait for iframe content to render and fonts to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force font loading by accessing computed styles
      if (iframeDoc.fonts && iframeDoc.fonts.ready) {
        await iframeDoc.fonts.ready;
      }

      // Get the body element from iframe (which has no oklch CSS)
      const iframeBody = iframeDoc.body.firstElementChild as HTMLElement;
      if (!iframeBody) {
        throw new Error('Could not find content in iframe');
      }

      // Wait a bit longer for fonts and images to fully load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the actual content element from iframe
      const iframeContent = iframeDoc.body.firstElementChild?.firstElementChild as HTMLElement || iframeBody;
      
      // Now use html2canvas on the iframe content (which has no oklch CSS)
      // Use higher scale and better options for text quality
      const canvas = await html2canvas(iframeContent, {
        scale: 2, // Use 2 for balance between quality and file size
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: resumeWidth,
        height: resumeHeight,
        windowWidth: resumeWidth,
        windowHeight: resumeHeight,
        allowTaint: false,
        removeContainer: false, // Keep container for proper layout
        onclone: (clonedDoc) => {
          // Ensure all fonts are loaded in the cloned document
          const clonedBody = clonedDoc.body;
          if (clonedBody) {
            // Force font loading by accessing computed styles
            const allElements = clonedBody.querySelectorAll('*');
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              try {
                const computed = window.getComputedStyle(htmlEl);
                // Force text spacing preservation
                if (computed.whiteSpace === 'normal') {
                  htmlEl.style.whiteSpace = 'pre-wrap';
                }
                // Ensure proper line height
                if (!computed.lineHeight || computed.lineHeight === 'normal') {
                  htmlEl.style.lineHeight = '1.5';
                }
                window.getComputedStyle(htmlEl).fontFamily;
              } catch (e) {
                // Ignore errors
              }
            });
          }
        }
      });

      // Convert canvas to PDF using PNG for better quality (no compression artifacts)
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        unit: 'in',
        format: 'letter',
        orientation: 'portrait'
      });

      const imgWidth = 8.5; // Letter width in inches
      const pageHeight = 11; // Letter height in inches
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0.5; // Top margin

      pdf.addImage(imgData, 'PNG', 0.5, position, imgWidth - 1, imgHeight);
      heightLeft -= pageHeight - 1;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 0.5;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0.5, position, imgWidth - 1, imgHeight);
        heightLeft -= pageHeight - 1;
      }

      // Generate a better filename based on the person's name
      const personName = resumeData?.personalInfo 
        ? `${resumeData.personalInfo.firstName || ''}${resumeData.personalInfo.lastName ? '_' + resumeData.personalInfo.lastName : ''}`.trim().replace(/\s+/g, '_') || 'Resume'
        : 'Resume';
      const filename = `${personName}_${templateId || 'resume'}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');
      pdf.save(filename);

      // Clean up
      document.body.removeChild(iframe);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader active="resume" />
      <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div></div>
        <Button 
          onClick={handleDownloadPDF}
          disabled={isDownloading || !resumeData}
          className="flex items-center gap-2"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Resume
            </>
          )}
        </Button>
      </div>
      <div className="space-y-4">
        <EditorToolbar 
          onReset={() => {
            setSelectedColor(null);
            setFontSettings({});
            window.location.reload();
          }}
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          fontSettings={fontSettings}
          onFontSettingsChange={setFontSettings}
        />
        {/* Live Preview - Responsive */}
        <div className="bg-gray-50 p-4 rounded-lg border overflow-auto">
          <div className="mx-auto max-w-4xl resume-edit-container">
            <div className="bg-white rounded-md border border-gray-200 shadow-sm">
              <div 
                className="p-6" 
                key={`resume-${resumeData?.personalInfo?.email || 'default'}-${resumeData?.summary?.length || 0}-${templateId}-${selectedColor}-${fontSettings.bodyFont}-${fontSettings.headerFont}-${fontSettings.fontSize}`}
                style={{
                  fontFamily: fontSettings.bodyFont || undefined,
                  fontSize: fontSettings.fontSize ? `${fontSettings.fontSize}px` : undefined,
                }}
              >
                {resumeData && (
                  <TemplateRenderer 
                    templateId={templateId}
                    data={resumeData}
                    overridePrimaryColor={selectedColor || undefined}
                    overrideFontFamily={fontSettings.bodyFont}
                    overrideHeaderFont={fontSettings.headerFont}
                    overrideFontSize={fontSettings.fontSize}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}


