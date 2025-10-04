import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Job } from '@/lib/types';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Send,
  Users
} from 'lucide-react';

interface ConversionMetricsProps {
  jobs: Job[];
}

interface ConversionData {
  applicationCompletionRate: number;
  interviewToNextStageRate: number;
  averageTimeInStage: {
    bookmarked: number;
    applying: number;
    applied: number;
    interviewing: number;
  };
  conversionTrends: {
    applicationsThisWeek: number;
    applicationsLastWeek: number;
    interviewsThisWeek: number;
    interviewsLastWeek: number;
  };
}

export function ConversionMetrics({ jobs }: ConversionMetricsProps) {
  const calculateConversionData = (): ConversionData => {
    const totalJobs = jobs.length;
    const totalApplied = jobs.filter(job => 
      ['Applied', 'Interviewing', 'Accepted'].includes(job.status)
    ).length;
    const totalInterviewing = jobs.filter(job => job.status === 'Interviewing').length;
    const totalAccepted = jobs.filter(job => job.status === 'Accepted').length;

    // Calculate rates
    const applicationCompletionRate = totalJobs > 0 
      ? Math.round((totalApplied / totalJobs) * 100) 
      : 0;

    const interviewToNextStageRate = totalInterviewing > 0 
      ? Math.round((totalAccepted / totalInterviewing) * 100) 
      : 0;

    // Calculate average time in each stage (simplified - using created_at to updated_at)
    const now = new Date();
    const averageTimeInStage = {
      bookmarked: 0,
      applying: 0,
      applied: 0,
      interviewing: 0,
    };

    // Calculate time spent in each stage
    jobs.forEach(job => {
      const createdDate = new Date(job.created_at);
      const updatedDate = new Date(job.updated_at);
      const daysInStage = Math.ceil((updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (job.status) {
        case 'Bookmarked':
          averageTimeInStage.bookmarked += daysInStage;
          break;
        case 'Applying':
          averageTimeInStage.applying += daysInStage;
          break;
        case 'Applied':
          averageTimeInStage.applied += daysInStage;
          break;
        case 'Interviewing':
          averageTimeInStage.interviewing += daysInStage;
          break;
      }
    });

    // Calculate weekly trends
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const applicationsThisWeek = jobs.filter(job => 
      new Date(job.created_at) >= oneWeekAgo && 
      ['Applied', 'Interviewing', 'Accepted'].includes(job.status)
    ).length;

    const applicationsLastWeek = jobs.filter(job => {
      const createdDate = new Date(job.created_at);
      return createdDate >= twoWeeksAgo && 
             createdDate < oneWeekAgo && 
             ['Applied', 'Interviewing', 'Accepted'].includes(job.status);
    }).length;

    const interviewsThisWeek = jobs.filter(job => 
      new Date(job.created_at) >= oneWeekAgo && 
      job.status === 'Interviewing'
    ).length;

    const interviewsLastWeek = jobs.filter(job => {
      const createdDate = new Date(job.created_at);
      return createdDate >= twoWeeksAgo && 
             createdDate < oneWeekAgo && 
             job.status === 'Interviewing';
    }).length;

    return {
      applicationCompletionRate,
      interviewToNextStageRate,
      averageTimeInStage,
      conversionTrends: {
        applicationsThisWeek,
        applicationsLastWeek,
        interviewsThisWeek,
        interviewsLastWeek,
      }
    };
  };

  const conversionData = calculateConversionData();

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    if (current < previous) return <ArrowDownRight className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getTrendText = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 'New' : 'No change';
    const change = ((current - previous) / previous) * 100;
    return `${Math.abs(Math.round(change))}%`;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Conversion Metrics</CardTitle>
            <p className="text-sm text-gray-600">Your search efficiency and stage progression</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Conversion Rates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Conversion Rates</h3>
            
            {/* Application Completion Rate */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Application Completion Rate</span>
                </div>
                <span className="text-2xl font-bold text-blue-900">
                  {conversionData.applicationCompletionRate}%
                </span>
              </div>
              <p className="text-sm text-blue-700">
                Percentage of jobs that moved from research to application
              </p>
            </div>

            {/* Interview to Next Stage Rate */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-900">Interview-to-Next-Stage Rate</span>
                </div>
                <span className="text-2xl font-bold text-purple-900">
                  {conversionData.interviewToNextStageRate}%
                </span>
              </div>
              <p className="text-sm text-purple-700">
                {conversionData.interviewToNextStageRate > 0 
                  ? 'Great progress from interviews to offers!'
                  : 'We\'ll track this when you have more interview data'
                }
              </p>
            </div>
          </div>

          {/* Weekly Trends */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trends</h3>
            
            {/* Applications This Week */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Applications This Week</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(
                    conversionData.conversionTrends.applicationsThisWeek, 
                    conversionData.conversionTrends.applicationsLastWeek
                  )}
                  <span className="text-lg font-bold text-gray-900">
                    {conversionData.conversionTrends.applicationsThisWeek}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                <span className={getTrendColor(
                  conversionData.conversionTrends.applicationsThisWeek, 
                  conversionData.conversionTrends.applicationsLastWeek
                )}>
                  {getTrendText(
                    conversionData.conversionTrends.applicationsThisWeek, 
                    conversionData.conversionTrends.applicationsLastWeek
                  )} vs last week
                </span>
              </p>
            </div>

            {/* Interviews This Week */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-900">Interviews This Week</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(
                    conversionData.conversionTrends.interviewsThisWeek, 
                    conversionData.conversionTrends.interviewsLastWeek
                  )}
                  <span className="text-lg font-bold text-purple-900">
                    {conversionData.conversionTrends.interviewsThisWeek}
                  </span>
                </div>
              </div>
              <p className="text-sm text-purple-700">
                <span className={getTrendColor(
                  conversionData.conversionTrends.interviewsThisWeek, 
                  conversionData.conversionTrends.interviewsLastWeek
                )}>
                  {getTrendText(
                    conversionData.conversionTrends.interviewsThisWeek, 
                    conversionData.conversionTrends.interviewsLastWeek
                  )} vs last week
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Average Time in Stage - Future Feature Note */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">Average Time in Stage</h4>
              <p className="text-sm text-yellow-800">
                This feature will show how long jobs typically stay in each stage, helping you identify bottlenecks in your application process. Coming soon!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
