import type { ResumeData } from '@/types/resume';
import type { SectionConfig, StyleConfig } from '../config/templateConfigSchema';

interface HeaderSectionProps {
  data: ResumeData;
  config?: SectionConfig;
  style?: StyleConfig;
}

export function HeaderSection({ data, config, style }: HeaderSectionProps) {
  const personalInfo = data?.personalInfo || {};
  const name = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() || 'Your Name';
  
  // Apply custom styles from config
  const containerStyle: React.CSSProperties = {
    ...style,
    ...config?.style,
  };

  // Clean Professional variant (photo + labeled contacts)
  const isCleanProfessional = (config?.className || '').includes('ci-header');
  if (isCleanProfessional) {
    const accent = (style as any)?.primaryColor || (config?.style as any)?.primaryColor || '#1ca3b8';
    return (
      <header style={containerStyle} className={`clean-impact-header ${config?.className || ''}`}>
        <div className="flex items-start gap-4">
          {/* Photo placeholder box */}
          <div
            className="flex-shrink-0 w-22 h-22 rounded-lg overflow-hidden bg-gray-200"
            style={{ width: '88px', height: '88px', borderRadius: '10px' }}
          />

          <div className="flex-1">
            <h1
              className="font-extrabold mb-2"
              style={{ color: String(accent), fontSize: '28px', letterSpacing: '.3px' }}
            >
              {name.toUpperCase()}
            </h1>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs" style={{ color: '#5a6b7a' }}>
              {personalInfo.location && (
                <div>
                  <span>Address:</span>{' '}
                  <span style={{ color: '#1c1e21' }}>{personalInfo.location}</span>
                </div>
              )}
              {personalInfo.phone && (
                <div>
                  <span>Phone:</span>{' '}
                  <span style={{ color: '#1c1e21' }}>{personalInfo.phone}</span>
                </div>
              )}
              {personalInfo.email && (
                <div>
                  <span>Email:</span>{' '}
                  <span style={{ color: '#1c1e21' }}>{personalInfo.email}</span>
                </div>
              )}
              {personalInfo.linkedin && (
                <div>
                  <span>LinkedIn:</span>{' '}
                  <a
                    href={personalInfo.linkedin.startsWith('http://') || personalInfo.linkedin.startsWith('https://') 
                      ? personalInfo.linkedin 
                      : `https://${personalInfo.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline cursor-pointer"
                    style={{ color: '#1c1e21' }}
                  >
                    LinkedIn
                  </a>
                </div>
              )}
              {personalInfo.website && (
                <div>
                  <span>Website:</span>{' '}
                  <span style={{ color: '#1c1e21' }}>{personalInfo.website}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Get font overrides from style
  const headerFont = (style as any)?.fontFamily || config?.style?.fontFamily;
  const fontSize = (style as any)?.fontSize || config?.style?.fontSize;

  // Helper function to format LinkedIn URL
  const formatLinkedInUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  // Build contact items array with special handling for LinkedIn
  const contactItems: Array<{ type: 'text' | 'linkedin'; value: string }> = [];
  if (personalInfo.phone) contactItems.push({ type: 'text', value: personalInfo.phone });
  if (personalInfo.location) contactItems.push({ type: 'text', value: personalInfo.location });
  if (personalInfo.email) contactItems.push({ type: 'text', value: personalInfo.email });
  if (personalInfo.linkedin) contactItems.push({ type: 'linkedin', value: personalInfo.linkedin });
  if (personalInfo.website) contactItems.push({ type: 'text', value: personalInfo.website });

  return (
    <header style={{...containerStyle, marginBottom: '0.15rem', paddingBottom: '0'}} className={config?.className}>
      <div 
        className="text-center border-b-2 border-black" 
        style={{ 
          paddingBottom: '0.5rem', 
          marginBottom: '0.15rem',
          textAlign: 'center'
        }}
      >
        <h1 
          className="text-3xl font-bold tracking-tight uppercase"
          style={{ 
            color: style?.color || config?.style?.color || '#000000',
            fontFamily: headerFont,
            fontSize: fontSize,
            letterSpacing: '0.05em'
          }}
        >
          {name}
        </h1>
        {personalInfo.jobTitle && (
          <div className="text-sm text-black mt-1 uppercase tracking-widest">
            {personalInfo.jobTitle}
          </div>
        )}
        {contactItems.length > 0 && (
          <div className="flex items-center justify-center flex-wrap gap-x-2 mt-3 text-xs text-black">
            {contactItems.map((item, index) => (
              <span key={index} className="flex items-center">
                {index > 0 && <span className="mx-2 text-black">|</span>}
                {item.type === 'linkedin' ? (
                  <a
                    href={formatLinkedInUrl(item.value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black hover:underline cursor-pointer"
                  >
                    LinkedIn
                  </a>
                ) : (
                  <span>{item.value}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

