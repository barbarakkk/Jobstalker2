import type { ResumeData } from '@/types/resume';

// Minimal JSONResume v1 schema subset used for rendering
export interface JSONResume {
  basics: {
    name: string;
    label?: string;
    email?: string;
    phone?: string;
    location?: { city?: string };
    url?: string;
    image?: string;
  };
  summary?: string;
  work: Array<{
    name?: string; // company
    position?: string; // title
    location?: string;
    startDate?: string;
    endDate?: string;
    summary?: string;
  }>;
  education: Array<{
    institution?: string;
    area?: string; // field
    studyType?: string; // degree
    startDate?: string;
    endDate?: string;
    score?: string; // gpa
  }>;
  skills: Array<{
    name: string; // category
    keywords: string[]; // names in category
  }>;
  languages?: Array<{ language: string; fluency?: string }>;
}

export function toJSONResume(data: ResumeData): JSONResume {
  const basics = {
    name: `${data.personalInfo.firstName || ''} ${data.personalInfo.lastName || ''}`.trim(),
    label: data.personalInfo.jobTitle || undefined,
    email: data.personalInfo.email || undefined,
    phone: data.personalInfo.phone || undefined,
    location: data.personalInfo.location ? { city: data.personalInfo.location } : undefined,
    url: data.personalInfo.website || data.personalInfo.linkedin || undefined,
    image: undefined,
  };

  // Group skills by category for JSONResume
  const categoryToKeywords: Record<string, string[]> = {};
  for (const s of data.skills) {
    const key = s.category || 'Other';
    if (!categoryToKeywords[key]) categoryToKeywords[key] = [];
    categoryToKeywords[key].push(s.name);
  }

  const skills = Object.entries(categoryToKeywords).map(([category, keywords]) => ({
    name: category,
    keywords,
  }));

  return {
    basics,
    summary: data.summary || undefined,
    work: data.workExperience.map(w => ({
      name: w.company,
      position: w.title,
      location: w.location,
      startDate: w.startDate,
      endDate: w.isCurrent ? 'Present' : (w.endDate || undefined),
      summary: w.description,
    })),
    education: data.education.map(e => ({
      institution: e.school,
      area: e.field || '',
      studyType: e.degree,
      startDate: e.startDate,
      endDate: e.endDate,
      score: undefined,
    })),
    skills,
    languages: data.languages?.map(l => ({ language: l.name, fluency: l.proficiency })) || [],
  };
}


