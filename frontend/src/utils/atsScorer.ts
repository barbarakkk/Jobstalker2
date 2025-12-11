import type { ResumeData } from '@/types/resume';

export interface ATSIssue {
  type: 'error' | 'warning' | 'info';
  section: string;
  message: string;
  field?: string;
}

export interface ATSScore {
  score: number;
  maxScore: number;
  percentage: number;
  issues: ATSIssue[];
}

export function calculateATSScore(data: ResumeData): ATSScore {
  const issues: ATSIssue[] = [];
  let score = 0;
  const maxScore = 100;

  // Check Contact Information (15 points)
  if (!data.personalInfo?.firstName || !data.personalInfo?.lastName) {
    issues.push({
      type: 'error',
      section: 'Contact Info',
      message: 'Missing first or last name',
      field: 'name'
    });
  } else {
    score += 5;
  }

  if (!data.personalInfo?.email) {
    issues.push({
      type: 'error',
      section: 'Contact Info',
      message: 'Missing email address',
      field: 'email'
    });
  } else {
    score += 5;
  }

  if (!data.personalInfo?.phone) {
    issues.push({
      type: 'warning',
      section: 'Contact Info',
      message: 'Phone number is recommended',
      field: 'phone'
    });
  } else {
    score += 5;
  }

  // Check Professional Summary (10 points)
  // Fixed: Use data.summary instead of data.personalInfo?.professionalSummary
  // Increased minimum from 50 to 100 characters for 2-3 sentences
  if (!data.summary || data.summary.trim().length < 100) {
    issues.push({
      type: 'warning',
      section: 'Professional Summary',
      message: 'Professional summary should be at least 100 characters (2-3 sentences recommended)',
      field: 'summary'
    });
  } else {
    score += 10;
  }

  // Check Work Experience (30 points)
  if (!data.workExperience || data.workExperience.length === 0) {
    issues.push({
      type: 'error',
      section: 'Work Experience',
      message: 'No work experience added',
      field: 'experience'
    });
  } else {
    score += 15;
    data.workExperience.forEach((exp, idx) => {
      // Fixed: Use exp.title instead of exp.position
      if (!exp.company || !exp.title) {
        issues.push({
          type: 'error',
          section: 'Work Experience',
          message: `Experience ${idx + 1}: Missing company or job title`,
          field: `experience-${idx}`
        });
      } else {
        score += 5;
      }
      if (!exp.startDate) {
        issues.push({
          type: 'warning',
          section: 'Work Experience',
          message: `Experience ${idx + 1}: Missing start date`,
          field: `experience-${idx}-date`
        });
      }
    });
    score = Math.min(score, maxScore - 10); // Cap experience points
  }

  // Check Education (15 points)
  if (!data.education || data.education.length === 0) {
    issues.push({
      type: 'warning',
      section: 'Education',
      message: 'No education added',
      field: 'education'
    });
  } else {
    score += 15;
    data.education.forEach((edu, idx) => {
      if (!edu.school) {
        issues.push({
          type: 'error',
          section: 'Education',
          message: `Education ${idx + 1}: Missing school name`,
          field: `education-${idx}`
        });
      }
    });
  }

  // Check Skills (20 points)
  if (!data.skills || data.skills.length === 0) {
    issues.push({
      type: 'error',
      section: 'Skills',
      message: 'No skills added',
      field: 'skills'
    });
  } else {
    if (data.skills.length < 3) {
      issues.push({
        type: 'warning',
        section: 'Skills',
        message: 'Add at least 3-5 skills for better ATS compatibility',
        field: 'skills'
      });
    }
    score += Math.min(20, data.skills.length * 4);
  }

  // Check for keywords and formatting (10 points)
  const hasKeywords = checkKeywords(data);
  if (!hasKeywords) {
    issues.push({
      type: 'info',
      section: 'Content',
      message: 'Consider adding industry-specific keywords',
      field: 'keywords'
    });
  } else {
    score += 10;
  }

  // Ensure score doesn't exceed max
  score = Math.min(score, maxScore);

  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    issues
  };
}

function checkKeywords(data: ResumeData): boolean {
  const commonKeywords = [
    'leadership', 'management', 'team', 'project', 'analysis', 'development',
    'implementation', 'strategy', 'communication', 'problem-solving'
  ];
  
  const textContent = [
    data.summary || '', // Fixed: Use data.summary instead of data.personalInfo?.professionalSummary
    ...(data.workExperience || []).map(e => `${e.title} ${e.description || ''}`).join(' '), // Fixed: Use e.title instead of e.position
    ...(data.skills || []).map(s => s.name || '').join(' ')
  ].join(' ').toLowerCase();

  return commonKeywords.some(keyword => textContent.includes(keyword));
}

