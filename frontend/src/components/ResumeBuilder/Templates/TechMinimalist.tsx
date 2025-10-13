import type { ResumeData } from '@/types/resume';

interface Props { data: ResumeData }

export function TechMinimalist({ data }: Props) {
  const name = `${data.personalInfo.firstName || ''} ${data.personalInfo.lastName || ''}`.trim() || 'Your Name';
  return (
    <div className="bg-white text-gray-900 p-8 border rounded-lg shadow-sm w-[900px]">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{name}</h1>
          <div className="text-xs uppercase tracking-widest text-teal-700 mt-1">{data.personalInfo.jobTitle || 'Software Engineer'}</div>
        </div>
        <div className="text-xs text-gray-600">
          {data.personalInfo.email && <div>{data.personalInfo.email}</div>}
          {data.personalInfo.location && <div className="mt-1">{data.personalInfo.location}</div>}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-8 mt-6">
        {/* Left: Skills emphasized */}
        <aside className="col-span-1">
          {data.skills?.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-800 border-b border-teal-200 pb-2">Skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.skills.map((s) => (
                  <span key={s.id} className="px-2 py-0.5 text-xs rounded-md bg-teal-50 text-teal-800 border border-teal-200">{s.name}</span>
                ))}
              </div>
            </section>
          )}

          {data.education?.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-gray-800 border-b border-teal-200 pb-2">Education</h2>
              <div className="mt-3 space-y-3">
                {data.education.map((e) => (
                  <div key={e.id} className="text-sm">
                    <div className="font-semibold">{e.degree}{e.field ? `, ${e.field}` : ''}</div>
                    <div className="text-xs text-gray-600">{e.school}</div>
                    <div className="text-xs text-gray-500">{e.startDate} — {e.endDate}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        {/* Right: Summary & Experience */}
        <main className="col-span-2">
          {data.summary && (
            <section>
              <h2 className="text-sm font-semibold text-gray-800 border-b border-teal-200 pb-2">Summary</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{data.summary}</p>
            </section>
          )}

          {data.workExperience?.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-gray-800 border-b border-teal-200 pb-2">Experience</h2>
              <div className="mt-3 space-y-5">
                {data.workExperience.map((w) => (
                  <div key={w.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{w.title}{w.company ? `, ${w.company}` : ''}</div>
                      <div className="text-xs text-gray-500">{w.startDate} — {w.isCurrent ? 'Present' : (w.endDate || '')}</div>
                    </div>
                    {w.location && <div className="text-xs text-gray-600">{w.location}</div>}
                    {w.description && <p className="mt-2 text-gray-700 leading-relaxed whitespace-pre-line">{w.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}


