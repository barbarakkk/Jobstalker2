import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, User, ArrowRight, Building2, MapPin, DollarSign } from 'lucide-react';
import { JobMatchingPreferencesModal } from './JobMatchingPreferencesModal';
import { AppHeader } from '@/components/Layout/AppHeader';
import { supabase } from '@/lib/supabaseClient';
import { JobMatchingPreferences } from '@/lib/types';
import { apiCall } from '@/lib/api';

export function JobMatcherPage() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleStartMatching = () => {
    setIsProfileModalOpen(true);
  };

  const handleProfileConfirm = async (preferences: JobMatchingPreferences) => {
    setIsProfileModalOpen(false);
    setLoading(true);
    
    try {
      // Preferences are already saved in the modal
      // Now call the search API
      const response = await apiCall<{
        success: boolean;
        jobs: Array<{
          job_id: number;
          job_title: string;
          company: string;
          location: string;
          remote: boolean;
          salary: string;
          url: string;
          match_score: number;
          match_reason: string;
          missing_requirements: string[];
        }>;
        total_found: number;
        matched_count: number;
      }>('/api/ai/job-matcher/search', {
        method: 'POST',
      });
      
      if (response.success && response.jobs) {
        setMatchedJobs(response.jobs);
        console.log(`Found ${response.matched_count} matching jobs out of ${response.total_found} total`);
      } else {
        console.warn('No jobs found');
        setMatchedJobs([]);
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
      alert('Failed to search for jobs. Please try again.');
      setMatchedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8ff]">
      <AppHeader active="jobs" />
      
      <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Find Your Perfect Job Match
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let our AI analyze your profile and match you with the best job opportunities
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Start Matching Card */}
          <Card className="bg-white border border-gray-200 shadow-lg mb-8">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6 mx-auto">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Ready to Find Your Dream Job?
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  We'll use your profile information, skills, and preferences to find the perfect job matches for you
                </p>
                <Button
                  onClick={handleStartMatching}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Start Matching Jobs
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600">Searching for matching jobs...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Matched Jobs Section */}
          {!loading && matchedJobs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Matched Jobs ({matchedJobs.length})
              </h2>
              {matchedJobs.map((job, index) => (
                <Card key={index} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {job.job_title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {job.company}
                          </div>
                          {job.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </div>
                          )}
                          {job.salary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {job.salary}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            {job.match_score}% Match
                          </Badge>
                          {job.remote && (
                            <Badge variant="secondary">Remote</Badge>
                          )}
                        </div>
                        {job.match_reason && (
                          <p className="text-sm text-gray-600 mt-2">{job.match_reason}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (job.url) {
                            window.open(job.url, '_blank');
                          } else {
                            console.warn('Job URL not available');
                          }
                        }}
                      >
                        View Job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job Matching Preferences Modal */}
      <JobMatchingPreferencesModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onConfirm={handleProfileConfirm}
      />
    </div>
  );
}

