import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '@/components/Layout/AppHeader';
import { Button } from '@/components/ui/button';
import { useResumeBuilder } from '@/components/ResumeBuilder/context/ResumeBuilderContext';
import { PersonalInfoStep } from './steps/PersonalInfoStep';
import { SummaryStep } from './steps/SummaryStep';
import { WorkExperienceStep } from './steps/WorkExperienceStep';
import { EducationStep } from './steps/EducationStep';
import { SkillsStep } from './steps/SkillsStep';

const steps = [
  { id: 'personal', label: 'Personal Info', component: PersonalInfoStep },
  { id: 'summary', label: 'Summary', component: SummaryStep },
  { id: 'work', label: 'Work Experience', component: WorkExperienceStep },
  { id: 'education', label: 'Education', component: EducationStep },
  { id: 'skills', label: 'Skills', component: SkillsStep },
];

export function WizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateFromUrl = searchParams.get('template') || 'modern-professional';
  const { resumeData, replaceResumeData, saveResume, setCurrentResumeId } = useResumeBuilder() as any;
  const [stepIndex, setStepIndex] = useState(0);
  const StepComponent = steps[stepIndex].component as any;

  const next = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setStepIndex((i) => Math.max(i - 1, 0));

  const finish = async () => {
    const savedId = await saveResume('My Resume', 'modern-professional', resumeData);
    setCurrentResumeId(savedId);
    navigate(`/resume-builder/edit?resume=${savedId}&template=${encodeURIComponent(templateFromUrl)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader active="resume" />
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div className={idx <= stepIndex ? 'w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs' : 'w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs'}>
                  {idx + 1}
                </div>
                <span className={idx === stepIndex ? 'ml-2 font-medium text-gray-900' : 'ml-2'}>{s.label}</span>
                {idx < steps.length - 1 && <span className="mx-3 text-gray-300">—</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <StepComponent value={resumeData} onChange={replaceResumeData} />
        </div>
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={prev} disabled={stepIndex === 0}>Back</Button>
          {stepIndex < steps.length - 1 ? (
            <Button onClick={next}>Next</Button>
          ) : (
            <Button onClick={finish}>Save and Preview</Button>
          )}
        </div>
      </div>
    </div>
  );
}


