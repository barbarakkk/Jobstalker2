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
      // Delete all selected jobs
      await Promise.all(selectedJobs.map(jobId => jobApi.deleteJob(jobId)));
      setJobs(prevJobs => prevJobs.filter(job => !selectedJobs.includes(job.id)));
      setSelectedJobs([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete jobs');
    } finally {
      setIsBulkDeleteDialogOpen(false);
    }
  };

  // Handle inline status update
  const handleStatusUpdate = async (jobId: string, newStatus: 'Bookmarked' | 'Applying' | 'Applied' | 'Interviewing' | 'Accepted') => {
    setUpdatingJobId(jobId);
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      const updatedJob = await jobApi.updateJob(jobId, { status: newStatus });
      setJobs(prevJobs => 
        prevJobs.map(job => job.id === jobId ? updatedJob : job)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job status');
    } finally {
      setUpdatingJobId(null);
    }
  };

  // Handle individual job selection
  const handleJobSelection = (jobId: string, checked: boolean) => {
    if (checked) {
      setSelectedJobs(prev => [...prev, jobId]);
    } else {
      setSelectedJobs(prev => prev.filter(id => id !== jobId));
    }
  };

  // Handle select all jobs
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
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set to ascending
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Handle filter change
  const handleFilterChange = (filterType: 'company' | 'job_title' | null, value: string) => {
    setFilterBy(filterType);
    setFilterValue(value);
  };

  // Handle inline star rating update
  const handleStarRatingUpdate = async (jobId: string, newRating: number) => {
    setUpdatingJobId(jobId);
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      const updatedJob = await jobApi.updateJob(jobId, { excitement_level: newRating });
      setJobs(prevJobs => 
        prevJobs.map(job => job.id === jobId ? updatedJob : job)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update star rating');
    } finally {
      setUpdatingJobId(null);
    }
  };

  // Get filtered and sorted jobs
  const getFilteredAndSortedJobs = () => {
    let filteredJobs = [...jobs];

    // Apply text filter
    if (filterBy && filterValue.trim()) {
      filteredJobs = filteredJobs.filter(job => {
        const fieldValue = job[filterBy]?.toLowerCase() || '';
        return fieldValue.includes(filterValue.toLowerCase());
      });
    }

    // Apply sorting
    if (sortBy) {
      filteredJobs.sort((a, b) => {
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

  // Handle add new job
  const handleAddJob = () => {
    setModalMode('add');
    setJobToEdit(null);
    setIsJobModalOpen(true);
  };

  // Handle job saved from modal (add or edit)
  const handleJobSaved = (savedJob: Job) => {
    console.log('Job saved to dashboard:', savedJob);
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

  // Handle edit job
  const handleEditJob = (job: Job) => {
    setJobToEdit(job);
    setModalMode('edit');
    setIsJobModalOpen(true);
  };

    // Handle sign out
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const getStatusCount = (status: string) => {
    return jobs.filter(job => job.status === status).length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Bookmarked': return 'bg-[var(--status-bookmarked-bg)] text-[var(--status-bookmarked-text)] border-[var(--status-bookmarked-text)]/20';
      case 'Applied': return 'bg-[var(--status-applied-bg)] text-[var(--status-applied-text)] border-[var(--status-applied-text)]/20';
      case 'Interviewing': return 'bg-[var(--status-interviewing-bg)] text-[var(--status-interviewing-text)] border-[var(--status-interviewing-text)]/20';
      case 'Accepted': return 'bg-[var(--status-accepted-bg)] text-[var(--status-accepted-text)] border-[var(--status-accepted-text)]/20';
      case 'Applying': return 'bg-[var(--status-applying-bg)] text-[var(--status-applying-text)] border-[var(--status-applying-text)]/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Bookmarked': return 'bg-[var(--status-bookmarked-text)] text-[var(--status-bookmarked-bg)]';
      case 'Applied': return 'bg-[var(--status-applied-text)] text-[var(--status-applied-bg)]';
      case 'Interviewing': return 'bg-[var(--status-interviewing-text)] text-[var(--status-interviewing-bg)]';
      case 'Accepted': return 'bg-[var(--status-accepted-text)] text-[var(--status-accepted-bg)]';
      case 'Applying': return 'bg-[var(--status-applying-text)] text-[var(--status-applying-bg)]';
      default: return 'bg-muted text-muted-foreground';
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

  // Enhanced loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-50">
          <div className="w-full px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">JS</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">JobStalker</h1>
                  <p className="text-sm text-muted-foreground font-medium">Job Tracking Made Simple</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex justify-center items-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground font-medium">Loading your jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error state with retry functionality
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-50">
          <div className="w-full px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">JS</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">JobStalker</h1>
                  <p className="text-sm text-muted-foreground font-medium">Job Tracking Made Simple</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex justify-center items-center h-64">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Failed to load jobs</h3>
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button 
              onClick={loadJobs} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Retrying...' : 'Try Again'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-50">
        <div className="w-full px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">JS</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  JobStalker
                </h1>
                <p className="text-sm text-muted-foreground font-medium">Job Tracking Made Simple</p>
              </div>
            </div>
            <nav className="flex items-center space-x-8">
              <a href="#" className="text-blue-600 font-semibold relative group">
                Jobs
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
              </a>
              <a 
                href="/statistics" 
                className="text-muted-foreground hover:text-blue-600 transition-colors font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/statistics');
                }}
              >
                Statistics
              </a>
              <a href="#" className="text-muted-foreground hover:text-blue-600 transition-colors font-medium">Job Matcher</a>
              <a 
                href="/resume-builder" 
                className="text-muted-foreground hover:text-blue-600 transition-colors font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/resume-builder');
                }}
              >
                AI Resume Builder
              </a>
              <a href="#" className="text-muted-foreground hover:text-blue-600 transition-colors font-medium">Profile</a>
              <Button 
                variant="destructive" 
                size="sm" 
                className="shadow-md hover:shadow-lg transition-shadow"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="w-full px-6 py-8 space-y-8">
        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                          <div className={`${getStatusColor('Bookmarked')} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border`}>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">{getStatusCount('Bookmarked')}</div>
                    <div className="text-sm font-semibold uppercase tracking-wide">Bookmarked</div>
                  </div>
                </div>
                <div className={`${getStatusColor('Applying')} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border`}>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">{getStatusCount('Applying')}</div>
                    <div className="text-sm font-semibold uppercase tracking-wide">Applying</div>
                  </div>
                </div>
                <div className={`${getStatusColor('Applied')} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border`}>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">{getStatusCount('Applied')}</div>
                    <div className="text-sm font-semibold uppercase tracking-wide">Applied</div>
                  </div>
                </div>
                <div className={`${getStatusColor('Interviewing')} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border`}>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">{getStatusCount('Interviewing')}</div>
                    <div className="text-sm font-semibold uppercase tracking-wide">Interviewing</div>
                  </div>
                </div>
                                <div className={`${getStatusColor('Accepted')} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border`}>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">{getStatusCount('Accepted')}</div>
                    <div className="text-sm font-semibold uppercase tracking-wide">Accepted</div>
                  </div>
                </div>
        </div>

        {/* Enhanced Stats Summary */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">{jobs.length}</div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {jobs.filter(job => job.status === 'Accepted').length}
              </div>
              <div className="text-sm text-muted-foreground">Accepted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {jobs.filter(job => job.status === 'Interviewing').length}
              </div>
              <div className="text-sm text-muted-foreground">In Interviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {jobs.filter(job => job.excitement_level && job.excitement_level >= 4).length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="select-all" 
                  className="rounded-md"
                  checked={selectedJobs.length === jobs.length && jobs.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium text-muted-foreground">
                  {selectedJobs.length} selected
                </label>
                {selectedJobs.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="ml-2"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                )}
              </div>
              
              {/* Filter Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
                <Select
                  value={filterBy || 'none'}
                  onValueChange={(value) => handleFilterChange(value === 'none' ? null : value as 'company' | 'job_title', filterValue)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No filter</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="job_title">Job Position</SelectItem>
                  </SelectContent>
                </Select>
                {filterBy && (
                  <input
                    type="text"
                    placeholder={`Enter ${filterBy === 'company' ? 'company name' : 'job position'}...`}
                    value={filterValue}
                    onChange={(e) => handleFilterChange(filterBy, e.target.value)}
                    className="px-3 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
                {filterValue && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange(null, '')}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadJobs}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <div className="flex bg-muted rounded-xl p-1 shadow-inner">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg transition-all ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'hover:bg-blue-50'
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
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'hover:bg-blue-50'
                  }`}
                >
                  Kanban
                </Button>
              </div>
              <Button 
                onClick={handleAddJob}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Job
              </Button>
            </div>
          </div>
        </div>

        {/* Job List or Kanban Board */}
        {viewMode === 'list' ? (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg w-full">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-8 py-6 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <span>Job Title</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('job_title')}
                          className="h-6 w-6 p-0 hover:bg-muted/50"
                        >
                          {sortBy === 'job_title' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <span>Company</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('company')}
                          className="h-6 w-6 p-0 hover:bg-muted/50"
                        >
                          {sortBy === 'company' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Salary
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Date Saved
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Date Applied
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Excitement
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {getFilteredAndSortedJobs().length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-8 py-16 text-center">
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0012 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">No jobs yet</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                              Start tracking your job applications by adding your first job
                            </p>
                            <Button 
                              onClick={handleAddJob}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
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
                      <tr key={job.id} className="hover:bg-muted/20 transition-colors duration-200">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <Checkbox 
                              className="rounded-md"
                              checked={selectedJobs.includes(job.id)}
                              onCheckedChange={(checked) => handleJobSelection(job.id, checked as boolean)}
                            />
                            <MoreHorizontal className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
                            <Button variant="ghost" size="sm" className="text-sm hover:bg-muted/50 rounded-lg">
                              Notes (0)
                            </Button>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-base font-semibold text-foreground">{job.job_title}</div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">{job.company}</div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-sm font-medium text-foreground bg-muted/50 px-4 py-2 rounded-lg">
                            {job.salary || 'N/A'}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-sm font-medium text-foreground bg-muted/50 px-4 py-2 rounded-lg">
                            {job.location || 'N/A'}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <Select
                            value={job.status}
                            onValueChange={(value) => handleStatusUpdate(job.id, value as 'Bookmarked' | 'Applying' | 'Applied' | 'Interviewing' | 'Accepted')}
                            disabled={updatingJobId === job.id}
                          >
                            <SelectTrigger className={`w-auto border-0 p-0 h-auto ${getStatusBadgeColor(job.status)} rounded-lg px-4 py-2 font-medium text-sm shadow-sm hover:opacity-80 transition-opacity`}>
                              <SelectValue />
                              <ChevronDown className="w-4 h-4 ml-2" />
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
                        <td className="px-8 py-6 whitespace-nowrap text-sm font-medium text-muted-foreground">
                          {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm font-medium text-muted-foreground">
                          {job.deadline || 'N/A'}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm font-medium text-muted-foreground">
                          {job.date_applied || 'N/A'}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => handleStarRatingUpdate(job.id, star)}
                                  disabled={updatingJobId === job.id}
                                  className={`p-1 rounded transition-colors ${
                                    star <= (job.excitement_level || 0)
                                      ? 'text-yellow-500 hover:text-yellow-600'
                                      : 'text-gray-300 hover:text-gray-400'
                                  } ${updatingJobId === job.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <Star className={`w-4 h-4 ${star <= (job.excitement_level || 0) ? 'fill-current' : ''}`} />
                                </button>
                              ))}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditJob(job)}
                                className="h-9 w-9 p-0 hover:bg-muted/50 rounded-lg"
                              >
                                <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleJobDelete(job)}
                                className="h-9 w-9 p-0 hover:bg-destructive/10 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
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
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-lg w-full">
            {getFilteredAndSortedJobs().length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0012 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No jobs yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Start tracking your job applications by adding your first job
                    </p>
                    <Button 
                      onClick={handleAddJob}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
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