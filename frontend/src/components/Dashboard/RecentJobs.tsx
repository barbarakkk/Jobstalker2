import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { Job } from '@/lib/types';

interface RecentJobsProps {
  jobs: Job[];
  limit?: number;
}

export function RecentJobs({ jobs, limit = 5 }: RecentJobsProps) {
  const recentJobs = jobs.slice(0, limit);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'interviewing': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'applied': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900">{job.title}</h4>
                  <Badge className={getStatusBadgeColor(job.status)}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{job.company}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-500">{job.location}</span>
                  <span className="text-xs text-gray-500">{job.salary}</span>
                  <div className="flex space-x-1">
                    {renderStars(job.excitement)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Applied</div>
                <div className="text-sm font-medium">{job.dateApplied}</div>
              </div>
            </div>
          ))}
        </div>
        {jobs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No jobs found. Add your first job application to get started!
          </div>
        )}
      </CardContent>
    </Card>
  );
} 