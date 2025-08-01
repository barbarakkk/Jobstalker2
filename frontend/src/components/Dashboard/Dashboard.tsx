import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Star, MoreHorizontal, Plus, Edit, Trash2 } from 'lucide-react';
import { Job } from '@/lib/types';
import { jobApi } from '@/lib/api';
import { AddJobModal } from '@/components/Jobs/AddJobModal';

interface DashboardProps {
  // Add props as needed
}

export function Dashboard({ }: DashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);

  // Load jobs from API
  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const jobsData = await jobApi.getJobs();
      setJobs(jobsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  // Handle job save (create or update)
  const handleJobSave = (savedJob: Job) => {
    setJobs(prevJobs => {
      const existingIndex = prevJobs.findIndex(job => job.id === savedJob.id);
      if (existingIndex >= 0) {
        // Update existing job
        const updatedJobs = [...prevJobs];
        updatedJobs[existingIndex] = savedJob;
        return updatedJobs;
      } else {
        // Add new job
        return [...prevJobs, savedJob];
      }
    });
  };

  // Handle job delete
  const handleJobDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await jobApi.deleteJob(jobId);
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  // Handle add new job
  const handleAddJob = () => {
    setIsAddJobModalOpen(true);
  };

  // Handle job added from modal
  const handleJobAdded = (newJob: Job) => {
    setJobs(prevJobs => [...prevJobs, newJob]);
  };

  const getStatusCount = (status: string) => {
    return jobs.filter(job => job.status === status).length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bookmarked': return 'bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/50';
      case 'applying': return 'bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200/50';
      case 'applied': return 'bg-gradient-to-br from-yellow-50 to-amber-100 border border-yellow-200/50';
      case 'interviewing': return 'bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200/50';
      case 'accepted': return 'bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200/50';
      default: return 'bg-gradient-to-br from-gray-50 to-slate-100 border border-gray-200/50';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'interviewing': return 'bg-gradient-to-r from-purple-500 to-violet-600 text-white';
      case 'accepted': return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
      case 'applied': return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white';
      case 'rejected': return 'bg-gradient-to-r from-red-500 to-rose-600 text-white';
      case 'bookmarked': return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white';
      case 'applying': return 'bg-gradient-to-r from-orange-500 to-amber-600 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-600 text-white';
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">JS</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  JobStalker
                </h1>
                <p className="text-sm text-gray-600 font-medium">Job Tracking Made Simple</p>
              </div>
            </div>
            <nav className="flex items-center space-x-8">
              <a href="#" className="text-blue-600 font-semibold relative group">
                Jobs
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">Statistics</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">Job Matcher</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">AI Resume Builder</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">Profile</a>
              <Button variant="destructive" size="sm" className="shadow-md hover:shadow-lg transition-shadow">
                Sign Out
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className={`${getStatusColor('bookmarked')} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{getStatusCount('bookmarked')}</div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Bookmarked</div>
            </div>
          </div>
          <div className={`${getStatusColor('applying')} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{getStatusCount('applying')}</div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Applying</div>
            </div>
          </div>
          <div className={`${getStatusColor('applied')} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{getStatusCount('applied')}</div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Applied</div>
            </div>
          </div>
          <div className={`${getStatusColor('interviewing')} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{getStatusCount('interviewing')}</div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Interviewing</div>
            </div>
          </div>
          <div className={`${getStatusColor('accepted')} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{getStatusCount('accepted')}</div>
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Accepted</div>
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Checkbox id="select-all" className="rounded-md" />
                <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                  {selectedJobs.length} selected
                </label>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100/80 rounded-xl p-1 shadow-inner">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg transition-all ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                      : 'hover:bg-gray-200/60'
                  }`}
                >
                  List View
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className={`rounded-lg transition-all ${
                    viewMode === 'kanban' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                      : 'hover:bg-gray-200/60'
                  }`}
                >
                  Kanban
                </Button>
              </div>
                             <Button 
                 onClick={handleAddJob}
                 className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
               >
                 <Plus className="w-4 h-4 mr-2" />
                 Add New Job
               </Button>
            </div>
          </div>
        </div>

        {/* Job List */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Job Title / Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Salary
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date Saved
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date Applied
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Excitement
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <Checkbox className="rounded-md" />
                        <MoreHorizontal className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" />
                        <Button variant="ghost" size="sm" className="text-xs hover:bg-gray-100 rounded-lg">
                          Notes (0)
                        </Button>
                      </div>
                    </td>
                                         <td className="px-6 py-5 whitespace-nowrap">
                       <div>
                         <div className="text-sm font-semibold text-gray-900">{job.job_title}</div>
                         <div className="text-sm text-gray-600 font-medium">{job.company}</div>
                       </div>
                     </td>
                     <td className="px-6 py-5 whitespace-nowrap">
                       <span className="text-sm font-semibold text-gray-900 bg-green-50 px-3 py-1 rounded-full">
                         {job.salary || 'N/A'}
                       </span>
                     </td>
                     <td className="px-6 py-5 whitespace-nowrap">
                       <span className="text-sm font-medium text-gray-700 bg-blue-50 px-3 py-1 rounded-full">
                         {job.location || 'N/A'}
                       </span>
                     </td>
                     <td className="px-6 py-5 whitespace-nowrap">
                       <Badge className={`${getStatusBadgeColor(job.status)} rounded-full px-3 py-1 font-semibold shadow-sm`}>
                         {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                       </Badge>
                     </td>
                     <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-700">
                       {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}
                     </td>
                     <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-700">
                       {job.deadline || 'N/A'}
                     </td>
                     <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-700">
                       {job.date_applied || 'N/A'}
                     </td>
                     <td className="px-6 py-5 whitespace-nowrap">
                       <div className="flex items-center space-x-2">
                         <div className="flex space-x-1">
                           {renderStars(job.excitement_level || 0)}
                         </div>
                         <div className="flex space-x-1">
                           <Button
                             variant="ghost"
                             size="sm"
                             className="h-8 w-8 p-0 hover:bg-blue-50"
                           >
                             <Edit className="h-4 w-4 text-blue-600" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleJobDelete(job.id)}
                             className="h-8 w-8 p-0 hover:bg-red-50"
                           >
                             <Trash2 className="h-4 w-4 text-red-600" />
                           </Button>
                         </div>
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
                 </div>
       </div>

       {/* Add Job Modal */}
       <AddJobModal
         isOpen={isAddJobModalOpen}
         onClose={() => setIsAddJobModalOpen(false)}
         onJobAdded={handleJobAdded}
       />
     </div>
   );
 } 