import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useResumeBuilder } from '@/components/ResumeBuilder/context/ResumeBuilderContext';
import { AppHeader } from '@/components/Layout/AppHeader';
import { renderTemplate } from '@/components/ResumeBuilder/Templates/templateRegistry';
import { useState, useEffect } from 'react';

type TemplateInfo = {
  id: string;
  name: string;
  img: string;
  badge?: string;
  colors?: string[];
  category?: string;
};

// Load templates from manifest
const loadTemplatesFromManifest = async (): Promise<TemplateInfo[]> => {
  try {
    const response = await fetch('/templates/jsonresume/manifest.json');
    const manifest = await response.json();
    
    return manifest.map((template: any) => ({
      id: template.id,
      name: template.label,
      img: template.preview,
      category: template.category,
      badge: template.category === 'Modern & Clean' ? 'Modern' : 
             template.category === 'Professional & Corporate' ? 'Professional' : 
             template.category === 'Creative & Unique' ? 'Creative' : undefined,
      colors: getTemplateColors(template.id)
    }));
  } catch (error) {
    console.error('Failed to load template manifest:', error);
    // Fallback to hardcoded templates
    return [
      { id: 'jsonresume-theme-modern', name: 'Modern', img: '/templates/jsonresume/modern.png', badge: 'Modern', colors: ['#1f2937', '#2563eb', '#059669', '#f59e0b'] },
      { id: 'jsonresume-theme-flat', name: 'Flat', img: '/templates/jsonresume/flat.png', badge: 'Modern', colors: ['#0f766e', '#14b8a6', '#0891b2', '#64748b'] },
      { id: 'jsonresume-theme-elegant', name: 'Elegant', img: '/templates/jsonresume/elegant.png', badge: 'Modern', colors: ['#7c3aed', '#a855f7', '#c084fc', '#e9d5ff'] },
      { id: 'jsonresume-theme-classy', name: 'Classy', img: '/templates/jsonresume/classy.png', badge: 'Professional', colors: ['#111827', '#6b7280', '#9ca3af', '#d1d5db'] },
      { id: 'jsonresume-theme-kendall', name: 'Kendall', img: '/templates/jsonresume/kendall.png', badge: 'Professional', colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'] },
      { id: 'jsonresume-theme-stackoverflow', name: 'StackOverflow', img: '/templates/jsonresume/stackoverflow.png', badge: 'Professional', colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa'] },
      { id: 'jsonresume-theme-paper', name: 'Paper', img: '/templates/jsonresume/paper.png', badge: 'Creative', colors: ['#059669', '#10b981', '#34d399', '#6ee7b7'] },
      { id: 'jsonresume-theme-short', name: 'Short', img: '/templates/jsonresume/short.png', badge: 'Creative', colors: ['#dc2626', '#ef4444', '#f87171', '#fca5a5'] },
      { id: 'jsonresume-theme-spartan', name: 'Spartan', img: '/templates/jsonresume/spartan.png', badge: 'Creative', colors: ['#374151', '#6b7280', '#9ca3af', '#d1d5db'] },
    ];
  }
};

// Helper function to get colors for each template
const getTemplateColors = (templateId: string): string[] => {
  const colorMap: Record<string, string[]> = {
    'jsonresume-theme-modern': ['#1f2937', '#2563eb', '#059669', '#f59e0b'],
    'jsonresume-theme-flat': ['#0f766e', '#14b8a6', '#0891b2', '#64748b'],
    'jsonresume-theme-elegant': ['#7c3aed', '#a855f7', '#c084fc', '#e9d5ff'],
    'jsonresume-theme-classy': ['#111827', '#6b7280', '#9ca3af', '#d1d5db'],
    'jsonresume-theme-kendall': ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'],
    'jsonresume-theme-stackoverflow': ['#f97316', '#fb923c', '#fdba74', '#fed7aa'],
    'jsonresume-theme-paper': ['#059669', '#10b981', '#34d399', '#6ee7b7'],
    'jsonresume-theme-short': ['#dc2626', '#ef4444', '#f87171', '#fca5a5'],
    'jsonresume-theme-spartan': ['#374151', '#6b7280', '#9ca3af', '#d1d5db'],
  };
  return colorMap[templateId] || ['#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb'];
};

export function ResumeTemplateSelectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selected = searchParams.get('template') || 'jsonresume-theme-modern';
  const { setSelectedTemplate, resumeData } = useResumeBuilder();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const loadedTemplates = await loadTemplatesFromManifest();
        setTemplates(loadedTemplates);
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const demoData = resumeData && (resumeData.personalInfo.firstName || resumeData.workExperience.length || resumeData.skills.length)
    ? resumeData
    : {
        personalInfo: {
          firstName: 'Sarah',
          lastName: 'Chen',
          email: 'sarah.chen@example.com',
          phone: '+1 (555) 123-4567',
          location: 'San Francisco',
          jobTitle: 'Product Manager',
          linkedin: 'linkedin.com/in/sarahchen',
          website: 'sarahchen.dev',
        },
        summary: 'Experienced product leader with a focus on shipping user-centric products and measurable impact.',
        workExperience: [
          { id: 'w1', title: 'Product Manager', company: 'Acme Corp', location: 'SF', startDate: '2019', endDate: '2023', isCurrent: false, description: 'Owned roadmap and execution; shipped 3 major features increasing retention by 12%.' },
          { id: 'w2', title: 'Associate PM', company: 'Globex', location: 'Remote', startDate: '2017', endDate: '2019', isCurrent: false, description: 'Led discovery with cross-functional teams and launched onboarding revamp.' },
        ],
        education: [
          { id: 'e1', school: 'Stanford University', degree: 'B.S.', field: 'Computer Science', startDate: '2013', endDate: '2017' },
        ],
        skills: [
          { id: 's1', name: 'Product Strategy', category: 'Technical' },
          { id: 's2', name: 'SQL', category: 'Technical' },
          { id: 's3', name: 'A/B Testing', category: 'Technical' },
          { id: 's4', name: 'User Research', category: 'Soft Skills' },
        ],
        languages: [{ name: 'English', proficiency: 'Native' }],
      } as any;

  const useTemplate = (templateId: string) => {
    setSelectedTemplate(templateId as any);
    navigate(`/resume-builder/upload?template=${encodeURIComponent(templateId)}`);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Select a Resume Template</h1>
          <p className="text-gray-600 mt-1">Choose from {templates.length} professional templates</p>
        </div>
        <Link to="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">Back to Dashboard</Link>
      </div>
      
      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">Categories:</span>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Modern & Clean</span>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Professional & Corporate</span>
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Creative & Unique</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className={`group rounded-2xl bg-white border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-lg overflow-hidden ${selected===tpl.id? 'ring-2 ring-blue-600' : ''}`}
          >
            <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
              <div className="absolute inset-0 flex items-start justify-start p-3 pointer-events-none">
                <div className="scale-[0.52] origin-top-left shadow-sm">
                  {renderTemplate(tpl.id as any, demoData)}
                </div>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" className="shadow-md" onClick={() => useTemplate(tpl.id)}>Use This Template</Button>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-900">{tpl.name}</div>
                {selected===tpl.id && <span className="text-xs text-blue-600">Selected</span>}
              </div>
              <div className="mt-2 flex items-center gap-2">
                {(tpl.colors || []).map((c, idx) => (
                  <span key={idx} className="inline-block w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: c, borderColor: 'rgba(0,0,0,0.1)' }} />
                ))}
                {tpl.badge && (
                  <span className="ml-auto inline-block text-[10px] uppercase tracking-wider text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{tpl.badge}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}


