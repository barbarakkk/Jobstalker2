import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Job } from '@/lib/types';
import { 
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { 
  Bookmark, 
  Send, 
  Users, 
  CheckCircle,
  Clock
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface JobStatusPieChartProps {
  jobs: Job[];
}

export function JobStatusPieChart({ jobs }: JobStatusPieChartProps) {
  // Calculate status distribution
  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Define status order and colors to match dashboard
  const statusOrder = ['Bookmarked', 'Applying', 'Applied', 'Interviewing', 'Accepted'];
  const statusData = statusOrder
    .filter(status => statusCounts[status] > 0)
    .map(status => ({
      status,
      count: statusCounts[status],
      percentage: Math.round((statusCounts[status] / jobs.length) * 100)
    }));

  // Chart data with ultra-modern, trendy colors
  const chartData = {
    labels: statusData.map(item => item.status),
    datasets: [
      {
        data: statusData.map(item => item.count),
        backgroundColor: [
          '#8b5cf6', // Bookmarked - Modern purple
          '#f97316', // Applying - Vibrant orange
          '#06b6d4', // Applied - Cyan blue
          '#ec4899', // Interviewing - Hot pink
          '#84cc16', // Accepted - Lime green
        ],
        borderColor: [
          '#7c3aed', // Bookmarked - Darker purple
          '#ea580c', // Applying - Darker orange
          '#0891b2', // Applied - Darker cyan
          '#db2777', // Interviewing - Darker pink
          '#65a30d', // Accepted - Darker lime
        ],
        borderWidth: 0,
        hoverBackgroundColor: [
          '#7c3aed', // Bookmarked - Darker purple
          '#ea580c', // Applying - Darker orange
          '#0891b2', // Applied - Darker cyan
          '#db2777', // Interviewing - Darker pink
          '#65a30d', // Accepted - Darker lime
        ],
        hoverBorderColor: [
          '#6d28d9', // Bookmarked - Darkest purple
          '#dc2626', // Applying - Darkest orange
          '#0e7490', // Applied - Darkest cyan
          '#be185d', // Interviewing - Darkest pink
          '#4d7c0f', // Accepted - Darkest lime
        ],
        hoverBorderWidth: 8,
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        shadowBlur: 12,
        shadowColor: 'rgba(0, 0, 0, 0.15)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // We'll create a custom legend
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 2,
        cornerRadius: 16,
        displayColors: true,
        titleFont: { size: 16, weight: '700' as const },
        bodyFont: { size: 14, weight: '500' as const },
        padding: 20,
        titleAlign: 'center' as const,
        bodyAlign: 'center' as const,
        callbacks: {
          title: (context: any) => {
            return context[0]?.label || '';
          },
          label: (context: any) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return [
              `${value} job${value !== 1 ? 's' : ''}`,
              `${percentage}% of total applications`
            ];
          },
          labelColor: (context: any) => {
            return {
              borderColor: context.dataset.borderColor[context.dataIndex],
              backgroundColor: context.dataset.backgroundColor[context.dataIndex],
              borderWidth: 3,
              borderRadius: 8,
            };
          },
        },
      },
    },
    elements: {
      arc: {
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderWidth: 4,
        hoverBorderColor: '#ffffff',
      },
    },
    cutout: '40%',
    radius: '90%',
    hover: {
      scale: 1.12,
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutCubic',
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      arc: {
        borderWidth: 0,
        borderColor: 'transparent',
        hoverBorderWidth: 8,
        hoverBorderColor: '#ffffff',
        shadowOffsetX: 0,
        shadowOffsetY: 6,
        shadowBlur: 16,
        shadowColor: 'rgba(0, 0, 0, 0.2)',
      },
    },
  } as const;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Bookmarked':
        return <Bookmark className="w-4 h-4 text-white" />;
      case 'Applying':
        return <Clock className="w-4 h-4 text-white" />;
      case 'Applied':
        return <Send className="w-4 h-4 text-white" />;
      case 'Interviewing':
        return <Users className="w-4 h-4 text-white" />;
      case 'Accepted':
        return <CheckCircle className="w-4 h-4 text-white" />;
      default:
        return <Bookmark className="w-4 h-4 text-white" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Bookmarked':
        return 'bg-gradient-to-br from-violet-500 to-violet-600 text-white ring-1 ring-violet-200/60 shadow-lg';
      case 'Applying':
        return 'bg-gradient-to-br from-orange-500 to-orange-600 text-white ring-1 ring-orange-200/60 shadow-lg';
      case 'Applied':
        return 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white ring-1 ring-cyan-200/60 shadow-lg';
      case 'Interviewing':
        return 'bg-gradient-to-br from-pink-500 to-pink-600 text-white ring-1 ring-pink-200/60 shadow-lg';
      case 'Accepted':
        return 'bg-gradient-to-br from-lime-500 to-lime-600 text-white ring-1 ring-lime-200/60 shadow-lg';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  if (jobs.length === 0) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bookmark className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">Job Status Distribution</CardTitle>
              <p className="text-sm text-gray-600">Visual breakdown of your job applications by status</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs to display</h3>
            <p className="text-gray-600">Start adding jobs to see your status distribution</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bookmark className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Job Status Distribution</CardTitle>
            <p className="text-sm text-gray-600">Visual breakdown of your job applications by status</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            <div className="w-96 h-96 relative">
              <Pie data={chartData} options={chartOptions} />
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-md rounded-full p-8 shadow-2xl border border-gray-200/50 min-w-[120px] min-h-[120px] flex flex-col items-center justify-center">
                  <div className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{jobs.length}</div>
                  <div className="text-sm font-bold text-gray-600 uppercase tracking-widest">Total Jobs</div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Legend */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h3>
            <div className="space-y-3">
              {statusData.map((item, index) => (
                <div key={item.status} className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-2xl shadow-sm ${getStatusColor(item.status)} transform transition-transform duration-200 group-hover:scale-105`}>
                      {getStatusIcon(item.status)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-base">{item.status}</p>
                      <p className="text-sm text-gray-600 font-medium">{item.percentage}% of total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                    <p className="text-xs text-gray-500 font-medium">job{item.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-800" />
                </div>
                <span className="text-base font-semibold text-blue-900">Total Applications</span>
              </div>
              <div className="text-3xl font-bold text-blue-900 mb-1">{jobs.length}</div>
              <p className="text-sm text-blue-800 font-medium">across all statuses</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
