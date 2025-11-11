import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useResumeBuilder } from '@/components/ResumeBuilder/context/ResumeBuilderContext';
import { AppHeader } from '@/components/Layout/AppHeader';
import { useState, useEffect } from 'react';
import { loadAllTemplates } from '@/components/ResumeBuilder/Templates/templateRegistry';
import { TemplateRenderer } from '@/components/ResumeBuilder/Templates/TemplateRenderer';
import type { TemplateInfo } from '@/components/ResumeBuilder/Templates/config/templateConfigSchema';
import type { ResumeData } from '@/types/resume';


// Demo data for template previews
const getDemoResumeData = (): ResumeData => ({
  personalInfo: {
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    jobTitle: 'Product Manager',
    linkedin: 'linkedin.com/in/sarahchen',
    website: 'sarahchen.dev',
  },
  summary: 'Experienced product leader with a focus on shipping user-centric products and measurable impact. Led cross-functional teams to deliver innovative solutions.',
  workExperience: [
    {
      id: 'w1',
      title: 'Product Manager',
      company: 'Acme Corp',
      location: 'San Francisco, CA',
      startDate: '2019',
      endDate: '2023',
      isCurrent: false,
      description: 'Owned product roadmap and execution; shipped 3 major features increasing user retention by 12%. Led a team of 5 engineers and designers.',
    },
    {
      id: 'w2',
      title: 'Associate PM',
      company: 'Globex',
      location: 'Remote',
      startDate: '2017',
      endDate: '2019',
      isCurrent: false,
      description: 'Led discovery with cross-functional teams and launched onboarding revamp that reduced drop-off by 25%.',
    },
  ],
  education: [
    {
      id: 'e1',
      school: 'Stanford University',
      degree: 'B.S.',
      field: 'Computer Science',
      startDate: '2013',
      endDate: '2017',
    },
  ],
  skills: [
    { id: 's1', name: 'Product Strategy', category: 'Technical' },
    { id: 's2', name: 'SQL', category: 'Technical' },
    { id: 's3', name: 'A/B Testing', category: 'Technical' },
    { id: 's4', name: 'User Research', category: 'Soft Skills' },
    { id: 's5', name: 'Agile', category: 'Methodology' },
  ],
  languages: [
    { name: 'English', proficiency: 'Native' },
    { name: 'Spanish', proficiency: 'Conversational' },
  ],
});

export function ResumeTemplateSelectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSelectedTemplate, resumeData } = useResumeBuilder();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const selected = searchParams.get('template') || '';
  const demoData = getDemoResumeData();

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const loadedTemplates = await loadAllTemplates();
        setTemplates(loadedTemplates);
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const useTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    navigate(`/resume-builder/wizard?template=${encodeURIComponent(templateId)}`);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <AppHeader active="resume" />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading templates...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader active="resume" />
      <div className="container mx-auto p-6">
        {templates.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-2xl">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">No Templates Available</h1>
              <p className="text-gray-600 mb-6">
                No templates found. Please check template configuration files.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`group relative bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  selected === template.id ? 'ring-2 ring-blue-600 shadow-lg' : ''
                }`}
              >
                {/* Template Preview Section */}
                <div className="relative h-[500px] bg-gray-50 overflow-hidden rounded-t-xl border-b border-gray-200">
                  <div className="absolute inset-0 p-3 overflow-auto">
                    <div className="h-full flex items-start justify-center">
                      <div 
                        className="bg-white shadow-lg rounded-md border border-gray-200"
                        style={{ 
                          transform: 'scale(0.35)',
                          transformOrigin: 'top center',
                          marginTop: '0px'
                        }}
                      >
                        <div style={{ width: '800px', minHeight: '1000px' }}>
                          <TemplateRenderer templateId={template.id} data={demoData} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover Overlay with Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button 
                      size="default" 
                      className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white font-medium px-6" 
                      onClick={() => useTemplate(template.id)}
                    >
                      Customise This Template
                    </Button>
                  </div>
                </div>
                
                {/* Template Info Section */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    {template.badge && (
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        {template.badge}
                      </span>
                    )}
                  </div>
                  
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{template.description}</p>
                  )}
                  
                  {/* Color palette removed per UX request */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


