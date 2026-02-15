import type { ResumeData } from '@/types/resume';
import type { SectionConfig, StyleConfig } from '../config/templateConfigSchema';

interface CleanImpactHeaderSectionProps {
  data: ResumeData;
  config?: SectionConfig;
  style?: StyleConfig;
}

export function CleanImpactHeaderSection({ data, config, style }: CleanImpactHeaderSectionProps) {
  const personalInfo = data.personalInfo;
  const name = `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim().toUpperCase() || 'YOUR NAME';
  const locationValue = personalInfo.location?.trim();
  const showLocation = locationValue && !/^your\s+location$/i.test(locationValue) && locationValue.toLowerCase() !== 'location';
  
  const containerStyle: React.CSSProperties = {
    ...style,
    ...config?.style,
  };

  const accentColor: string = String(style?.primaryColor || config?.style?.primaryColor || '#1ca3b8');

  return (
    <header style={containerStyle} className={`clean-impact-header ${config?.className || ''}`}>
      <div className="flex items-start gap-4">
        {/* Profile Photo Placeholder */}
        <div 
          className="flex-shrink-0 w-22 h-22 rounded-lg overflow-hidden bg-gray-200"
          style={{ width: '88px', height: '88px', borderRadius: '10px' }}
        >
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            Photo
          </div>
        </div>
        
        {/* Name and Contact Info */}
        <div className="flex-1">
          <h1 
            className="text-3xl font-bold mb-1 tracking-tight"
            style={{ 
              color: accentColor,
              fontSize: '28px',
              letterSpacing: '0.3px'
            }}
          >
            {name}
          </h1>
          {personalInfo.jobTitle && (
            <div className="text-base font-semibold mb-2" style={{ color: '#374151', fontSize: '16px' }}>
              {personalInfo.jobTitle}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs header-contact-grid" style={{ color: '#5a6b7a' }}>
            {showLocation && (
              <div className="min-w-0" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                <span style={{ color: '#1c1e21' }}>{locationValue}</span>
              </div>
            )}
            {personalInfo.phone && (
              <div className="min-w-0" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                <span className="font-normal" style={{ color: '#5a6b7a' }}>Phone:</span>{' '}
                <span style={{ color: '#1c1e21' }}>{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo.email && (
              <div className="min-w-0" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                <span className="font-normal" style={{ color: '#5a6b7a' }}>Email:</span>{' '}
                <span style={{ color: '#1c1e21' }}>{personalInfo.email}</span>
              </div>
            )}
            {personalInfo.linkedin && (
              <div className="min-w-0" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                <span className="font-normal" style={{ color: '#5a6b7a' }}>LinkedIn:</span>{' '}
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
              <div className="min-w-0" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                <span className="font-normal" style={{ color: '#5a6b7a' }}>Website:</span>{' '}
                <span style={{ color: '#1c1e21' }}>{personalInfo.website}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

