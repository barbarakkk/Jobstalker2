import type { ResumeData } from '@/types/resume';
import { EditableText } from '@/components/ResumeBuilder/Editable/EditableText';
import { EditableSection } from '@/components/ResumeBuilder/Editable/EditableSection';
import { EditableExperience } from '@/components/ResumeBuilder/Editable/EditableExperience';

interface Props { 
  data: ResumeData;
  onUpdatePersonalInfo?: (updates: any) => void;
  onAddExperience?: () => void;
  onUpdateExperience?: (id: string, updates: any) => void;
  onRemoveExperience?: (id: string) => void;
  onAddEducation?: () => void;
  onAddSkill?: () => void;
}

export function ModernProfessional({ 
  data, 
  onUpdatePersonalInfo = () => {},
  onAddExperience = () => {},
  onUpdateExperience = () => {},
  onRemoveExperience = () => {},
  onAddEducation = () => {},
  onAddSkill = () => {}
}: Props) {
  const name = `${data.personalInfo.firstName || ''} ${data.personalInfo.lastName || ''}`.trim() || 'Your Name';
  return (
    <div className="bg-white text-gray-900 p-8 border rounded-lg shadow-sm w-[800px]">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">
          <EditableText 
            value={name} 
            placeholder="Your Name" 
            onSave={(value) => {
              const parts = value.split(' ');
              onUpdatePersonalInfo({
                firstName: parts[0] || '',
                lastName: parts.slice(1).join(' ') || ''
              });
            }} 
          />
        </h1>
        <div className="text-xs uppercase tracking-widest text-gray-600 mt-1">
          <EditableText 
            value={data.personalInfo.jobTitle || ''} 
            placeholder="Professional Title" 
            onSave={(value) => onUpdatePersonalInfo({ jobTitle: value })} 
          />
        </div>
        <div className="flex items-center justify-center gap-3 text-xs text-gray-600 mt-3">
          {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span>• {data.personalInfo.phone}</span>}
          {data.personalInfo.location && <span>• {data.personalInfo.location}</span>}
        </div>
      </header>

      {/* Summary */}
      <EditableSection title="Summary">
        <div className="border-2 border-blue-200 bg-blue-50/20 rounded-lg p-4">
          <EditableText 
            value={data.summary || ''} 
            placeholder="Write your professional summary..." 
            onSave={(value) => onUpdatePersonalInfo({ summary: value })}
            multiline={true}
            className="text-sm leading-relaxed text-gray-700"
          />
        </div>
      </EditableSection>

      {/* Experience */}
      <EditableSection 
        title="Work Experience" 
        onAdd={onAddExperience}
        addLabel="Add Experience"
      >
        <div className="space-y-4">
          {data.workExperience?.map((w) => (
            <EditableExperience
              key={w.id}
              experience={w}
              onUpdate={onUpdateExperience}
              onRemove={onRemoveExperience}
            />
          ))}
          {(!data.workExperience || data.workExperience.length === 0) && (
            <div className="border-2 border-dashed border-blue-300 bg-blue-50/20 rounded-lg p-8 text-center text-gray-500">
              <p className="text-sm">No work experience added yet</p>
              <p className="text-xs mt-1">Click "Add Experience" to get started</p>
            </div>
          )}
        </div>
      </EditableSection>

      {/* Education */}
      <EditableSection 
        title="Education" 
        onAdd={onAddEducation}
        addLabel="Add Education"
      >
        <div className="space-y-3">
          {data.education?.map((e) => (
            <div key={e.id} className="border-2 border-blue-200 bg-blue-50/20 rounded-lg p-4">
              <div className="font-semibold text-sm">
                <EditableText
                  value={`${e.degree}${e.field ? `, ${e.field}` : ''}${e.school ? `, ${e.school}` : ''}`}
                  placeholder="Degree, Field, School"
                  onSave={() => {}}
                  className="text-gray-900"
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                <EditableText
                  value={`${e.startDate} — ${e.endDate}`}
                  placeholder="Start Date — End Date"
                  onSave={() => {}}
                  className="text-gray-500"
                />
              </div>
            </div>
          ))}
          {(!data.education || data.education.length === 0) && (
            <div className="border-2 border-dashed border-blue-300 bg-blue-50/20 rounded-lg p-6 text-center text-gray-500">
              <p className="text-sm">No education added yet</p>
              <p className="text-xs mt-1">Click "Add Education" to get started</p>
            </div>
          )}
        </div>
      </EditableSection>

      {/* Skills */}
      <EditableSection 
        title="Skills" 
        onAdd={onAddSkill}
        addLabel="Add Skill"
      >
        <div className="flex flex-wrap gap-2">
          {data.skills?.map((s) => (
            <span key={s.id} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 border text-gray-700">
              <EditableText
                value={s.name}
                placeholder="Skill name"
                onSave={() => {}}
                className="text-gray-700"
              />
            </span>
          ))}
          {(!data.skills || data.skills.length === 0) && (
            <div className="border-2 border-dashed border-blue-300 bg-blue-50/20 rounded-lg p-4 text-center text-gray-500 w-full">
              <p className="text-sm">No skills added yet</p>
              <p className="text-xs mt-1">Click "Add Skill" to get started</p>
            </div>
          )}
        </div>
      </EditableSection>
    </div>
  );
}


