import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Job } from '@/lib/types';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Users,
  Bookmark,
  Send
} from 'lucide-react';

interface RecentActivityProps {
  jobs: Job[];
}

interface ActivityData {
  applicationsThisWeek: number;
  applicationsThisMonth: number;
  upcomingInterviews: number;
  actionItems: number;
  recentActivity: Array<{
    type: 'application' | 'interview' | 'bookmark' | 'status_change';
    title: string;
    company: string;
    date: string;
    status?: string;
  }>;
}

export function RecentActivity({ jobs }: RecentActivityProps) {
  const calculateActivityData = (): ActivityData => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate weekly and monthly applications
    const applicationsThisWeek = jobs.filter(job => 
      new Date(job.created_at) >= oneWeekAgo && 
      ['Applied', 'Interviewing', 'Accepted'].includes(job.status)
    ).length;

    const applicationsThisMonth = jobs.filter(job => 
      new Date(job.created_at) >= oneMonthAgo && 
      ['Applied', 'Interviewing', 'Accepted'].includes(job.status)
    ).length;

    // Count upcoming interviews (jobs in Interviewing status)
    const upcomingInterviews = jobs.filter(job => job.status === 'Interviewing').length;

    // Count action items (Bookmarked + Applying jobs)
    const actionItems = jobs.filter(job => 
      ['Bookmarked', 'Applying'].includes(job.status)
    ).length;

    // Generate recent activity feed
    const recentActivity = jobs
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .map(job => {
        const isRecent = new Date(job.created_at) >= oneWeekAgo;
        const isStatusChange = new Date(job.updated_at) > new Date(job.created_at);
        
        let type: 'application' | 'interview' | 'bookmark' | 'status_change';
        let title: string;

        if (job.status === 'Interviewing') {
          type = 'interview';
          title = 'Interview scheduled';
        } else if (job.status === 'Applied' && isRecent) {
          type = 'application';
          title = 'Application submitted';
        } else if (job.status === 'Bookmarked') {
          type = 'bookmark';
          title = 'Job bookmarked';
        } else if (isStatusChange) {
          type = 'status_change';
          title = `Status updated to ${job.status}`;
        } else {
          type = 'application';
          title = 'Job added';
        }

        return {
          type,
          title,
          company: job.company,
          date: job.updated_at,
          status: job.status
        };
      });

    return {
      applicationsThisWeek,
      applicationsThisMonth,
      upcomingInterviews,
      actionItems,
      recentActivity
    };
  };

  const activityData = calculateActivityData();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <Send className="w-4 h-4 text-blue-600" />;
      case 'interview':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'bookmark':
        return <Bookmark className="w-4 h-4 text-gray-600" />;
      case 'status_change':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'application':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'bookmark':
        return 'bg-gray-100 text-gray-800';
      case 'status_change':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
      <CardHeader className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Recent Activity & Momentum</CardTitle>
            <p className="text-sm text-gray-600">Your job search progress and upcoming actions</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week & Month</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Applications This Week */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">This Week</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {activityData.applicationsThisWeek}
                </div>
                <p className="text-xs text-blue-700">Applications</p>
              </div>

              {/* Applications This Month */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">This Month</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {activityData.applicationsThisMonth}
                </div>
                <p className="text-xs text-green-700">Applications</p>
              </div>

              {/* Upcoming Interviews */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Upcoming</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {activityData.upcomingInterviews}
                </div>
                <p className="text-xs text-purple-700">Interviews</p>
              </div>

              {/* Action Items */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Action Items</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  {activityData.actionItems}
                </div>
                <p className="text-xs text-orange-700">Need attention</p>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            
            <div className="space-y-3">
              {activityData.recentActivity.length > 0 ? (
                activityData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-1 rounded-full ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.company}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(activity.date)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
