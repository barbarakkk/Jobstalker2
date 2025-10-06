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

  const getInitials = (text: string) => {
    if (!text) return 'JS';
    const words = text.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const getStatusBadgeClasses = (status: Job['status']) => {
    switch (status) {
      case 'Bookmarked':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'Applying':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Applied':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'Interviewing':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'Accepted':
        return 'bg-green-50 text-green-700 border border-green-200';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Back */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>

        {/* Header Card */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                    {getInitials(job.company || job.job_title)}
                  </div>
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
                <Badge className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusBadgeClasses(job.status)}`}>{job.status}</Badge>
                <div className="flex items-center gap-2">
                  {job.job_url && (
                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" /> Apply Now
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Notes / Description */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900">Notes</h2>
                  <span className="text-xs text-gray-400">{(job.description || '').length} chars</span>
                </div>
                {job.description ? (
                  <div className="prose max-w-none whitespace-pre-wrap text-gray-800 text-sm leading-6 bg-white border border-gray-200 rounded-md p-4">
                    {job.description}
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-md p-6 bg-gray-50 text-sm text-gray-600">
                    <p className="font-medium text-gray-700 mb-1">No notes yet</p>
                    <p className="text-gray-500">Add your thoughts, follow-ups, or interview prep when editing this job.</p>
                  </div>
                )}
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


