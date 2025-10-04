import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { jobApi } from '@/lib/api';
import { Job } from '@/lib/types';
import { ArrowLeft, ExternalLink, MapPin, DollarSign, CalendarClock, Building2, BookmarkPlus } from 'lucide-react';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const jobs = await jobApi.getJobs();
        const found = jobs.find(j => j.id === id) || null;
        setJob(found);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="h-10 w-40 bg-gray-200 rounded mb-4" />
          <div className="h-6 w-72 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Back */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>

        {/* Header Card */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">JD</div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{job.job_title}</h1>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium truncate">{job.company}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {job.salary && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold text-gray-800 truncate">{job.salary}</span>
                    </div>
                  )}
                  {job.location && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold text-gray-800 truncate">{job.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                    <CalendarClock className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold text-gray-800 truncate">{job.date_applied || 'Not applied'}</span>
                  </div>
                </div>
              </div>

              {/* Status + Actions */}
              <div className="shrink-0 flex flex-col items-end gap-3">
                <Badge className="px-3 py-1 text-xs font-bold rounded-full">{job.status}</Badge>
                <div className="flex items-center gap-2">
                  {job.job_url && (
                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" /> Apply Now
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="border-gray-300 text-gray-700">
                    <BookmarkPlus className="h-4 w-4 mr-2" /> Save Job
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Description */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-3">About the Role</h2>
                <div className="prose max-w-none whitespace-pre-wrap text-gray-800 text-sm leading-6">
                  {job.description || 'No description available.'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
                {job.job_url && (
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" /> Apply Now
                    </a>
                  </Button>
                )}
                <Button variant="outline" className="w-full border-gray-300 text-gray-700">
                  <BookmarkPlus className="h-4 w-4 mr-2" /> Save Job
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


