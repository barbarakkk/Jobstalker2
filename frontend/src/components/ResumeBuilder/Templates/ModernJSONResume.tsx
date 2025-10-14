import { toJSONResume } from '../../../../lib/jsonresume';
import { useResumeBuilder } from '../context/ResumeBuilderContext';
import type { ResumeData } from '@/types/resume';

interface ModernJSONResumeProps {
  data?: ResumeData;
  theme?: string;
}

export function ModernJSONResume({ data, theme }: ModernJSONResumeProps = {}) {
  // Try to get data from context first, fall back to props
  let resumeData: ResumeData;
  try {
    const context = useResumeBuilder();
    resumeData = context.resumeData;
  } catch {
    // If not in context (like in template selection), use provided data
    resumeData = data || {
      personalInfo: {
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah.chen@example.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco',
        jobTitle: 'Product Manager',
        linkedin: 'linkedin.com/in/sarahchen',
        website: 'sarahchen.dev',
      },
      summary: 'Experienced product leader with a focus on shipping user-centric products and measurable impact.',
      workExperience: [
        { id: 'w1', title: 'Product Manager', company: 'Acme Corp', location: 'SF', startDate: '2019', endDate: '2023', isCurrent: false, description: 'Owned roadmap and execution; shipped 3 major features increasing retention by 12%.' },
        { id: 'w2', title: 'Associate PM', company: 'Globex', location: 'Remote', startDate: '2017', endDate: '2019', isCurrent: false, description: 'Led discovery with cross-functional teams and launched onboarding revamp.' },
      ],
      education: [
        { id: 'e1', school: 'Stanford University', degree: 'B.S.', field: 'Computer Science', startDate: '2013', endDate: '2017' },
      ],
      skills: [
        { id: 's1', name: 'Product Strategy', category: 'Technical' },
        { id: 's2', name: 'SQL', category: 'Technical' },
        { id: 's3', name: 'A/B Testing', category: 'Technical' },
        { id: 's4', name: 'User Research', category: 'Soft Skills' },
      ],
      languages: [{ name: 'English', proficiency: 'Native' }],
    };
  }
  
  const r = toJSONResume(resumeData);

  // Get theme-specific styles
  const getThemeStyles = (themeId?: string) => {
    switch (themeId) {
      case 'jsonresume-theme-flat':
        return {
          container: 'bg-white text-gray-900 p-8 shadow-sm border rounded-lg max-w-[800px] mx-auto',
          header: 'text-center border-b-2 border-teal-500 pb-4',
          name: 'text-2xl font-extrabold tracking-wide text-teal-800',
          section: 'mt-6 border-l-4 border-teal-200 pl-4',
          sectionTitle: 'text-sm font-bold text-teal-700 uppercase tracking-wide'
        };
      case 'jsonresume-theme-elegant':
        return {
          container: 'bg-white text-gray-900 p-8 shadow-sm border rounded-lg max-w-[800px] mx-auto',
          header: 'text-center border-b border-purple-300 pb-4',
          name: 'text-2xl font-extrabold tracking-wide text-purple-800',
          section: 'mt-6',
          sectionTitle: 'text-sm font-bold text-purple-700 uppercase tracking-wide border-b border-purple-200 pb-1'
        };
      case 'jsonresume-theme-classy':
        return {
          container: 'bg-white text-gray-900 p-8 shadow-sm border rounded-lg max-w-[800px] mx-auto',
          header: 'text-center border-b-2 border-gray-800 pb-4',
          name: 'text-2xl font-extrabold tracking-wide text-gray-800',
          section: 'mt-6',
          sectionTitle: 'text-sm font-bold text-gray-800 uppercase tracking-wide'
        };
      case 'jsonresume-theme-kendall':
        return {
          container: 'bg-white text-gray-900 p-8 shadow-sm border rounded-lg max-w-[800px] mx-auto',
          header: 'text-center border-b-2 border-blue-500 pb-4',
          name: 'text-2xl font-extrabold tracking-wide text-blue-800',
          section: 'mt-6',
          sectionTitle: 'text-sm font-bold text-blue-700 uppercase tracking-wide'
        };
      case 'jsonresume-theme-stackoverflow':
        return {
          container: 'bg-white text-gray-900 p-8 shadow-sm border rounded-lg max-w-[800px] mx-auto',
          header: 'text-center border-b-2 border-orange-500 pb-4',
          name: 'text-2xl font-extrabold tracking-wide text-orange-800',
          section: 'mt-6',
          sectionTitle: 'text-sm font-bold text-orange-700 uppercase tracking-wide'
        };
      case 'jsonresume-theme-paper':
        return {
          container: 'bg-white text-gray-900 p-8 shadow-sm border rounded-lg max-w-[800px] mx-auto',
          header: 'text-center border-b-2 border-green-500 pb-4',
          name: 'text-2xl font-extrabold tracking-wide text-green-800',
          section: 'mt-6',
          sectionTitle: 'text-sm font-bold text-green-700 uppercase tracking-wide'
        };
      case 'jsonresume-theme-short':
        return {
          container: 'bg-white text-gray-900 p-6 shadow-sm border rounded-lg max-w-[800px] mx-auto',
          header: 'text-center border-b border-red-300 pb-3',
          name: 'text-xl font-extrabold tracking-wide text-red-800',
          section: 'mt-4',
          sectionTitle: 'text-xs font-bold text-red-700 uppercase tracking-wide'
        };
      case 'jsonresume-theme-spartan':
        return {
          container: 'bg-white text-gray-900 p-6 shadow-sm border rounded-lg max-w-[800px] mx-auto',
          header: 'text-center border-b border-gray-400 pb-3',
          name: 'text-xl font-extrabold tracking-wide text-gray-800',
          section: 'mt-4',
          sectionTitle: 'text-xs font-bold text-gray-700 uppercase tracking-wide'
        };
      default: // jsonresume-theme-modern
        return {
          container: 'bg-white text-gray-900 p-8 shadow-sm border rounded-lg max-w-[800px] mx-auto',
          header: 'text-center border-b-2 border-blue-500 pb-4',
          name: 'text-2xl font-extrabold tracking-wide text-blue-800',
          section: 'mt-6',
          sectionTitle: 'text-sm font-bold text-blue-700 uppercase tracking-wide'
        };
    }
  };

  const styles = getThemeStyles(theme);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.name}>{r.basics.name || 'Your Name'}</h1>
        {r.basics.label && (
          <div className="text-xs uppercase tracking-widest text-gray-600 mt-1">{r.basics.label}</div>
        )}
        <div className="flex items-center justify-center gap-3 text-xs text-gray-600 mt-3">
          {r.basics.email && <span>{r.basics.email}</span>}
          {r.basics.phone && <span>• {r.basics.phone}</span>}
          {r.basics.location?.city && <span>• {r.basics.location.city}</span>}
        </div>
      </div>

      {/* Summary */}
      {r.summary && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Summary</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{r.summary}</p>
        </section>
      )}

      {/* Experience */}
      {r.work?.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Experience</h2>
          <div className="mt-3 space-y-4">
            {r.work.map((w: any, i: number) => (
              <div key={i} className="text-sm">
                <div className="font-semibold">{w.position}{w.name ? `, ${w.name}` : ''}</div>
                <div className="text-xs text-gray-500">{[w.startDate, w.endDate].filter(Boolean).join(' — ')}</div>
                {w.summary && <p className="mt-2 text-gray-700 leading-relaxed">{w.summary}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {r.education?.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Education</h2>
          <div className="mt-3 space-y-3">
            {r.education.map((e: any, i: number) => (
              <div key={i} className="text-sm">
                <div className="font-semibold">{[e.studyType, e.area].filter(Boolean).join(', ')}{e.institution ? `, ${e.institution}` : ''}</div>
                <div className="text-xs text-gray-500">{[e.startDate, e.endDate].filter(Boolean).join(' — ')}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {r.skills?.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Skills</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            {r.skills.map((s: any, i: number) => (
              <div key={i}>
                <div className="text-xs font-semibold text-gray-700">{s.name}</div>
                <div className="h-0.5 bg-gray-300 my-2" />
                <div className="flex flex-wrap gap-2">
                  {s.keywords.map((k: any, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 border text-gray-700">{k}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Languages */}
      {r.languages && r.languages.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Languages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-sm">
            {r.languages.map((l: any, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{l.language}</span>
                  {l.fluency && <span className="text-xs text-gray-500">{l.fluency}</span>}
                </div>
                <div className="h-0.5 bg-gray-300 mt-2" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


