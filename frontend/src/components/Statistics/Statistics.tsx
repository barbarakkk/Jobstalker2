import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { jobApi } from '@/lib/api';
import { Job } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import {
  getStatusDistribution,
  getApplicationsOverTime,
  getTopCompanies,
  getMonthlyActivity,
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
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler,
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler
);

export function Statistics() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  // Common header component to avoid duplication
  const renderHeader = () => (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">JS</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">JobStalker</h1>
              <p className="text-sm text-gray-600 font-medium">Job Tracking Made Simple</p>
            </div>
          </div>
          <nav className="flex items-center space-x-8">
            <a 
              href="/dashboard" 
              className="text-muted-foreground hover:text-blue-600 transition-colors font-medium"
              onClick={(e) => {
                e.preventDefault();
                navigate('/dashboard');
              }}
            >
              Jobs
            </a>
            <a href="#" className="text-blue-600 font-semibold relative group">
              Statistics
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
            </a>
            <a 
              href="/resume-builder" 
              className="text-muted-foreground hover:text-blue-600 transition-colors font-medium"
              onClick={(e) => {
                e.preventDefault();
                navigate('/resume-builder');
              }}
            >
              AI Resume Builder
            </a>
            <a href="#" className="text-muted-foreground hover:text-blue-600 transition-colors font-medium">Profile</a>
          </nav>
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderHeader()}
        
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-80 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderHeader()}
        
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-red-600 text-lg font-medium mb-2">Error Loading Statistics</div>
              <div className="text-gray-600">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderHeader()}
        
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Job Application Statistics</h1>
            <div className="text-center py-12">
              <div className="text-gray-600 text-lg mb-2">No job data available</div>
              <div className="text-gray-500">Start adding jobs to see your statistics</div>
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
  const applicationsOverTime = getApplicationsOverTime(jobs);
  const topCompanies = getTopCompanies(jobs, 10);
  const monthlyActivity = getMonthlyActivity(jobs);

  // Chart data
  const statusChartData = {
    labels: statusDistribution.map(item => item.status),
    datasets: [
      {
        data: statusDistribution.map(item => item.count),
        backgroundColor: statusDistribution.map(item => STATUS_COLORS[item.status as keyof typeof STATUS_COLORS]),
        borderWidth: 0,
      },
    ],
  };

  const applicationsChartData = {
    labels: applicationsOverTime.map(item => item.month),
    datasets: [
      {
        label: 'Applications',
        data: applicationsOverTime.map(item => item.count),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const companiesChartData = {
    labels: topCompanies.map(item => item.company),
    datasets: [
      {
        label: 'Applications',
        data: topCompanies.map(item => item.count),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
    ],
  };

  const monthlyChartData = {
    labels: monthlyActivity.map(item => item.month),
    datasets: [
      {
        label: 'Applied',
        data: monthlyActivity.map(item => item.applied),
        backgroundColor: '#10B981',
      },
      {
        label: 'Interviewing',
        data: monthlyActivity.map(item => item.interviewing),
        backgroundColor: '#8B5CF6',
      },
      {
        label: 'Accepted',
        data: monthlyActivity.map(item => item.accepted),
        backgroundColor: '#059669',
      },
      {
        label: 'Rejected',
        data: monthlyActivity.map(item => item.rejected),
        backgroundColor: '#EF4444',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Job Application Statistics</h1>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Jobs"
              value={summaryStats.totalJobs}
              icon={Briefcase}
              description="Total jobs in your tracker"
              trend={trendData}
            />
            <StatCard
              title="Total Applied"
              value={summaryStats.totalApplied}
              icon={Send}
              description="Jobs you've applied to"
            />
            <StatCard
              title="Interview Rate"
              value={`${summaryStats.interviewRate}%`}
              icon={Users}
              description="Percentage of applications that led to interviews"
            />
            <StatCard
              title="Success Rate"
              value={`${summaryStats.successRate}%`}
              icon={Target}
              description="Percentage of applications that led to offers"
            />
            <StatCard
              title="Avg Response Time"
              value={`${summaryStats.averageResponseTime} days`}
              icon={Clock}
              description="Average time to hear back from companies"
            />
            <StatCard
              title="Top Company"
              value={summaryStats.topCompany}
              icon={Building}
              description="Company you've applied to most"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job Status Distribution */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Job Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Doughnut data={statusChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Applications Over Time */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Applications Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line data={applicationsChartData} options={lineChartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Top Companies */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Top Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Bar 
                    data={companiesChartData} 
                    options={{
                      ...barChartOptions,
                      indexAxis: 'y' as const,
                    }} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Monthly Activity */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Monthly Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Bar data={monthlyChartData} options={barChartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 