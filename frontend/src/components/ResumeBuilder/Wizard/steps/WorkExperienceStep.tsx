import type { ResumeData } from '@/types/resume';

interface StepProps {
  value: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function WorkExperienceStep({ value, onChange }: StepProps) {
  const items = value.workExperience || [];
  const genId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`);

  const add = () => {
    const next = [
      ...items,
      { id: genId(), title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, bullets: [] },
    ];
    onChange({ ...value, workExperience: next });
  };

  const updateAt = (idx: number, patch: any) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange({ ...value, workExperience: next });
  };

  const removeAt = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    onChange({ ...value, workExperience: next });
  };

  return (
    <div className="space-y-4">
      {items.map((w, idx) => (
        <div key={w.id} className="border rounded p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Title" value={w.title || ''} onChange={(e) => updateAt(idx, { title: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="Company" value={w.company || ''} onChange={(e) => updateAt(idx, { company: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="Location" value={w.location || ''} onChange={(e) => updateAt(idx, { location: e.target.value })} />
            <div className="flex gap-2">
              <input className="border rounded px-3 py-2 w-full" placeholder="Start (YYYY-MM)" value={w.startDate || ''} onChange={(e) => updateAt(idx, { startDate: e.target.value })} />
              <input className="border rounded px-3 py-2 w-full" placeholder="End (YYYY-MM or empty if current)" value={w.endDate || ''} onChange={(e) => updateAt(idx, { endDate: e.target.value })} />
            </div>
          </div>
          <textarea className="w-full border rounded px-3 py-2 mt-3" placeholder="Bullets (one per line)" value={(w.bullets || []).join('\n')} onChange={(e) => updateAt(idx, { bullets: e.target.value.split('\n').filter(Boolean) })} />
          <div className="text-right mt-2">
            <button className="text-red-600 text-sm" onClick={() => removeAt(idx)}>Remove</button>
          </div>
        </div>
      ))}
      <button className="text-blue-600 text-sm" onClick={add}>+ Add work experience</button>
    </div>
  );
}


