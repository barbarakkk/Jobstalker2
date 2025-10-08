import { Job } from './types';
import { format, subMonths, parseISO } from 'date-fns';

// App theme palette (deep blues, soft grays, subtle accents)
export const THEME = {
  primary: '#1e40af', // deep blue
  primaryBright: '#3b82f6',
  slate: '#64748b',
  bgSoft: '#f8fafc',
  borderSoft: '#e2e8f0',
  emerald: '#10b981',
  violet: '#8b5cf6',
};

// Status colors for charts - muted, sophisticated
export const STATUS_COLORS = {
  Bookmarked: '#1e40af',    // Deep blue
  Applying: '#64748b',      // Slate
  Applied: '#047857',       // Deep emerald
  Interviewing: '#6d28d9',  // Deep violet
  Accepted: '#065f46',      // Dark emerald
  Rejected: '#b91c1c',      // Dark red
};

// Enhanced color palette with gradients
export const ENHANCED_STATUS_COLORS = {
  Bookmarked: {
    primary: '#3B82F6',
    secondary: '#1D4ED8',
    hover: '#2563EB',
    light: '#DBEAFE',
  },
  Applying: {
    primary: '#F59E0B',
    secondary: '#D97706',
    hover: '#F59E0B',
    light: '#FEF3C7',
  },
  Applied: {
    primary: '#10B981',
    secondary: '#047857',
    hover: '#059669',
    light: '#D1FAE5',
  },
  Interviewing: {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    hover: '#7C3AED',
    light: '#EDE9FE',
  },
  Accepted: {
    primary: '#059669',
    secondary: '#065F46',
    hover: '#047857',
    light: '#D1FAE5',
  },
  Rejected: {
    primary: '#EF4444',
    secondary: '#DC2626',
    hover: '#DC2626',
    light: '#FEE2E2',
  },
};

// Calculate status distribution
export function getStatusDistribution(jobs: Job[]) {
  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / jobs.length) * 100),
  }));
}

// Calculate applications over time (last 6 months)
export function getApplicationsOverTime(jobs: Job[]) {
  const months = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const month = subMonths(now, i);
    const monthKey = format(month, 'yyyy-MM');
    const monthLabel = format(month, 'MMM yyyy');
    
    const count = jobs.filter(job => {
      const jobDate = parseISO(job.created_at);
      return format(jobDate, 'yyyy-MM') === monthKey;
    }).length;
    
    months.push({
      month: monthLabel,
      count,
    });
  }
  
  return months;
}

// Calculate top companies
export function getTopCompanies(jobs: Job[], limit: number = 10) {
  const companyCounts = jobs.reduce((acc, job) => {
    acc[job.company] = (acc[job.company] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(companyCounts)
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Calculate monthly activity (last 12 months)
export function getMonthlyActivity(jobs: Job[]) {
  const months = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const month = subMonths(now, i);
    const monthKey = format(month, 'yyyy-MM');
    const monthLabel = format(month, 'MMM');
    
    const monthJobs = jobs.filter(job => {
      const jobDate = parseISO(job.created_at);
      return format(jobDate, 'yyyy-MM') === monthKey;
    });
    
    const applied = monthJobs.filter(job => job.status === 'Applied').length;
    const interviewing = monthJobs.filter(job => job.status === 'Interviewing').length;
    const accepted = monthJobs.filter(job => job.status === 'Accepted').length;
    // Note: 'Rejected' status is not in the current Job type, so we'll set it to 0
    const rejected = 0;
    
    months.push({
      month: monthLabel,
      applied,
      interviewing,
      accepted,
      rejected,
      total: monthJobs.length,
    });
  }
  
  return months;
}

// Calculate summary statistics
export function getSummaryStats(jobs: Job[]) {
  const totalJobs = jobs.length;
  const totalApplied = jobs.filter(job => job.status === 'Applied').length;
  const totalInterviewing = jobs.filter(job => job.status === 'Interviewing').length;
  const totalAccepted = jobs.filter(job => job.status === 'Accepted').length;
  // Note: 'Rejected' status is not in the current Job type, so we'll set it to 0
  // const totalRejected = 0;
  
  // Calculate rates
  const interviewRate = totalApplied > 0 ? Math.round((totalInterviewing / totalApplied) * 100) : 0;
  const successRate = totalApplied > 0 ? Math.round((totalAccepted / totalApplied) * 100) : 0;
  
  // Calculate average response time (days from applied to first status change)
  const responseTimes = jobs
    .filter(job => job.status !== 'Bookmarked' && job.status !== 'Applying' && job.date_applied)
    .map(job => {
      const appliedDate = parseISO(job.date_applied);
      const updatedDate = parseISO(job.updated_at);
      return Math.ceil((updatedDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
    })
    .filter(days => days >= 0);
  
  const averageResponseTime = responseTimes.length > 0 
    ? Math.round(responseTimes.reduce((sum, days) => sum + days, 0) / responseTimes.length)
    : 0;
  
  // Get top company
  const topCompany = getTopCompanies(jobs, 1)[0]?.company || 'None';
  
  return {
    totalJobs,
    totalApplied,
    interviewRate,
    successRate,
    averageResponseTime,
    topCompany,
  };
}

// Calculate trend data (comparing current month to previous month)
export function getTrendData(jobs: Job[]) {
  const now = new Date();
  const currentMonth = format(now, 'yyyy-MM');
  const previousMonth = format(subMonths(now, 1), 'yyyy-MM');
  
  const currentMonthJobs = jobs.filter(job => 
    format(parseISO(job.created_at), 'yyyy-MM') === currentMonth
  ).length;
  
  const previousMonthJobs = jobs.filter(job => 
    format(parseISO(job.created_at), 'yyyy-MM') === previousMonth
  ).length;
  
  if (previousMonthJobs === 0) {
    return { value: 0, isPositive: true };
  }
  
  const change = ((currentMonthJobs - previousMonthJobs) / previousMonthJobs) * 100;
  return {
    value: Math.round(change),
    isPositive: change >= 0,
  };
} 