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
      case 'Bookmarked': return 'status-badge status-bookmarked';
      case 'Applying': return 'status-badge status-applying';
      case 'Applied': return 'status-badge status-applied';
      case 'Interviewing': return 'status-badge status-interviewing';
      case 'Accepted': return 'status-badge status-accepted';
      default: return 'status-badge bg-muted text-muted-foreground border-border';
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < count ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
      />
    ));
  };

  return (
    <Card className="bg-card shadow-sm border border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Recent Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  {job.job_url ? (
                    <a
                      href={job.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                      title="Open original job posting"
                    >
                      {job.job_title}
                    </a>
                  ) : (
                    <h4 className="font-medium text-foreground">{job.job_title}</h4>
                  )}
                  <Badge className={getStatusBadgeColor(job.status)}>
                    {job.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{job.company}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-muted-foreground">{job.location}</span>
                  <span className="text-xs text-muted-foreground">{job.salary}</span>
                  <div className="flex space-x-1">
                    {renderStars(job.excitement_level)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Applied</div>
                <div className="text-sm font-medium text-foreground">{job.date_applied}</div>
              </div>
            </div>
          ))}
        </div>
        {jobs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No jobs found. Add your first job application to get started!
          </div>
        )}
      </CardContent>
    </Card>
  );
} 