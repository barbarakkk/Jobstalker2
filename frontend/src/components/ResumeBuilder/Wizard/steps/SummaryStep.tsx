import type { ResumeData } from '@/types/resume';

interface StepProps {
  value: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function SummaryStep({ value, onChange }: StepProps) {
  const update = (summary: string) => onChange({ ...value, summary });
  return (
    <div>
      <textarea
        className="w-full border rounded px-3 py-2 min-h-[140px]"
        placeholder="Brief professional summary"
        value={value.summary || ''}
        onChange={(e) => update(e.target.value)}
      />
      <div className="text-xs text-gray-500 mt-2">Tip: 3–4 sentences focused on impact and strengths.</div>
    </div>
  );
}


