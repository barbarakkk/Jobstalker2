import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { renderTemplate } from '@/components/ResumeBuilder/Templates/templateRegistry';
import { useResumeBuilder } from '@/components/ResumeBuilder/context/ResumeBuilderContext';
import { AppHeader } from '@/components/Layout/AppHeader';
import { EditorToolbar } from '@/components/ResumeBuilder/EditorToolbar';

export function ResumeEditPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const template = searchParams.get('template') || 'modern-pro';
  const { resumeData, updatePersonalInfo, addWorkExperience, removeWorkExperience } = useResumeBuilder();

  const demoData = resumeData && (resumeData.personalInfo.firstName || resumeData.workExperience.length || resumeData.skills.length)
    ? resumeData
    : {
        personalInfo: {
          firstName: 'Barbara',
          lastName: 'Kavtaradze',
          email: 'barbara008@gmail.com',
          phone: '+995 555 000 000',
          location: 'Tbilisi, Tbilisi',
          jobTitle: 'Software Engineer',
          linkedin: 'linkedin.com/in/barbarak',
          website: 'barbarak.dev',
        },
        summary: 'A highly motivated and results-driven analyst with a strong software background and strategic mindset. Skilled in front-end and back-end technologies and experienced in product management, UX, and database tools.',
        workExperience: [
          { id: 'w1', title: 'Analyst', company: 'Corvis', location: '', startDate: '2023-01', endDate: '2024-12', isCurrent: false, description: 'Conduct data analysis and generate actionable insights to support business decisions. Collaborate with cross-functional teams to optimize processes and improve performance.' },
          { id: 'w2', title: 'Freelance Career Consultant', company: '', location: '', startDate: '2023', endDate: '2024', isCurrent: false, description: 'Provided career consulting services to job seekers; personalized career plans and interview preparation.' },
        ],
        education: [
          { id: 'e1', school: 'State University', degree: 'B.S.', field: 'Computer Science', startDate: '2017', endDate: '2020' },
        ],
        skills: [
          { id: 's1', name: 'JavaScript', category: 'Technical' },
          { id: 's2', name: 'React', category: 'Technical' },
          { id: 's3', name: 'SQL', category: 'Technical' },
          { id: 's4', name: 'Communication', category: 'Soft Skills' },
        ],
        languages: [{ name: 'English', proficiency: 'Fluent' }, { name: 'Georgian', proficiency: 'Native' }],
      } as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader active="resume" />
      <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Resume</h1>
        <Button onClick={() => navigate('/resume-builder/finalize')}>Finalize</Button>
      </div>
      <div className="space-y-4">
        <EditorToolbar onReset={() => window.location.reload()} />
        {/* Live Preview - Full Width */}
        <div className="bg-gray-100 p-8 rounded-lg border overflow-auto relative">
          {/* Edit Mode Indicator */}
          <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
            Edit Mode: ON
          </div>
          
          <div className="mx-auto w-[1000px] max-w-full">
            <div className="bg-white p-8 rounded-md border border-gray-300 shadow">
              <div className="origin-top-left inline-block">
                {renderTemplate(template as any, demoData, {
                  onUpdatePersonalInfo: updatePersonalInfo,
                  onAddExperience: () => addWorkExperience({
                    id: `w${Date.now()}`,
                    title: '',
                    company: '',
                    location: '',
                    startDate: '',
                    endDate: '',
                    isCurrent: false,
                    description: ''
                  }),
                  onUpdateExperience: (id: string, updates: any) => {
                    // TODO: Implement update experience
                    console.log('Update experience:', id, updates);
                  },
                  onRemoveExperience: removeWorkExperience,
                  onAddEducation: () => {
                    // TODO: Implement add education
                    console.log('Add education');
                  },
                  onAddSkill: () => {
                    // TODO: Implement add skill
                    console.log('Add skill');
                  }
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}


