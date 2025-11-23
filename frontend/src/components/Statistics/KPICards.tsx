import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Job } from '@/lib/types';
import { 
  Briefcase, 
  Target, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

interface KPICardsProps {
  jobs: Job[];
}

interface KPIData {
  totalApplications: number;
  interviewConversionRate: number;
  offerRate: number;
  activeOpportunities: number;
  applicationCompletionRate: number;
  trendData: {
    applicationsThisWeek: number;
    applicationsLastWeek: number;
    applicationsThisMonth: number;
    applicationsLastMonth: number;
  };
}

export function KPICards({ jobs }: KPICardsProps) {
  // Calculate KPI data
  const calculateKPIs = (): KPIData => {
    const totalApplications = jobs.length;
    const totalApplied = jobs.filter(job => 
      ['Applied', 'Interviewing', 'Accepted'].includes(job.status)
    ).length;
    const totalInterviewing = jobs.filter(job => job.status === 'Interviewing').length;
    const totalAccepted = jobs.filter(job => job.status === 'Accepted').length;
    const activeOpportunities = jobs.filter(job => 
      !['Accepted'].includes(job.status)
    ).length;

    // Calculate rates
    const interviewConversionRate = totalApplications > 0 
      ? Math.round((totalInterviewing / totalApplications) * 100) 
      : 0;
    
    const offerRate = totalApplications > 0 
      ? Math.round((totalAccepted / totalApplications) * 100) 
      : 0;

    const applicationCompletionRate = totalApplications > 0 
      ? Math.round((totalApplied / totalApplications) * 100) 
      : 0;

    // Calculate trend data (last 7 days vs previous 7 days)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const applicationsThisWeek = jobs.filter(job => 
      new Date(job.created_at) >= oneWeekAgo
    ).length;

    const applicationsLastWeek = jobs.filter(job => {
      const createdDate = new Date(job.created_at);
      return createdDate >= twoWeeksAgo && createdDate < oneWeekAgo;
    }).length;

    const applicationsThisMonth = jobs.filter(job => 
      new Date(job.created_at) >= oneMonthAgo
    ).length;

    const applicationsLastMonth = jobs.filter(job => {
      const createdDate = new Date(job.created_at);
      return createdDate >= twoMonthsAgo && createdDate < oneMonthAgo;
    }).length;

    return {
      totalApplications,
      interviewConversionRate,
      offerRate,
      activeOpportunities,
      applicationCompletionRate,
      trendData: {
        applicationsThisWeek,
        applicationsLastWeek,
        applicationsThisMonth,
        applicationsLastMonth,
      }
    };
  };

  const kpiData = calculateKPIs();

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Total Applications */}
      <Card className="bg-white border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 h-1"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700">
            Total Applications
          </CardTitle>
          <div className="p-2 bg-blue-100 rounded-lg">
            <Briefcase className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="text-3xl font-black text-gray-900 mb-2">
            {kpiData.totalApplications}
          </div>
          <div className="flex items-center space-x-1.5 text-xs">
            {getTrendIcon(kpiData.trendData.applicationsThisWeek, kpiData.trendData.applicationsLastWeek)}
            <span className={getTrendColor(kpiData.trendData.applicationsThisWeek, kpiData.trendData.applicationsLastWeek) + " font-medium"}>
              {getTrendText(kpiData.trendData.applicationsThisWeek, kpiData.trendData.applicationsLastWeek)} this week
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Interview Conversion Rate - Key KPI */}
      <Card className="bg-white border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300 overflow-hidden relative">
        <div className="absolute top-0 right-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
          KEY METRIC
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 h-1"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700">
            Interview Rate
          </CardTitle>
          <div className="p-2 bg-purple-100 rounded-lg">
            <Target className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="text-3xl font-black text-gray-900 mb-2">
            {kpiData.interviewConversionRate}%
          </div>
          <p className="text-xs text-gray-600 font-medium">
            Key performance indicator
          </p>
        </CardContent>
      </Card>

      {/* Offer Rate */}
      <Card className="bg-white border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        <div className="bg-gradient-to-br from-green-500 to-green-600 h-1"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700">
            Offer Rate
          </CardTitle>
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="text-3xl font-black text-gray-900 mb-2">
            {kpiData.offerRate}%
          </div>
          <p className="text-xs text-gray-600 font-medium">
            {kpiData.offerRate > 0 ? '🎉 Congratulations!' : 'Keep applying!'}
          </p>
        </CardContent>
      </Card>

      {/* Active Opportunities */}
      <Card className="bg-white border-0 shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 h-1"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-gray-700">
            Active Opportunities
          </CardTitle>
          <div className="p-2 bg-orange-100 rounded-lg">
            <Activity className="h-4 w-4 text-orange-600" />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="text-3xl font-black text-gray-900 mb-2">
            {kpiData.activeOpportunities}
          </div>
          <p className="text-xs text-gray-600 font-medium">
            In your pipeline
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
