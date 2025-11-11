import type { ResumeData } from '@/types/resume';

interface StepProps {
  value: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function SkillsStep({ value, onChange }: StepProps) {
  const skills = value.skills || [];
  const update = (text: string) => onChange({ ...value, skills: text.split(',').map((s) => s.trim()).filter(Boolean) });

  return (
    <div>
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Comma-separated skills, e.g., Python, SQL, React"
        value={skills.join(', ')}
        onChange={(e) => update(e.target.value)}
      />
      <div className="text-xs text-gray-500 mt-2">Separate skills with commas.</div>
    </div>
  );
}


