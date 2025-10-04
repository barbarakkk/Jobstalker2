import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Job } from '@/lib/types';
import { 
  Bookmark, 
  Send, 
  CheckCircle, 
  Users, 
  Award,
  ArrowRight
} from 'lucide-react';

interface PipelineFunnelProps {
  jobs: Job[];
}

interface StageData {
  status: string;
  count: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
}

export function PipelineFunnel({ jobs }: PipelineFunnelProps) {
  const calculateStageData = (): StageData[] => {
    const totalJobs = jobs.length;
    
    const stages = [
      {
        status: 'Bookmarked',
        count: jobs.filter(job => job.status === 'Bookmarked').length,
        icon: <Bookmark className="w-5 h-5" />,
        color: 'text-gray-700',
        bgColor: 'bg-gray-100',
        description: 'Jobs you\'re interested in'
      },
      {
        status: 'Applying',
        count: jobs.filter(job => job.status === 'Applying').length,
        icon: <Send className="w-5 h-5" />,
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100',
        description: 'Currently preparing applications'
      },
      {
        status: 'Applied',
        count: jobs.filter(job => job.status === 'Applied').length,
        icon: <CheckCircle className="w-5 h-5" />,
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        description: 'Applications submitted'
      },
      {
        status: 'Interviewing',
        count: jobs.filter(job => job.status === 'Interviewing').length,
        icon: <Users className="w-5 h-5" />,
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        description: 'In interview process'
      },
      {
        status: 'Accepted',
        count: jobs.filter(job => job.status === 'Accepted').length,
        icon: <Award className="w-5 h-5" />,
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        description: 'Job offers received'
      }
    ];

    return stages.map(stage => ({
      ...stage,
      percentage: totalJobs > 0 ? Math.round((stage.count / totalJobs) * 100) : 0
    }));
  };

  const stageData = calculateStageData();
  const totalJobs = jobs.length;

  // Calculate insights
  const bookmarkedCount = stageData.find(s => s.status === 'Bookmarked')?.count || 0;
  const earlyStagePercentage = totalJobs > 0 ? Math.round((bookmarkedCount / totalJobs) * 100) : 0;

  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Your Application Pipeline</CardTitle>
            <p className="text-sm text-gray-600">Visual breakdown of your job search funnel</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Funnel Visualization */}
        <div className="space-y-4 mb-6">
          {stageData.map((stage, index) => (
            <div key={stage.status} className="relative">
              {/* Funnel Bar */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-lg ${stage.bgColor}`}>
                    <div className={stage.color}>
                      {stage.icon}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900">{stage.status}</h3>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">{stage.count}</span>
                        <span className="text-sm text-gray-600 ml-2">({stage.percentage}%)</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{stage.description}</p>
                  </div>
                </div>
                
                {/* Visual Bar */}
                <div className="w-32 h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stage.bgColor} transition-all duration-500 ease-out`}
                    style={{ width: `${Math.max(stage.percentage, 5)}%` }}
                  />
                </div>
              </div>
              
              {/* Arrow between stages */}
              {index < stageData.length - 1 && (
                <div className="flex justify-center mt-2 mb-2">
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Insight */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-blue-100 rounded">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Pipeline Insight</h4>
              <p className="text-sm text-blue-800">
                {earlyStagePercentage > 0 
                  ? `${earlyStagePercentage}% of your opportunities are still in the early research phase (Bookmarked). Consider converting these to applications to keep your pipeline active.`
                  : 'Your pipeline is well-distributed across different stages. Great job maintaining momentum!'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
