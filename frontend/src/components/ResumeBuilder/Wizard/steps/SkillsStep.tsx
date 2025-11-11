import type { ResumeData } from '@/types/resume';

interface StepProps {
  value: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function SkillsStep({ value, onChange }: StepProps) {
  const skills = value.skills || [];
  const genId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`);
  
  const update = (text: string) => {
    const skillNames = text.split(',').map((s) => s.trim()).filter(Boolean);
    const skillObjects = skillNames.map(name => ({
      id: genId(),
      name: name,
      category: 'Technical'
    }));
    onChange({ ...value, skills: skillObjects });
  };

  return (
    <div>
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Comma-separated skills, e.g., Python, SQL, React"
        value={skills.map(s => s.name).join(', ')}
        onChange={(e) => update(e.target.value)}
      />
      <div className="text-xs text-gray-500 mt-2">Separate skills with commas.</div>
    </div>
  );
}


