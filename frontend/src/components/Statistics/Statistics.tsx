import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { jobApi } from '@/lib/api';
import { Job } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/Layout/AppHeader';

// Import new components
import { KPICards } from './KPICards';
import { JobStatusPieChart } from './JobStatusPieChart';
import { AIInsights } from './AIInsights';

import {
  getStatusDistribution,
  getSummaryStats,
  getTrendData,
  STATUS_COLORS,
} from '@/lib/statistics';
import {
  Briefcase,
  Send,
  Users,
  Target,
  Clock,
  Building,
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export function Statistics() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const jobsData = await jobApi.getJobs();
        setJobs(jobsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <AppHeader active="statistics" />
        
        <div className="flex justify-center items-center h-96">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto"></div>
            <div>
              <p className="text-gray-600 font-semibold">Loading your statistics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <AppHeader active="statistics" />
        
        <div className="flex justify-center items-center h-96">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto border border-red-200">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to load statistics</h3>
              <p className="text-gray-600 text-base mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg px-6 py-3">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <AppHeader active="statistics" />
        
        <div className="w-full px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Application Statistics</h1>
              <p className="text-gray-600">Track your job search progress and insights</p>
            </div>
            
            <div className="flex justify-center items-center h-96">
              <div className="text-center space-y-4 max-w-md">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No statistics yet</h3>
                  <p className="text-gray-600 text-base mb-4">Start adding jobs to see your application statistics and insights</p>
                  <Button 
                    onClick={() => navigate('/dashboard')} 
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg px-6 py-3"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const summaryStats = getSummaryStats(jobs);
  const trendData = getTrendData(jobs);
  const statusDistribution = getStatusDistribution(jobs);

  // Chart data
  const statusChartData = {
    labels: statusDistribution.map(item => item.status),
    datasets: [
      {
        data: statusDistribution.map(item => item.count),
        backgroundColor: [
          '#d1d5db', // Bookmarked - more prominent gray
          '#fde047', // Applying - more prominent yellow
          '#93c5fd', // Applied - more prominent blue
          '#c4b5fd', // Interviewing - more prominent purple
          '#86efac', // Accepted - more prominent green
          '#fca5a5', // Rejected - more prominent red
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverBackgroundColor: [
          '#6b7280', // Bookmarked - darker gray
          '#eab308', // Applying - darker yellow
          '#3b82f6', // Applied - darker blue
          '#8b5cf6', // Interviewing - darker purple
          '#22c55e', // Accepted - darker green
          '#ef4444', // Rejected - darker red
        ],
        hoverBorderColor: '#FFFFFF',
        hoverBorderWidth: 2,
      },
    ],
  };


  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#374151',
        bodyColor: '#6b7280',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: { size: 13, weight: '600' as const },
        bodyFont: { size: 12 },
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverBorderWidth: 3,
        hoverBorderColor: '#ffffff',
      },
    },
    cutout: '0%',
    radius: '80%',
    hover: {
      scale: 1.02,
    },
  } as const;


  // Group jobs by status
  const jobsByStatus = {
    Bookmarked: jobs.filter(job => job.status === 'Bookmarked'),
    Applying: jobs.filter(job => job.status === 'Applying'),
    Applied: jobs.filter(job => job.status === 'Applied'),
    Interviewing: jobs.filter(job => job.status === 'Interviewing'),
    Accepted: jobs.filter(job => job.status === 'Accepted'),
  };

  const statusConfig = {
    Bookmarked: { 
      bgColor: 'bg-white', 
      textColor: 'text-gray-900', 
      borderColor: 'border-gray-300',
      cardBg: 'bg-white',
      buttonBg: 'bg-gray-100',
      buttonText: 'text-gray-700'
    },
    Applying: { 
      bgColor: 'bg-yellow-50', 
      textColor: 'text-yellow-800', 
      borderColor: 'border-yellow-300',
      cardBg: 'bg-yellow-50',
      buttonBg: 'bg-yellow-100',
      buttonText: 'text-yellow-700'
    },
    Applied: { 
      bgColor: 'bg-blue-50', 
      textColor: 'text-blue-800', 
      borderColor: 'border-blue-300',
      cardBg: 'bg-blue-50',
      buttonBg: 'bg-blue-100',
      buttonText: 'text-blue-700'
    },
    Interviewing: { 
      bgColor: 'bg-pink-50', 
      textColor: 'text-pink-800', 
      borderColor: 'border-pink-300',
      cardBg: 'bg-pink-50',
      buttonBg: 'bg-pink-100',
      buttonText: 'text-pink-700'
    },
    Accepted: { 
      bgColor: 'bg-green-50', 
      textColor: 'text-green-800', 
      borderColor: 'border-green-300',
      cardBg: 'bg-green-50',
      buttonBg: 'bg-green-100',
      buttonText: 'text-green-700'
    },
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <AppHeader active="statistics" />
      
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10">
        <div className="max-w-7xl mx-auto">
          {/* 1. Key Performance Indicators (KPIs) - The Big Picture */}
          <div className="mb-8 sm:mb-10">
            <KPICards jobs={jobs} />
          </div>

          {/* 2. Job Status Distribution */}
          <div className="mb-8 sm:mb-10">
            <JobStatusPieChart jobs={jobs} />
          </div>

          {/* 3. AI-Powered Insights & Recommendations */}
          <div className="mb-8 sm:mb-10">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">AI-Powered Insights & Recommendations</h2>
              <p className="text-sm sm:text-base text-gray-600">Personalized advice to optimize your job search strategy</p>
            </div>
            <AIInsights jobs={jobs} />
          </div>
        </div>
      </div>
    </div>
  );
} 