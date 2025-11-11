import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Star, MoreHorizontal, Plus, Edit, Trash2, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Grid, Maximize2, FileText } from 'lucide-react';
import { Job } from '@/lib/types';
import { jobApi } from '@/lib/api';
import { JobModal } from '@/components/Jobs/AddJobModal';
import { KanbanBoard } from './KanbanBoard';
import { FullScreenKanban } from './FullScreenKanban';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import ColoredLogoHorizontal from '@/assets/ColoredLogoHorizontal.svg';


interface DashboardProps {
  // Add props as needed
}

export function Dashboard({ }: DashboardProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isFullScreenKanban, setIsFullScreenKanban] = useState(false);
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
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [showNewJobNotification, setShowNewJobNotification] = useState(false);
  const [newJobCount, setNewJobCount] = useState(0);
  const navigate = useNavigate();

  // Use ref to track if we're currently loading to prevent duplicate calls
  const isLoadingRef = useRef(false);
  
  // Load jobs from API - memoized to prevent unnecessary re-renders
  const loadJobs = useCallback(async () => {
    // Prevent duplicate concurrent calls
    if (isLoadingRef.current) {
      console.log('loadJobs: Already loading, skipping duplicate call');
      return;
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const jobsData = await jobApi.getJobs();
      
      // Use functional update to safely compare counts and update state
      setJobs(prevJobs => {
        const previousJobCount = prevJobs.length;
        setLastRefreshTime(new Date());
        
        // Show notification if new jobs were added
        if (jobsData.length > previousJobCount && previousJobCount > 0) {
          const newJobs = jobsData.length - previousJobCount;
          setNewJobCount(newJobs);
          setShowNewJobNotification(true);
          
          // Hide notification after 3 seconds
          setTimeout(() => {
            setShowNewJobNotification(false);
          }, 3000);
        }
        
        return jobsData;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []); // Empty deps - function never changes

  useEffect(() => {
    // Only load jobs once on mount - no dependencies to prevent re-runs
    loadJobs();
    
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount


  // Realtime: COMPLETELY DISABLED to prevent auto-refreshes
  // Users can manually refresh using the refresh button
  // This prevents annoying automatic page refreshes
  useEffect(() => {
    // Realtime subscription is completely disabled
    // No auto-refresh - users must click the refresh button manually
    // This ensures a smooth, non-interruptive experience
    
    // If you need realtime updates in the future, uncomment below and use debouncing:
    // const enableRealtime = import.meta.env.MODE !== 'production' || import.meta.env.VITE_ENABLE_REALTIME === 'true';
    // if (enableRealtime && user?.id) {
    //   // Setup realtime subscription with aggressive debouncing
    // }
    
    return () => {
      // No cleanup needed since we're not subscribing
    };
  }, []);


  // Listen for storage changes (when extension saves jobs)
  // COMPLETELY DISABLED auto-refresh - users must manually refresh
  // This prevents annoying automatic refreshes from storage events
  useEffect(() => {
    // Storage event listener is disabled to prevent auto-refreshes
    // Users can manually refresh using the refresh button when needed
    
    // If you need storage events in the future, uncomment below with aggressive debouncing:
    // let debounceTimer: NodeJS.Timeout | null = null;
    // const handleStorageChange = () => {
    //   if (isJobModalOpen) return;
    //   if (debounceTimer) clearTimeout(debounceTimer);
    //   debounceTimer = setTimeout(() => loadJobs(), 5000); // 5 second debounce
    // };
    // window.addEventListener('storage', handleStorageChange);
    // return () => {
    //   if (debounceTimer) clearTimeout(debounceTimer);
    //   window.removeEventListener('storage', handleStorageChange);
    // };
    
    return () => {
      // No cleanup needed since we're not listening
    };
  }, [isJobModalOpen]);

  // Handle job save (create or update)
  const handleJobSave = (savedJob: Job) => {
    setJobs(prevJobs => {
      const existingIndex = prevJobs.findIndex(job => job.id === savedJob.id);
      if (existingIndex >= 0) {
        const updatedJobs = [...prevJobs];
        updatedJobs[existingIndex] = savedJob;
        return updatedJobs;
      } else {
        // Place newly added jobs at the top so they're immediately visible
        return [savedJob, ...prevJobs];
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
    console.log('Updating job status:', { jobId, newStatus });
    setUpdatingJobId(jobId);
    try {
      const updateData = { status: newStatus as 'Bookmarked' | 'Applying' | 'Applied' | 'Interviewing' | 'Accepted' };
      const updatedJob = await jobApi.updateJob(jobId, updateData);
      console.log('Job updated successfully:', updatedJob);
      setJobs(prevJobs => prevJobs.map(job => job.id === jobId ? updatedJob : job));
    } catch (err) {
      console.error('Error updating job status:', err);
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

    if (filterBy && filterValue) {
      filteredJobs = filteredJobs.filter(job => {
        const fieldValue = (job as any)[filterBy]?.toLowerCase() || '';
        return fieldValue.includes(filterValue.toLowerCase());
      });
    }

    if (sortBy) {
      filteredJobs = [...filteredJobs].sort((a, b) => {
        const aValue = (a as any)[sortBy]?.toLowerCase() || '';
        const bValue = (b as any)[sortBy]?.toLowerCase() || '';
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      });
    }

    return filteredJobs;
  };

  const handleAddJob = () => {
    setModalMode('add');
    setJobToEdit(null);
    setIsJobModalOpen(true);
  };

  const handleJobSaved = async (savedJob: Job) => {
    handleJobSave(savedJob);
    setIsJobModalOpen(false);
    // Clear active filters so the new job is visible without a hard refresh
    setFilterBy(null);
    setFilterValue('');
    // Ensure the latest data from backend is reflected immediately
    await loadJobs();
  };

  const handleEditJob = (job: Job) => {
    setModalMode('edit');
    setJobToEdit(job);
    setIsJobModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      setJobs([]);
      setSelectedJobs([]);
      setUser(null);
      setError(null);
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getStatusCount = (status: string) => jobs.filter(job => job.status === status).length;

  // Status color helpers matching the screenshot design
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Bookmarked': return 'bg-white border-gray-200 text-gray-900';
      case 'Applying': return 'bg-yellow-100 border-yellow-200 text-yellow-900';
      case 'Applied': return 'bg-blue-100 border-blue-200 text-blue-900';
      case 'Interviewing': return 'bg-purple-100 border-purple-200 text-purple-900';
      case 'Accepted': return 'bg-green-100 border-green-200 text-green-900';
      default: return 'bg-gray-100 border-gray-200 text-gray-900';
    }
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-lg sticky top-0 z-50">
          <div className="w-full py-6">
            <div className="flex justify-between items-center px-4">
              <div className="flex items-center">
                <img 
                  src={ColoredLogoHorizontal} 
                  alt="JobStalker" 
                  className="h-8 w-auto"
                />
              </div>
            </div>
          </div>
        </header>
        <div className="flex justify-center items-center h-96">
          <div className="text-center space-y-6">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto shadow-lg"></div>
            <div>
              <p className="text-gray-600 font-semibold text-lg">Loading your jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show full error state if we have no jobs and it's a critical error
  if (error && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-lg sticky top-0 z-50">
          <div className="w-full py-6">
            <div className="flex justify-between items-center px-4">
              <div className="flex items-center">
                <img 
                  src={ColoredLogoHorizontal} 
                  alt="JobStalker" 
                  className="h-8 w-auto"
                />
              </div>
            </div>
          </div>
        </header>
        <div className="flex justify-center items-center h-96">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto border border-red-200 shadow-lg">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Failed to load jobs</h3>
              <p className="text-gray-600 text-lg mb-6">{error}</p>
              <Button onClick={loadJobs} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl px-8 py-4 text-lg transition-all duration-200" disabled={loading}>
                {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>Retrying...</>) : ('Try Again')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Full Screen Kanban */}
      {isFullScreenKanban && (
        <FullScreenKanban
          jobs={getFilteredAndSortedJobs()}
          onStatusUpdate={handleStatusUpdate}
          onEditJob={handleEditJob}
          onDeleteJob={handleJobDelete}
          onStarRatingUpdate={handleStarRatingUpdate}
          updatingJobId={updatingJobId}
          onClose={() => setIsFullScreenKanban(false)}
        />
      )}
      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-lg sticky top-0 z-50">
        <div className="w-full py-6">
          <div className="flex items-center px-4 relative">
            <div className="flex items-center">
              <img 
                src={ColoredLogoHorizontal} 
                alt="JobStalker" 
                className="h-8 w-auto"
              />
            </div>
            <nav className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center space-x-8">
              <a href="#" className="text-blue-600 font-semibold px-4 py-2 rounded-full bg-blue-50">Jobs</a>
              <a href="/resume-builder" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium px-4 py-2 rounded-full" onClick={(e) => { e.preventDefault(); navigate('/resume-builder/wizard'); }}>
                Resume Builder
              </a>
              <a href="/statistics" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium px-4 py-2 rounded-full" onClick={(e) => { e.preventDefault(); navigate('/statistics'); }}>
                Statistics
              </a>
              <a href="/profile" className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium px-4 py-2 rounded-full" onClick={(e) => { e.preventDefault(); navigate('/profile'); }}>
                Profile
              </a>
            </nav>
            <div className="ml-auto pr-2">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden px-4 pb-4 -mt-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button className="px-3 py-1.5 text-sm rounded-full bg-blue-50 text-blue-600 font-semibold whitespace-nowrap">Jobs</button>
            <button onClick={() => navigate('/resume-builder/wizard')} className="px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">Resume Builder</button>
            <button onClick={() => navigate('/statistics')} className="px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">Statistics</button>
            <button onClick={() => navigate('/profile')} className="px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">Profile</button>
          </div>
        </div>
      </header>

      {/* New Job Notification */}
      {showNewJobNotification && (
        <div className="fixed top-20 right-8 z-50 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center space-x-3 animate-slide-in backdrop-blur-sm">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="font-semibold">
            {newJobCount} new job{newJobCount > 1 ? 's' : ''} added!
          </span>
          <button 
            onClick={() => setShowNewJobNotification(false)}
            className="text-white hover:text-gray-200 ml-2 w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center transition-all duration-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && jobs.length > 0 && (
        <div className="fixed top-20 left-8 right-8 z-50 bg-red-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center space-x-3 animate-slide-in backdrop-blur-sm">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="font-semibold">
            Error: {error}
          </span>
          <button 
            onClick={() => setError(null)}
            className="text-white hover:text-gray-200 ml-2 w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center transition-all duration-200"
          >
            ×
          </button>
        </div>
      )}

      <div className="w-full px-4 md:px-8 py-6 md:py-12 space-y-6 md:space-y-10">
        {/* Status Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{getStatusCount('Bookmarked')}</div>
              <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-600 group-hover:text-gray-900 transition-colors duration-300">Bookmarked</div>
            </div>
          </div>
          <div className="bg-yellow-100 border border-yellow-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-yellow-800 group-hover:text-yellow-900 transition-colors duration-300">{getStatusCount('Applying')}</div>
              <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-yellow-700 group-hover:text-yellow-800 transition-colors duration-300">Applying</div>
            </div>
          </div>
          <div className="bg-blue-100 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-blue-800 group-hover:text-blue-900 transition-colors duration-300">{getStatusCount('Applied')}</div>
              <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-700 group-hover:text-blue-800 transition-colors duration-300">Applied</div>
            </div>
          </div>
          <div className="bg-purple-100 border border-purple-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-purple-800 group-hover:text-purple-900 transition-colors duration-300">{getStatusCount('Interviewing')}</div>
              <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-purple-700 group-hover:text-purple-800 transition-colors duration-300">Interviewing</div>
            </div>
          </div>
          <div className="bg-green-100 border border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-green-800 group-hover:text-green-900 transition-colors duration-300">{getStatusCount('Accepted')}</div>
              <div className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-green-700 group-hover:text-green-800 transition-colors duration-300">Accepted</div>
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/50 p-3 sm:p-4 md:p-8 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 sm:gap-4">
            <div className="flex items-center flex-wrap gap-2 sm:gap-4 md:space-x-8">
              <div className="flex items-center space-x-4">
                <Checkbox id="select-all" className="rounded-full border-2" checked={selectedJobs.length === jobs.length && jobs.length > 0} onCheckedChange={handleSelectAll} />
                <label htmlFor="select-all" className="text-sm font-semibold text-gray-900">{selectedJobs.length} selected</label>
                {selectedJobs.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleBulkDelete} className="ml-4 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm font-semibold text-gray-600">Filter by:</span>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <Select value={filterBy || 'none'} onValueChange={(value) => handleFilterChange(value === 'none' ? null : value as 'company' | 'job_title', filterValue)}>
                    <SelectTrigger className="w-full sm:w-36 md:w-40 border-gray-300 bg-white rounded-full shadow-sm">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-2xl">
                      <SelectItem value="none" className="rounded-lg">All</SelectItem>
                      <SelectItem value="company" className="rounded-lg">Company</SelectItem>
                      <SelectItem value="job_title" className="rounded-lg">Job Title</SelectItem>
                    </SelectContent>
                  </Select>
                  {filterBy && (
                    <input
                      type="text"
                      placeholder="Enter value..."
                      value={filterValue}
                      onChange={(e) => handleFilterChange(filterBy, e.target.value)}
                      className="w-full sm:w-auto px-3 md:px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 shadow-sm"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 md:space-x-6">
              <div className="flex items-center justify-between sm:justify-start gap-2 sm:space-x-4">
                <Button 
                  onClick={loadJobs} 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 shadow-sm flex-1 sm:flex-none"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 md:px-3 py-1 rounded-full whitespace-nowrap">
                  <span className="hidden sm:inline">Last updated: </span>{lastRefreshTime.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-1 bg-gray-100 rounded-full p-1 shadow-sm">
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('list')} 
                  className={`${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'} font-medium`}
                >
                  List
                </Button>
                <Button 
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('kanban')} 
                  className={`${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'} font-medium`}
                >
                  <Grid className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Kanban</span>
                </Button>
              </div>
              <Button onClick={handleAddJob} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl px-4 sm:px-5 md:px-8 py-3 transition-all duration-200 w-full sm:w-auto">
                <Plus className="w-5 h-5 mr-2" />
                Add Job
              </Button>
            </div>
          </div>
        </div>

        {/* Job List or Kanban Board */}
        {viewMode === 'list' ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-200/50 overflow-hidden shadow-lg">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[800px] text-xs md:text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-2 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 text-left font-bold text-gray-900 uppercase tracking-wider text-xs sm:text-sm">Select</th>
                    <th className="px-2 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 text-left font-bold text-gray-900 uppercase tracking-wider text-xs sm:text-sm">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <span>Job Title</span>
                        <Button variant="ghost" size="sm" onClick={() => handleSort('job_title')} className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-gray-200 rounded-full">
                          {sortBy === 'job_title' ? (sortDirection === 'asc' ? (<ArrowUp className="w-3 h-3 text-blue-600" />) : (<ArrowDown className="w-3 h-3 text-blue-600" />)) : (<ArrowUpDown className="w-3 h-3 text-gray-500" />)}
                        </Button>
                      </div>
                    </th>
                    <th className="px-2 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 text-left font-bold text-gray-900 uppercase tracking-wider text-xs sm:text-sm">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <span>Company</span>
                        <Button variant="ghost" size="sm" onClick={() => handleSort('company')} className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-gray-200 rounded-full">
                          {sortBy === 'company' ? (sortDirection === 'asc' ? (<ArrowUp className="w-3 h-3 text-blue-600" />) : (<ArrowDown className="w-3 h-3 text-blue-600" />)) : (<ArrowUpDown className="w-3 h-3 text-gray-500" />)}
                        </Button>
                      </div>
                    </th>
                    <th className="px-2 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 text-left font-bold text-gray-900 uppercase tracking-wider text-xs sm:text-sm hidden sm:table-cell">Salary</th>
                    <th className="px-2 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 text-left font-bold text-gray-900 uppercase tracking-wider text-xs sm:text-sm hidden md:table-cell">Location</th>
                    <th className="px-2 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 text-left font-bold text-gray-900 uppercase tracking-wider text-xs sm:text-sm">Status</th>
                    <th className="px-2 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 text-left font-bold text-gray-900 uppercase tracking-wider text-xs sm:text-sm hidden lg:table-cell">Date Saved</th>
                    <th className="px-2 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 text-left font-bold text-gray-900 uppercase tracking-wider text-xs sm:text-sm hidden lg:table-cell">Deadline</th>
                    <th className="px-2 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 text-left font-bold text-gray-900 uppercase tracking-wider text-xs sm:text-sm hidden lg:table-cell">Date Applied</th>
                    <th className="px-2 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 text-left font-bold text-gray-900 uppercase tracking-wider text-xs sm:text-sm hidden md:table-cell">Excitement</th>
                    <th className="px-2 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 text-left font-bold text-gray-900 uppercase tracking-wider text-xs sm:text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getFilteredAndSortedJobs().length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 md:px-8 py-12 md:py-16 text-center">
                        <div className="space-y-6">
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0012 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">No jobs yet</h3>
                            <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">Start tracking your job applications by adding your first job</p>
                            <Button onClick={handleAddJob} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl px-6 md:px-8 py-3 md:py-4 text-base md:text-lg transition-all duration-200">
                              <Plus className="w-5 h-5 mr-2" />
                              Add Your First Job
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    getFilteredAndSortedJobs().map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50/50 transition-all duration-200 group">
                        <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <Checkbox className="rounded-full border-2" checked={selectedJobs.includes(job.id)} onCheckedChange={(checked) => handleJobSelection(job.id, checked as boolean)} />
                            <MoreHorizontal className="w-4 h-4 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" />
                          </div>
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                          {job.job_url ? (
                            <a
                              href={job.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base font-bold text-blue-600 hover:underline focus:underline focus:outline-none group-hover:text-blue-700 transition-colors duration-200"
                              title="Open original job posting in a new tab"
                            >
                              {job.job_title}
                            </a>
                          ) : (
                            <div className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">{job.job_title}</div>
                          )}
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{job.company}</div>
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-4 py-2 rounded-full shadow-sm">{job.salary || 'N/A'}</span>
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-4 py-2 rounded-full shadow-sm">{job.location || 'N/A'}</span>
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                          <Select value={job.status} onValueChange={(value) => handleStatusUpdate(job.id, value as 'Bookmarked' | 'Applying' | 'Applied' | 'Interviewing' | 'Accepted')} disabled={updatingJobId === job.id}>
                            <SelectTrigger className={`w-auto border-0 p-0 h-auto ${getStatusColor(job.status)} rounded-full px-4 py-2 font-semibold text-sm hover:opacity-80 transition-opacity shadow-sm`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-2xl">
                              <SelectItem value="Bookmarked" className="rounded-lg">Bookmarked</SelectItem>
                              <SelectItem value="Applying" className="rounded-lg">Applying</SelectItem>
                              <SelectItem value="Applied" className="rounded-lg">Applied</SelectItem>
                              <SelectItem value="Interviewing" className="rounded-lg">Interviewing</SelectItem>
                              <SelectItem value="Accepted" className="rounded-lg">Accepted</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap text-sm font-semibold text-gray-600">{job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap text-sm font-semibold text-gray-600">{job.deadline || 'N/A'}</td>
                        <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap text-sm font-semibold text-gray-600">{job.date_applied || 'N/A'}</td>
                        <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleStarRatingUpdate(job.id, star)}
                                disabled={updatingJobId === job.id}
                                className={`p-1 rounded-full transition-all duration-200 ${star <= (job.excitement_level || 0) ? 'text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50' : 'text-gray-300 hover:text-gray-400 hover:bg-gray-100'} ${updatingJobId === job.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <Star className={`w-4 h-4 ${star <= (job.excitement_level || 0) ? 'fill-current' : ''}`} />
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/jobs/${job.id}`)}
                              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                              title="View details"
                            >
                              <FileText className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditJob(job)} className="h-8 w-8 p-0 hover:bg-blue-50 rounded-full">
                              <Edit className="h-3 w-3 text-blue-600 hover:text-blue-700" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleJobDelete(job)} className="h-8 w-8 p-0 hover:bg-red-50 rounded-full">
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden shadow-lg">
            {getFilteredAndSortedJobs().length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0012 15c-3.183 0-6.22-.815-9-2.145M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-9-2.145" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No jobs yet</h3>
                    <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">Start tracking your job applications by adding your first job</p>
                    <Button onClick={handleAddJob} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl px-8 py-4 text-lg transition-all duration-200">
                      <Plus className="w-5 h-5 mr-2" />
                      Add Your First Job
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8">
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
         <DialogContent className="sm:max-w-md bg-white border border-red-200 shadow-xl">
           <DialogHeader className="text-center pb-4">
             <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
               <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
               </svg>
             </div>
             <DialogTitle className="text-xl font-semibold text-gray-900">Delete Job</DialogTitle>
             <DialogDescription className="text-gray-600 text-base leading-relaxed">
               Are you sure you want to delete <span className="font-semibold text-gray-900">"{jobToDelete?.job_title}"</span> at <span className="font-semibold text-gray-900">{jobToDelete?.company}</span>? 
               <br /><br />
               <span className="text-red-600 font-medium">This action cannot be undone.</span>
             </DialogDescription>
           </DialogHeader>
           <div className="flex justify-end space-x-3 pt-2">
             <Button 
               variant="outline" 
               onClick={() => setIsDeleteDialogOpen(false)}
               className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
             >
               Cancel
             </Button>
             <Button 
               variant="destructive" 
               onClick={confirmJobDelete}
               className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
             >
               Delete Job
             </Button>
           </div>
         </DialogContent>
       </Dialog>

       {/* Bulk Delete Confirmation Dialog */}
       <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
         <DialogContent className="sm:max-w-md bg-white border border-red-200 shadow-xl">
           <DialogHeader className="text-center pb-4">
             <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
               <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
               </svg>
             </div>
             <DialogTitle className="text-xl font-semibold text-gray-900">Delete Selected Jobs</DialogTitle>
             <DialogDescription className="text-gray-600 text-base leading-relaxed">
               Are you sure you want to delete <span className="font-semibold text-gray-900">{selectedJobs.length} selected job{selectedJobs.length > 1 ? 's' : ''}</span>?
               <br /><br />
               <span className="text-red-600 font-medium">This action cannot be undone.</span>
             </DialogDescription>
           </DialogHeader>
           <div className="flex justify-end space-x-3 pt-2">
             <Button 
               variant="outline" 
               onClick={() => setIsBulkDeleteDialogOpen(false)}
               className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
             >
               Cancel
             </Button>
             <Button 
               variant="destructive" 
               onClick={confirmBulkDelete}
               className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
             >
               Delete {selectedJobs.length} Job{selectedJobs.length > 1 ? 's' : ''}
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     </div>
  );
} 