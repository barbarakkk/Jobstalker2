import type { ResumeData } from '@/types/resume';

interface StepProps {
  value: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function PersonalInfoStep({ value, onChange }: StepProps) {
  const v = value.personalInfo || ({} as any);
  const update = (patch: Partial<typeof v>) => onChange({ ...value, personalInfo: { ...v, ...patch } });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input className="border rounded px-3 py-2" placeholder="First name" value={v.firstName || ''} onChange={(e) => update({ firstName: e.target.value })} />
      <input className="border rounded px-3 py-2" placeholder="Last name" value={v.lastName || ''} onChange={(e) => update({ lastName: e.target.value })} />
      <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Job title" value={v.jobTitle || ''} onChange={(e) => update({ jobTitle: e.target.value })} />
      <input className="border rounded px-3 py-2" placeholder="Email" value={v.email || ''} onChange={(e) => update({ email: e.target.value })} />
      <input className="border rounded px-3 py-2" placeholder="Phone" value={v.phone || ''} onChange={(e) => update({ phone: e.target.value })} />
      <input className="border rounded px-3 py-2" placeholder="Location" value={v.location || ''} onChange={(e) => update({ location: e.target.value })} />
      <input className="border rounded px-3 py-2" placeholder="LinkedIn" value={v.linkedin || ''} onChange={(e) => update({ linkedin: e.target.value })} />
      <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Website" value={v.website || ''} onChange={(e) => update({ website: e.target.value })} />
    </div>
  );
}


