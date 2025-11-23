import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Job } from '@/lib/types';
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface AIInsightsProps {
  jobs: Job[];
}

interface InsightData {
  interviewRate: number;
  bookmarkedCount: number;
  appliedCount: number;
  interviewingCount: number;
  acceptedCount: number;
  totalApplications: number;
  applicationCompletionRate: number;
}

export function AIInsights({ jobs }: AIInsightsProps) {
  const calculateInsightData = (): InsightData => {
    const totalApplications = jobs.length;
    const bookmarkedCount = jobs.filter(job => job.status === 'Bookmarked').length;
    const appliedCount = jobs.filter(job => job.status === 'Applied').length;
    const interviewingCount = jobs.filter(job => job.status === 'Interviewing').length;
    const acceptedCount = jobs.filter(job => job.status === 'Accepted').length;
    
    const interviewRate = totalApplications > 0 
      ? Math.round((interviewingCount / totalApplications) * 100) 
      : 0;

    const applicationCompletionRate = totalApplications > 0 
      ? Math.round(((appliedCount + interviewingCount + acceptedCount) / totalApplications) * 100) 
      : 0;

    return {
      interviewRate,
      bookmarkedCount,
      appliedCount,
      interviewingCount,
      acceptedCount,
      totalApplications,
      applicationCompletionRate
    };
  };

  const insightData = calculateInsightData();

  const generateInsights = () => {
    const insights = [];

    // Interview Rate Insight
    if (insightData.interviewRate > 0) {
      let interviewMessage = '';
      if (insightData.interviewRate >= 20) {
        interviewMessage = `You have a ${insightData.interviewRate}% interview rate. This is excellent! You're clearly targeting the right opportunities and presenting yourself well.`;
      } else if (insightData.interviewRate >= 10) {
        interviewMessage = `You have a ${insightData.interviewRate}% interview rate. This is a solid start! To improve it, try tailoring your resume more closely to each job description.`;
      } else {
        interviewMessage = `You have a ${insightData.interviewRate}% interview rate. Consider reviewing your application materials and targeting roles that better match your experience.`;
      }
      insights.push({
        type: 'success',
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'Interview Performance',
        message: interviewMessage
      });
    }

    // Priority Action Insight
    if (insightData.bookmarkedCount > 0) {
      insights.push({
        type: 'action',
        icon: <Target className="w-5 h-5" />,
        title: 'Priority Action',
        message: `Focus on converting your ${insightData.bookmarkedCount} 'Bookmarked' job${insightData.bookmarkedCount > 1 ? 's' : ''} into applications this week to keep your pipeline full.`
      });
    }

    // Interview Preparation Insight
    if (insightData.interviewingCount > 0) {
      insights.push({
        type: 'preparation',
        icon: <CheckCircle className="w-5 h-5" />,
        title: 'Prepare for Success',
        message: `You have ${insightData.interviewingCount} upcoming interview${insightData.interviewingCount > 1 ? 's' : ''}. Now is a great time to research the compan${insightData.interviewingCount > 1 ? 'ies' : 'y'} and practice common questions.`
      });
    }

    // Application Completion Insight
    if (insightData.applicationCompletionRate < 50 && insightData.totalApplications > 3) {
      insights.push({
        type: 'improvement',
        icon: <AlertTriangle className="w-5 h-5" />,
        title: 'Application Efficiency',
        message: `Your application completion rate is ${insightData.applicationCompletionRate}%. Consider being more selective with your applications to focus on quality over quantity.`
      });
    }

    // Motivation Insight
    if (insightData.totalApplications === 0) {
      insights.push({
        type: 'motivation',
        icon: <Lightbulb className="w-5 h-5" />,
        title: 'Get Started',
        message: 'Ready to begin your job search? Start by bookmarking interesting positions and then convert them into applications!'
      });
    } else if (insightData.totalApplications < 5) {
      insights.push({
        type: 'motivation',
        icon: <Lightbulb className="w-5 h-5" />,
        title: 'Building Momentum',
        message: 'Great start! Keep adding more opportunities to your pipeline. A healthy job search typically involves 10-20 active applications.'
      });
    }

    // Success Celebration
    if (insightData.acceptedCount > 0) {
      insights.push({
        type: 'celebration',
        icon: <CheckCircle className="w-5 h-5" />,
        title: 'Congratulations!',
        message: `You've received ${insightData.acceptedCount} job offer${insightData.acceptedCount > 1 ? 's' : ''}! This is fantastic news. Consider your options carefully.`
      });
    }

    return insights;
  };

  const insights = generateInsights();

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'action':
        return 'bg-blue-50 border-blue-200';
      case 'preparation':
        return 'bg-purple-50 border-purple-200';
      case 'improvement':
        return 'bg-yellow-50 border-yellow-200';
      case 'motivation':
        return 'bg-indigo-50 border-indigo-200';
      case 'celebration':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'action':
        return 'text-blue-600';
      case 'preparation':
        return 'text-purple-600';
      case 'improvement':
        return 'text-yellow-600';
      case 'motivation':
        return 'text-indigo-600';
      case 'celebration':
        return 'text-emerald-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
      <CardHeader className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-md">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">AI-Powered Insights & Recommendations</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Personalized advice to optimize your job search strategy</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <div className="space-y-4">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <div key={index} className={`border-2 rounded-xl p-5 ${getInsightColor(insight.type)} hover:shadow-md transition-shadow duration-300`}>
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${getIconColor(insight.type)} bg-white/50`}>
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2 text-base">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No insights yet</h3>
              <p className="text-sm text-gray-600">Add more jobs to get personalized insights</p>
            </div>
          )}
        </div>

        {/* Enhanced Additional Tips Section */}
        <div className="mt-8 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-5">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-gray-200 rounded-lg">
              <ArrowRight className="w-5 h-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-3 text-base">Pro Tips</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Update your status regularly to track progress accurately</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Use the excitement level to prioritize your applications</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Set deadlines to maintain momentum in your job search</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>Review and refine your approach based on these insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
