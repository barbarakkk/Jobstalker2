import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Star, MoreHorizontal, Plus, Edit, Trash2, RefreshCw, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Job } from '@/lib/types';
import { jobApi } from '@/lib/api';
import { JobModal } from '@/components/Jobs/AddJobModal';
import { KanbanBoard } from './KanbanBoard';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  // Add props as needed
}

export function Dashboard({ }: DashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'job_title' | 'company' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState<'company' | 'job_title' | null>(null);
  const [filterValue, setFilterValue] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

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
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
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

  // Handle job delete with confirmation dialog
  const handleJobDelete = async (job: Job) => {
    setJobToDelete(job);
    setIsDeleteDialogOpen(true);
  };

  // Confirm single job delete
  const confirmJobDelete = async () => {
    if (!jobToDelete) return;
    
    try {
      await jobApi.deleteJob(jobToDelete.id);
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobToDelete.id));
      setSelectedJobs(prev => prev.filter(id => id !== jobToDelete.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    } finally {
      setIsDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedJobs.length === 0) return;
    setIsBulkDeleteDialogOpen(true);
  };

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    try {
      for (const jobId of selectedJobs) {
        await jobApi.deleteJob(jobId);
      }
      setJobs(prevJobs => prevJobs.filter(job => !selectedJobs.includes(job.id)));
      setSelectedJobs([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete jobs');
    } finally {
      setIsBulkDeleteDialogOpen(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (jobId: string, newStatus: string) => {
    setUpdatingJobId(jobId);
    try {
      const updatedJob = await jobApi.updateJob(jobId, { status: newStatus as 'Bookmarked' | 'Applying' | 'Applied' | 'Interviewing' | 'Accepted' });
      setJobs(prevJobs => prevJobs.map(job => job.id === jobId ? updatedJob : job));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job status');
    } finally {
      setUpdatingJobId(null);
    }
  };

  // Handle job selection
  const handleJobSelection = (jobId: string, checked: boolean) => {
    if (checked) {
      setSelectedJobs(prev => [...prev, jobId]);
    } else {
      setSelectedJobs(prev => prev.filter(id => id !== jobId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedJobs(jobs.map(job => job.id));
    } else {
      setSelectedJobs([]);
    }
  };

  // Handle sorting
  const handleSort = (field: 'job_title' | 'company') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Handle filtering
  const handleFilterChange = (filterType: 'company' | 'job_title' | null, value: string) => {
    setFilterBy(filterType);
    setFilterValue(value);
  };

  // Handle star rating update
  const handleStarRatingUpdate = async (jobId: string, newRating: number) => {
    setUpdatingJobId(jobId);
    try {
      const updatedJob = await jobApi.updateJob(jobId, { excitement_level: newRating });
      setJobs(prevJobs => prevJobs.map(job => job.id === jobId ? updatedJob : job));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job rating');
    } finally {
      setUpdatingJobId(null);
    }
  };

  // Get filtered and sorted jobs
  const getFilteredAndSortedJobs = () => {
    let filteredJobs = jobs;

    // Apply filters
    if (filterBy && filterValue) {
      filteredJobs = filteredJobs.filter(job => {
        const fieldValue = job[filterBy]?.toLowerCase() || '';
        return fieldValue.includes(filterValue.toLowerCase());
      });
    }

    // Apply sorting
    if (sortBy) {
      filteredJobs = [...filteredJobs].sort((a, b) => {
        const aValue = a[sortBy]?.toLowerCase() || '';
        const bValue = b[sortBy]?.toLowerCase() || '';
        
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filteredJobs;
  };

  // Handle add job
  const handleAddJob = () => {
    setModalMode('add');
    setJobToEdit(null);
    setIsJobModalOpen(true);
  };

  // Handle job saved
  const handleJobSaved = (savedJob: Job) => {
    handleJobSave(savedJob);
    setIsJobModalOpen(false);
  };

  // Handle edit job
  const handleEditJob = (job: Job) => {
    setModalMode('edit');
    setJobToEdit(job);
    setIsJobModalOpen(true);
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get status count
  const getStatusCount = (status: string) => {
    return jobs.filter(job => job.status === status).length;
  };

  // Get status color - Updated for professional theme
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Bookmarked': return 'bg-blue-100 border border-blue-300 text-blue-900';
      case 'Applied': return 'bg-purple-50 border border-purple-200 text-purple-900';
      case 'Interviewing': return 'bg-orange-50 border border-orange-200 text-orange-900';
      case 'Accepted': return 'bg-green-50 border border-green-200 text-green-900';
      case 'Applying': return 'bg-indigo-50 border border-indigo-200 text-indigo-900';
      default: return 'bg-white border border-slate-200 text-slate-900';
    }
  };

  // Get status badge color - Updated for professional theme
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Bookmarked': return 'bg-blue-200 text-blue-900 border border-blue-300';
      case 'Applied': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'Interviewing': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'Accepted': return 'bg-green-100 text-green-800 border border-green-200';
      case 'Applying': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      default: return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < count ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
      />
    ));
  };

  // Enhanced loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Professional Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
          <div className="w-full px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">JS</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    JobStalker
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">Professional Job Tracking Platform</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex justify-center items-center h-96">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600 mx-auto"></div>
            <div>
              <p className="text-slate-600 font-semibold">Loading your jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error state with retry functionality
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Professional Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
          <div className="w-full px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">JS</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    JobStalker
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">Professional Job Tracking Platform</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex justify-center items-center h-96">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mx-auto border border-red-200">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Failed to load jobs</h3>
              <p className="text-slate-500 text-base mb-4">{error}</p>
              <Button 
                onClick={loadJobs} 
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg px-6 py-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-2"></div>
                    Retrying...
                  </>
                ) : (
                  'Try Again'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="w-full px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">JS</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  JobStalker
                </h1>
                <p className="text-sm text-slate-500 font-medium">Professional Job Tracking Platform</p>
              </div>
            </div>
            <nav className="flex items-center space-x-8">
              <a href="#" className="text-blue-700 font-semibold relative group">
                Jobs
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a 
                href="/statistics" 
                className="text-slate-600 hover:text-blue-700 transition-colors font-medium relative group"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/statistics');
                }}
              >
                Statistics
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
  
              <a 
                href="/resume-builder" 
                className="text-slate-600 hover:text-blue-700 transition-colors font-medium relative group"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/resume-builder');
                }}
              >
                AI Resume Builder
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <div className="relative group">
                <a href="#" className="text-slate-600 hover:text-blue-700 transition-colors font-medium relative group">
                  Profile
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
                {user && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="flex items-center space-x-3 mb-3">
                      {user.user_metadata?.avatar_url ? (
                        <img 
                          src={user.user_metadata.avatar_url} 
                          alt="Profile" 
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-900">
                          {user.user_metadata?.full_name || user.user_metadata?.name || user.email}
                        </div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </div>
                    {user.user_metadata?.provider === 'github' && (
                      <div className="text-xs text-slate-500 mb-2">
                        Signed in with GitHub
                      </div>
                    )}
                    <div className="text-xs text-slate-400">
                      User ID: {user.id}
                    </div>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="w-full px-8 py-12 space-y-10">
        {/* Professional Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className={`${getStatusColor('Bookmarked')} rounded-lg p-6 border hover:shadow-md transition-all duration-200`}>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-blue-900">{getStatusCount('Bookmarked')}</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-blue-700">Bookmarked</div>
            </div>
          </div>
          <div className={`${getStatusColor('Applying')} rounded-lg p-6 border hover:shadow-md transition-all duration-200`}>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-indigo-900">{getStatusCount('Applying')}</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-indigo-700">Applying</div>
            </div>
          </div>
          <div className={`${getStatusColor('Applied')} rounded-lg p-6 border hover:shadow-md transition-all duration-200`}>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-purple-900">{getStatusCount('Applied')}</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-purple-700">Applied</div>
            </div>
          </div>
          <div className={`${getStatusColor('Interviewing')} rounded-lg p-6 border hover:shadow-md transition-all duration-200`}>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-orange-900">{getStatusCount('Interviewing')}</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-orange-700">Interviewing</div>
            </div>
          </div>
          <div className={`${getStatusColor('Accepted')} rounded-lg p-6 border hover:shadow-md transition-all duration-200`}>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-green-900">{getStatusCount('Accepted')}</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-green-700">Accepted</div>
            </div>
          </div>
        </div>

        {/* Professional Control Bar */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <Checkbox 
                  id="select-all" 
                  className="rounded border-2"
                  checked={selectedJobs.length === jobs.length && jobs.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-semibold text-slate-700">
                  {selectedJobs.length} selected
                </label>
                {selectedJobs.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="ml-4 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                )}
              </div>
              
              {/* Filter Dropdown */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-slate-600">Filter by:</span>
                <Select
                  value={filterBy || 'none'}
                  onValueChange={(value) => handleFilterChange(value === 'none' ? null : value as 'company' | 'job_title', filterValue)}
                >
                  <SelectTrigger className="w-36 border-slate-200 bg-white">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="job_title">Job Title</SelectItem>
                  </SelectContent>
                </Select>
                {filterBy && (
                  <input
                    type="text"
                    placeholder="Enter value..."
                    value={filterValue}
                    onChange={(e) => handleFilterChange(filterBy, e.target.value)}
                    className="px-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`${viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'} rounded-md font-medium`}
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className={`${viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'} rounded-md font-medium`}
                >
                  Kanban
                </Button>
              </div>
              
              {/* Add Job Button */}
              <Button 
                onClick={handleAddJob}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg px-6 py-3"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Job
              </Button>
            </div>
          </div>
        </div>

        {/* Job List or Kanban Board */}
        {viewMode === 'list' ? (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Selection
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-3">
                        <span>Job Title</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('job_title')}
                          className="h-6 w-6 p-0 hover:bg-blue-100 rounded"
                        >
                          {sortBy === 'job_title' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-blue-600" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-3">
                        <span>Company</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('company')}
                          className="h-6 w-6 p-0 hover:bg-indigo-100 rounded"
                        >
                          {sortBy === 'company' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-indigo-600" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-indigo-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Salary
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Date Saved
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Date Applied
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Excitement
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getFilteredAndSortedJobs().length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-8 py-16 text-center">
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0012 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No jobs yet</h3>
                            <p className="text-slate-500 text-base mb-4 max-w-md mx-auto">
                              Start tracking your job applications by adding your first job
                            </p>
                            <Button 
                              onClick={handleAddJob}
                              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg px-6 py-3"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Your First Job
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    getFilteredAndSortedJobs().map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50 transition-colors duration-200">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <Checkbox 
                              className="rounded border-2"
                              checked={selectedJobs.includes(job.id)}
                              onCheckedChange={(checked) => handleJobSelection(job.id, checked as boolean)}
                            />
                            <MoreHorizontal className="w-4 h-4 text-slate-400 hover:text-blue-600 cursor-pointer transition-colors" />
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {job.job_title}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-800">{job.company}</div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-900 bg-slate-100 px-3 py-1 rounded-md">
                            {job.salary || 'N/A'}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-900 bg-slate-100 px-3 py-1 rounded-md">
                            {job.location || 'N/A'}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <Select
                            value={job.status}
                            onValueChange={(value) => handleStatusUpdate(job.id, value as 'Bookmarked' | 'Applying' | 'Applied' | 'Interviewing' | 'Accepted')}
                            disabled={updatingJobId === job.id}
                          >
                            <SelectTrigger className={`w-auto border-0 p-0 h-auto ${getStatusBadgeColor(job.status)} rounded-md px-3 py-1 font-semibold text-sm hover:opacity-80 transition-opacity`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bookmarked">Bookmarked</SelectItem>
                              <SelectItem value="Applying">Applying</SelectItem>
                              <SelectItem value="Applied">Applied</SelectItem>
                              <SelectItem value="Interviewing">Interviewing</SelectItem>
                              <SelectItem value="Accepted">Accepted</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm font-semibold text-slate-600">
                          {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm font-semibold text-slate-600">
                          {job.deadline || 'N/A'}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm font-semibold text-slate-600">
                          {job.date_applied || 'N/A'}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleStarRatingUpdate(job.id, star)}
                                disabled={updatingJobId === job.id}
                                className={`p-1 rounded transition-colors ${
                                  star <= (job.excitement_level || 0)
                                    ? 'text-amber-400 hover:text-amber-500'
                                    : 'text-slate-300 hover:text-slate-400'
                                } ${updatingJobId === job.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <Star className={`w-4 h-4 ${star <= (job.excitement_level || 0) ? 'fill-current' : ''}`} />
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditJob(job)}
                              className="h-8 w-8 p-0 hover:bg-blue-100 rounded"
                            >
                              <Edit className="h-3 w-3 text-blue-600 hover:text-blue-700" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleJobDelete(job)}
                              className="h-8 w-8 p-0 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="h-3 w-3 text-red-600 hover:text-red-700" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            {getFilteredAndSortedJobs().length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0012 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No jobs yet</h3>
                    <p className="text-slate-500 text-base mb-4 max-w-md mx-auto">
                      Start tracking your job applications by adding your first job
                    </p>
                    <Button 
                      onClick={handleAddJob}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg px-6 py-3"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Job
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <KanbanBoard
                  jobs={getFilteredAndSortedJobs()}
                  onStatusUpdate={handleStatusUpdate}
                  onEditJob={handleEditJob}
                  onDeleteJob={handleJobDelete}
                  onStarRatingUpdate={handleStarRatingUpdate}
                  updatingJobId={updatingJobId}
                />
              </div>
            )}
          </div>
        )}
       </div>

       {/* Job Modal */}
       <JobModal
         isOpen={isJobModalOpen}
         onClose={() => setIsJobModalOpen(false)}
         onJobSaved={handleJobSaved}
         jobToEdit={jobToEdit}
         mode={modalMode}
       />

       {/* Single Job Delete Confirmation Dialog */}
       <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>Delete Job</DialogTitle>
             <DialogDescription>
               Are you sure you want to delete "{jobToDelete?.job_title}" at {jobToDelete?.company}? This action cannot be undone.
             </DialogDescription>
           </DialogHeader>
           <div className="flex justify-end space-x-2 pt-4">
             <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
               Cancel
             </Button>
             <Button variant="destructive" onClick={confirmJobDelete}>
               Delete Job
             </Button>
           </div>
         </DialogContent>
       </Dialog>

       {/* Bulk Delete Confirmation Dialog */}
       <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>Delete Selected Jobs</DialogTitle>
             <DialogDescription>
               Are you sure you want to delete {selectedJobs.length} selected job{selectedJobs.length > 1 ? 's' : ''}? This action cannot be undone.
             </DialogDescription>
           </DialogHeader>
           <div className="flex justify-end space-x-2 pt-4">
             <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
               Cancel
             </Button>
             <Button variant="destructive" onClick={confirmBulkDelete}>
               Delete {selectedJobs.length} Job{selectedJobs.length > 1 ? 's' : ''}
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 } 