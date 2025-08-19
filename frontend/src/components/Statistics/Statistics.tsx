import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { jobApi } from '@/lib/api';
import { Job } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/lib/theme';
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
  const { isDarkMode } = useTheme();

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
    <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
      <div className="w-full px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src="/src/assets/ColoredLogoHorizontal.svg" alt="JobStalker" className="h-8" />
            <div>
            </div>
          </div>
          <nav className="flex items-center space-x-8">
            <a 
              href="/dashboard" 
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
              onClick={(e) => {
                e.preventDefault();
                navigate('/dashboard');
              }}
            >
              Jobs
            </a>
            <a href="#" className="text-primary font-semibold relative group">
              Statistics
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </a>
            <a 
              href="/resume-builder" 
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
              onClick={(e) => {
                e.preventDefault();
                navigate('/resume-builder');
              }}
            >
              AI Resume Builder
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Profile</a>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-80 bg-muted rounded"></div>
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
      <div className="min-h-screen bg-background">
        {renderHeader()}
        
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-destructive text-lg font-medium mb-2">Error Loading Statistics</div>
              <div className="text-muted-foreground">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {renderHeader()}
        
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-6">Job Application Statistics</h1>
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-2">No job data available</div>
              <div className="text-muted-foreground/60">Start adding jobs to see your statistics</div>
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
        backgroundColor: [
          '#3B82F6', // Blue for Bookmarked
          '#F59E0B', // Amber for Applying
          '#8B5CF6', // Purple for Applied
          '#F97316', // Orange for Interviewing
          '#10B981', // Emerald for Accepted
        ],
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
        borderWidth: 3,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: isDarkMode ? '#1f2937' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const companiesChartData = {
    labels: topCompanies.map(item => item.company),
    datasets: [
      {
        label: 'Applications',
        data: topCompanies.map(item => item.count),
        backgroundColor: [
          '#3B82F6', // Blue
          '#8B5CF6', // Purple
          '#F59E0B', // Amber
          '#10B981', // Emerald
          '#F97316', // Orange
          '#EF4444', // Red
          '#06B6D4', // Cyan
          '#84CC16', // Lime
          '#F472B6', // Pink
          '#A855F7', // Violet
        ],
        borderColor: [
          '#2563EB', // Darker Blue
          '#7C3AED', // Darker Purple
          '#D97706', // Darker Amber
          '#059669', // Darker Emerald
          '#EA580C', // Darker Orange
          '#DC2626', // Darker Red
          '#0891B2', // Darker Cyan
          '#65A30D', // Darker Lime
          '#E11D48', // Darker Pink
          '#9333EA', // Darker Violet
        ],
        borderWidth: 2,
        borderRadius: 4,
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
        borderColor: '#059669',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Interviewing',
        data: monthlyActivity.map(item => item.interviewing),
        backgroundColor: '#F97316',
        borderColor: '#EA580C',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Accepted',
        data: monthlyActivity.map(item => item.accepted),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Rejected',
        data: monthlyActivity.map(item => item.rejected),
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  // Theme-aware chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: isDarkMode ? '#ffffff' : '#000000',
          font: {
            size: 12,
            weight: 'normal' as const,
          },
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#374151' : '#ffffff',
        titleColor: isDarkMode ? '#ffffff' : '#000000',
        bodyColor: isDarkMode ? '#ffffff' : '#000000',
        borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
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
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000',
          font: {
            size: 12,
          },
        },
        border: {
          color: isDarkMode ? '#4b5563' : '#e5e7eb',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? '#4b5563' : '#e5e7eb',
          drawBorder: false,
        },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000',
          font: {
            size: 12,
          },
        },
        border: {
          color: isDarkMode ? '#4b5563' : '#e5e7eb',
        },
      },
    },
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        labels: {
          ...chartOptions.plugins.legend.labels,
          generateLabels: (chart: any) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset: any, i: number) => ({
              text: dataset.label,
              fillStyle: dataset.backgroundColor,
              strokeStyle: dataset.borderColor,
              lineWidth: 2,
              pointStyle: 'circle',
              hidden: !chart.isDatasetVisible(i),
              index: i,
            }));
          },
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
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000',
          font: {
            size: 12,
          },
        },
        border: {
          color: isDarkMode ? '#4b5563' : '#e5e7eb',
        },
      },
      y: {
        grid: {
          color: isDarkMode ? '#4b5563' : '#e5e7eb',
          drawBorder: false,
        },
        ticks: {
          color: isDarkMode ? '#ffffff' : '#000000',
          font: {
            size: 12,
          },
        },
        border: {
          color: isDarkMode ? '#4b5563' : '#e5e7eb',
        },
      },
    },
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        labels: {
          ...chartOptions.plugins.legend.labels,
          generateLabels: (chart: any) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset: any, i: number) => ({
              text: dataset.label,
              fillStyle: dataset.backgroundColor,
              strokeStyle: dataset.borderColor,
              lineWidth: 2,
              pointStyle: 'rect',
              hidden: !chart.isDatasetVisible(i),
              index: i,
            }));
          },
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {renderHeader()}
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">Job Application Statistics</h1>
          
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
            <Card className="bg-card shadow-lg border border-border hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  Job Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Doughnut data={statusChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Applications Over Time */}
            <Card className="bg-card shadow-lg border border-border hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                  Applications Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line data={applicationsChartData} options={lineChartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Top Companies */}
            <Card className="bg-card shadow-lg border border-border hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
                  Top Companies
                </CardTitle>
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
            <Card className="bg-card shadow-lg border border-border hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                  Monthly Activity
                </CardTitle>
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