import { EditableText } from './EditableText';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { WorkExperience } from '@/types/resume';

interface EditableExperienceProps {
  experience: WorkExperience;
  onUpdate: (id: string, updates: Partial<WorkExperience>) => void;
  onRemove: (id: string) => void;
}

export function EditableExperience({ experience, onUpdate, onRemove }: EditableExperienceProps) {
  const handleUpdate = (field: keyof WorkExperience, value: string | boolean) => {
    onUpdate(experience.id, { [field]: value });
  };

  return (
    <div className="border-2 border-[#295acf]/30 bg-[#295acf]/10 rounded-lg p-4 mb-4 relative group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="font-semibold text-sm mb-1">
            <EditableText
              value={experience.title}
              placeholder="Job Title"
              onSave={(value) => handleUpdate('title', value)}
              className="text-gray-900"
            />
          </div>
          <div className="text-sm text-gray-600 mb-1">
            <EditableText
              value={experience.company || ''}
              placeholder="Company Name"
              onSave={(value) => handleUpdate('company', value)}
              className="text-gray-600"
            />
          </div>
          <div className="text-xs text-gray-500 mb-2">
            <EditableText
              value={`${experience.startDate} — ${experience.isCurrent ? 'Present' : (experience.endDate || '')}`}
              placeholder="Start Date — End Date"
              onSave={(value) => {
                // Simple parsing - could be enhanced
                const parts = value.split(' — ');
                if (parts.length === 2) {
                  handleUpdate('startDate', parts[0]);
                  if (parts[1] !== 'Present') {
                    handleUpdate('endDate', parts[1]);
                    handleUpdate('isCurrent', false);
                  } else {
                    handleUpdate('isCurrent', true);
                  }
                }
              }}
              className="text-gray-500"
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(experience.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      <div className="text-sm text-gray-700">
        <EditableText
          value={experience.description || ''}
          placeholder="Describe your responsibilities and achievements..."
          onSave={(value) => handleUpdate('description', value)}
          multiline={true}
          className="text-gray-700 leading-relaxed"
        />
      </div>
    </div>
  );
}
