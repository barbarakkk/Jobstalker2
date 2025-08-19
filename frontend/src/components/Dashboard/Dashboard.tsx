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
import { ThemeToggle } from '@/components/ui/theme-toggle';

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
    console.log(`=== STATUS UPDATE DEBUG ===`);
    console.log(`Updating job ${jobId} to status: ${newStatus}`);
    console.log(`Current jobs:`, jobs);
    
    setUpdatingJobId(jobId);
    try {
      const updateData = { status: newStatus as 'Bookmarked' | 'Applying' | 'Applied' | 'Interviewing' | 'Accepted' };
      console.log(`Sending update data:`, updateData);
      
      const updatedJob = await jobApi.updateJob(jobId, updateData);
      console.log(`Received updated job:`, updatedJob);
      
      setJobs(prevJobs => {
        const newJobs = prevJobs.map(job => job.id === jobId ? updatedJob : job);
        console.log(`Updated jobs state:`, newJobs);
        return newJobs;
      });
      
      console.log(`Status update successful`);
    } catch (err) {
      console.error(`Status update failed:`, err);
      setError(err instanceof Error ? err.message : 'Failed to update job status');
    } finally {
      setUpdatingJobId(null);
      console.log(`=== END STATUS UPDATE DEBUG ===`);
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
      // Clear local state
      setJobs([]);
      setSelectedJobs([]);
      setUser(null);
      setError(null);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get status count
  const getStatusCount = (status: string) => {
    return jobs.filter(job => job.status === status).length;
  };

  // Get status color - Theme-aware status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Bookmarked': return 'status-badge status-bookmarked';
      case 'Applied': return 'status-badge status-applied';
      case 'Interviewing': return 'status-badge status-interviewing';
      case 'Accepted': return 'status-badge status-accepted';
      case 'Applying': return 'status-badge status-applying';
      default: return 'status-badge bg-muted text-muted-foreground border-border';
    }
  };

  // Get status badge color - Theme-aware status colors
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Bookmarked': return 'status-badge status-bookmarked';
      case 'Applied': return 'status-badge status-applied';
      case 'Interviewing': return 'status-badge status-interviewing';
      case 'Accepted': return 'status-badge status-accepted';
      case 'Applying': return 'status-badge status-applying';
      default: return 'status-badge bg-muted text-muted-foreground border-border';
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
      <div className="min-h-screen bg-background">
        {/* Professional Header */}
        <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
          <div className="w-full px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <img src="/src/assets/ColoredLogoHorizontal.svg" alt="JobStalker" className="h-10" />
                <div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex justify-center items-center h-96">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-primary mx-auto"></div>
            <div>
              <p className="text-muted-foreground font-semibold">Loading your jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error state with retry functionality
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        {/* Professional Header */}
        <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
          <div className="w-full px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <img src="/src/assets/ColoredLogoHorizontal.svg" alt="JobStalker" className="h-10" />
                <div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex justify-center items-center h-96">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto border border-destructive/20">
              <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Failed to load jobs</h3>
              <p className="text-muted-foreground text-base mb-4">{error}</p>
              <Button 
                onClick={loadJobs} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-lg px-6 py-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-primary-foreground border-t-transparent mr-2"></div>
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
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="w-full px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img src="/src/assets/ColoredLogoHorizontal.svg" alt="JobStalker" className="h-10" />
              <div>
              </div>
            </div>
            <nav className="flex items-center space-x-8">
              <a href="#" className="text-primary font-semibold relative group">
                Jobs
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a 
                href="/statistics" 
                className="text-muted-foreground hover:text-primary transition-colors font-medium relative group"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/statistics');
                }}
              >
                Statistics
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
  
              <a 
                href="/resume-builder" 
                className="text-muted-foreground hover:text-primary transition-colors font-medium relative group"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/resume-builder');
                }}
              >
                AI Resume Builder
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <div className="relative group">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium relative group">
                  Profile
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </a>
                {user && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="flex items-center space-x-3 mb-3">
                      {user.user_metadata?.avatar_url ? (
                        <img 
                          src={user.user_metadata.avatar_url} 
                          alt="Profile" 
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground font-bold text-sm">
                            {user.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground">
                          {user.user_metadata?.full_name || user.user_metadata?.name || user.email}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    {user.user_metadata?.provider === 'github' && (
                      <div className="text-xs text-muted-foreground mb-2">
                        Signed in with GitHub
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground/60">
                      User ID: {user.id}
                    </div>
                  </div>
                )}
              </div>
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                className="border-border text-foreground hover:bg-accent hover:border-border/80"
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
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all duration-200">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-primary">{getStatusCount('Bookmarked')}</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Bookmarked</div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all duration-200">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-primary">{getStatusCount('Applying')}</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Applying</div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all duration-200">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-primary">{getStatusCount('Applied')}</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Applied</div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all duration-200">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-primary">{getStatusCount('Interviewing')}</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Interviewing</div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all duration-200">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-primary">{getStatusCount('Accepted')}</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Accepted</div>
            </div>
          </div>
        </div>

        {/* Professional Control Bar */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <Checkbox 
                  id="select-all" 
                  className="rounded border-2"
                  checked={selectedJobs.length === jobs.length && jobs.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-semibold text-foreground">
                  {selectedJobs.length} selected
                </label>
                {selectedJobs.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="ml-4 border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                )}
              </div>
              
              {/* Filter Dropdown */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-semibold text-muted-foreground">Filter by:</span>
                <Select
                  value={filterBy || 'none'}
                  onValueChange={(value) => handleFilterChange(value === 'none' ? null : value as 'company' | 'job_title', filterValue)}
                >
                  <SelectTrigger className="w-36 border-border bg-background">
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
                    className="px-4 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
                  />
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`${viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'} rounded-md font-medium`}
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className={`${viewMode === 'kanban' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'} rounded-md font-medium`}
                >
                  Kanban
                </Button>
              </div>
              
              {/* Add Job Button */}
              <Button 
                onClick={handleAddJob}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-lg px-6 py-3"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Job
              </Button>
            </div>
          </div>
        </div>

        {/* Job List or Kanban Board */}
        {viewMode === 'list' ? (
          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-8 py-6 text-left text-sm font-bold text-foreground uppercase tracking-wider">
                      Selection
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-foreground uppercase tracking-wider">
                      <div className="flex items-center space-x-3">
                        <span>Job Title</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('job_title')}
                          className="h-6 w-6 p-0 hover:bg-accent rounded"
                        >
                          {sortBy === 'job_title' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-primary" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-foreground uppercase tracking-wider">
                      <div className="flex items-center space-x-3">
                        <span>Company</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('company')}
                          className="h-6 w-6 p-0 hover:bg-accent rounded"
                        >
                          {sortBy === 'company' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-primary" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-foreground uppercase tracking-wider">
                      Salary
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-foreground uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-foreground uppercase tracking-wider">
                      Date Saved
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-foreground uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-foreground uppercase tracking-wider">
                      Date Applied
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-foreground uppercase tracking-wider">
                      Excitement
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {getFilteredAndSortedJobs().length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-8 py-16 text-center">
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0012 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No jobs yet</h3>
                            <p className="text-muted-foreground text-base mb-4 max-w-md mx-auto">
                              Start tracking your job applications by adding your first job
                            </p>
                            <Button 
                              onClick={handleAddJob}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-lg px-6 py-3"
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
                      <tr key={job.id} className="hover:bg-muted/50 transition-colors duration-200">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <Checkbox 
                              className="rounded border-2"
                              checked={selectedJobs.includes(job.id)}
                              onCheckedChange={(checked) => handleJobSelection(job.id, checked as boolean)}
                            />
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                            {job.job_title}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-sm font-semibold text-foreground">{job.company}</div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-sm font-semibold text-foreground bg-muted px-3 py-1 rounded-md">
                            {job.salary || 'N/A'}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-sm font-semibold text-foreground bg-muted px-3 py-1 rounded-md">
                            {job.location || 'N/A'}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <Select
                            value={job.status}
                            onValueChange={(value) => handleStatusUpdate(job.id, value as 'Bookmarked' | 'Applying' | 'Applied' | 'Interviewing' | 'Accepted')}
                            disabled={updatingJobId === job.id}
                          >
                            <SelectTrigger className={`w-auto border-0 p-0 h-auto bg-muted text-foreground rounded-md px-3 py-1 font-semibold text-sm hover:opacity-80 transition-opacity`}>
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
                        <td className="px-8 py-6 whitespace-nowrap text-sm font-semibold text-muted-foreground">
                          {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm font-semibold text-muted-foreground">
                          {job.deadline || 'N/A'}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm font-semibold text-muted-foreground">
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
                                    : 'text-muted-foreground hover:text-foreground'
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
                              className="h-8 w-8 p-0 hover:bg-accent rounded"
                            >
                              <Edit className="h-3 w-3 text-primary hover:text-primary/80" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleJobDelete(job)}
                              className="h-8 w-8 p-0 hover:bg-destructive/10 rounded"
                            >
                              <Trash2 className="h-3 w-3 text-destructive hover:text-destructive/80" />
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
          <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            {getFilteredAndSortedJobs().length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0012 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No jobs yet</h3>
                    <p className="text-muted-foreground text-base mb-4 max-w-md mx-auto">
                      Start tracking your job applications by adding your first job
                    </p>
                    <Button 
                      onClick={handleAddJob}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-lg px-6 py-3"
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