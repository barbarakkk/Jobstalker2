import type { ResumeData } from '@/types/resume';

interface StepProps {
  value: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function EducationStep({ value, onChange }: StepProps) {
  const items = value.education || [];
  const genId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`);

  const add = () => {
    const next = [
      ...items,
      { id: genId(), school: '', degree: '', location: '', startDate: '', endDate: '', details: '' },
    ];
    onChange({ ...value, education: next });
  };

  const updateAt = (idx: number, patch: any) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange({ ...value, education: next });
  };

  const removeAt = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    onChange({ ...value, education: next });
  };

  return (
    <div className="space-y-4">
      {items.map((e, idx) => (
        <div key={e.id} className="border rounded p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="School" value={e.school || ''} onChange={(ev) => updateAt(idx, { school: (ev.target as any).value })} />
            <input className="border rounded px-3 py-2" placeholder="Degree" value={e.degree || ''} onChange={(ev) => updateAt(idx, { degree: (ev.target as any).value })} />
            <input className="border rounded px-3 py-2" placeholder="Location" value={e.location || ''} onChange={(ev) => updateAt(idx, { location: (ev.target as any).value })} />
            <div className="flex gap-2">
              <input className="border rounded px-3 py-2 w-full" placeholder="Start (YYYY)" value={e.startDate || ''} onChange={(ev) => updateAt(idx, { startDate: (ev.target as any).value })} />
              <input className="border rounded px-3 py-2 w-full" placeholder="End (YYYY)" value={e.endDate || ''} onChange={(ev) => updateAt(idx, { endDate: (ev.target as any).value })} />
            </div>
          </div>
          <textarea className="w-full border rounded px-3 py-2 mt-3" placeholder="Details (optional)" value={e.details || ''} onChange={(ev) => updateAt(idx, { details: (ev.target as any).value })} />
          <div className="text-right mt-2">
            <button className="text-red-600 text-sm" onClick={() => removeAt(idx)}>Remove</button>
          </div>
        </div>
      ))}
      <button className="text-blue-600 text-sm" onClick={add}>+ Add education</button>
    </div>
  );
}


