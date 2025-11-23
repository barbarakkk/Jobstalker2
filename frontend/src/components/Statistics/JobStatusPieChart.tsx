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

  // Chart data with basic, simple colors
  const chartData = {
    labels: statusData.map(item => item.status),
    datasets: [
      {
        data: statusData.map(item => item.count),
        backgroundColor: [
          '#9ca3af', // Bookmarked - Gray
          '#fbbf24', // Applying - Amber/Yellow
          '#3b82f6', // Applied - Blue
          '#a855f7', // Interviewing - Purple
          '#10b981', // Accepted - Green
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverBackgroundColor: [
          '#6b7280', // Bookmarked - Darker gray
          '#f59e0b', // Applying - Darker amber
          '#2563eb', // Applied - Darker blue
          '#9333ea', // Interviewing - Darker purple
          '#059669', // Accepted - Darker green
        ],
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 3,
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
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        titleFont: { size: 14, weight: '600' as const, family: 'system-ui' },
        bodyFont: { size: 13, weight: '500' as const, family: 'system-ui' },
        padding: 16,
        titleAlign: 'center' as const,
        bodyAlign: 'center' as const,
        boxPadding: 8,
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
              `${percentage}% of total`
            ];
          },
          labelColor: (context: any) => {
            return {
              borderColor: context.dataset.hoverBackgroundColor[context.dataIndex],
              backgroundColor: context.dataset.backgroundColor[context.dataIndex],
              borderWidth: 2,
              borderRadius: 4,
            };
          },
        },
      },
    },
    cutout: '0%',
    radius: '100%',
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800,
      easing: 'easeOutQuart' as const,
    },
    elements: {
      arc: {
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderWidth: 5,
        hoverBorderColor: '#ffffff',
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
        return 'bg-gray-500 text-white shadow-md hover:shadow-lg transition-shadow';
      case 'Applying':
        return 'bg-amber-500 text-white shadow-md hover:shadow-lg transition-shadow';
      case 'Applied':
        return 'bg-blue-500 text-white shadow-md hover:shadow-lg transition-shadow';
      case 'Interviewing':
        return 'bg-purple-500 text-white shadow-md hover:shadow-lg transition-shadow';
      case 'Accepted':
        return 'bg-green-500 text-white shadow-md hover:shadow-lg transition-shadow';
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
    <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
      <CardHeader className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
            <Bookmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Job Status Distribution</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Visual breakdown of your job applications by status</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Pie Chart */}
          <div className="flex items-center justify-center lg:justify-start">
            <div className="w-full max-w-[320px] h-[320px] mx-auto lg:mx-0">
              <Pie data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Enhanced Custom Legend */}
          <div className="space-y-4">
            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Status Breakdown</h3>
              <p className="text-sm text-gray-500">Click on segments to see details</p>
            </div>
            <div className="space-y-3">
              {statusData.map((item, index) => (
                <div 
                  key={item.status} 
                  className="group flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`p-3 rounded-xl ${getStatusColor(item.status)} transform transition-transform duration-300 group-hover:scale-110`}>
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base mb-0.5">{item.status}</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: chartData.datasets[0].backgroundColor[index]
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-600 min-w-[45px] text-right">{item.percentage}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-black text-gray-900">{item.count}</p>
                    <p className="text-xs text-gray-500 font-medium">job{item.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Summary Stats */}
            <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-base font-bold text-blue-900">Total Applications</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <div className="text-3xl font-black text-blue-900">{jobs.length}</div>
                <p className="text-sm text-blue-700 font-medium">across all statuses</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
