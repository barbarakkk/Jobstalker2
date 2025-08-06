import { Job } from './types';
import { format, subMonths, parseISO } from 'date-fns';

// Status colors for charts
export const STATUS_COLORS = {
  Bookmarked: '#3B82F6',
  Applying: '#F59E0B',
  Applied: '#10B981',
  Interviewing: '#8B5CF6',
  Accepted: '#059669',
  Rejected: '#EF4444',
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
  const totalRejected = 0;
  
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