import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppHeader } from '@/components/Layout/AppHeader';
import { useResumeBuilder } from '@/components/ResumeBuilder/context/ResumeBuilderContext';
import { TemplateRenderer } from '@/components/ResumeBuilder/Templates/TemplateRenderer';
import { 
  Plus, 
  FileText, 
  Trash2, 
  Edit, 
  Loader2, 
  AlertCircle,
  Lock,
  Clock,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ResumeData, Skill, WorkExperience, Education } from '@/types/resume';
import { profileApi, skillsApi, experienceApi, educationApi } from '@/lib/api';
import type { Profile, Skill as ProfileSkill, WorkExperience as ProfileWorkExperience, Education as ProfileEducation } from '@/lib/types';

const MAX_FREE_RESUMES = 3;

interface SavedResume {
  id: string;
  title: string;
  template_id: string;
  resume_data: ResumeData;
  created_at: string;
  updated_at: string;
}

export function ResumeBuilderHome() {
  const navigate = useNavigate();
  const { listResumes, deleteResume, saveResume } = useResumeBuilder();
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<SavedResume | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    // Only show loading on initial load, not blocking navigation
    if (resumes.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await listResumes();
      // Parse resume_data if it's a string
      const parsedResumes = (data || []).map((r: any) => ({
        ...r,
        resume_data: typeof r.resume_data === 'string' ? JSON.parse(r.resume_data) : r.resume_data
      }));
      setResumes(parsedResumes);
    } catch (err) {
      console.error('Failed to load resumes:', err);
      setError('Failed to load your resumes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (resumes.length >= MAX_FREE_RESUMES) {
      return;
    }
    setIsCreating(true);
    try {
      // Fetch profile data in parallel
      const [profileResult, skillsResult, experienceResult, educationResult] = await Promise.allSettled([
        profileApi.getProfile(),
        skillsApi.getSkills(),
        experienceApi.getExperience(),
        educationApi.getEducation()
      ]);

      // Helper function to extract LinkedIn and website from social_links
      const extractSocialLinks = (socialLinks?: Array<{ platform: string; url: string }>) => {
        let linkedin = '';
        let website = '';
        if (socialLinks) {
          socialLinks.forEach(link => {
            const url = link.url.toLowerCase();
            if (url.includes('linkedin.com')) {
              linkedin = link.url;
            } else if (url.includes('http') && !url.includes('linkedin')) {
              website = link.url;
            }
          });
        }
        return { linkedin, website };
      };

      // Helper function to convert date to YYYY-MM format for DatePicker
      const formatDateForPicker = (dateStr: string | undefined | null): string | undefined => {
        if (!dateStr || dateStr.trim() === '') return undefined;
        
        try {
          // Handle ISO date strings (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return undefined;
          
          // Return YYYY-MM format
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          return `${year}-${month}`;
        } catch (e) {
          console.warn('Invalid date format:', dateStr);
          return undefined;
        }
      };

      // Map Profile WorkExperience to Resume WorkExperience
      const mapWorkExperience = (exp: ProfileWorkExperience | any): WorkExperience => ({
        id: exp.id || `exp-${Date.now()}-${Math.random()}`,
        title: exp.title || '',
        company: exp.company || '',
        location: exp.location || '', // Check if location exists in the data
        startDate: formatDateForPicker(exp.start_date) || '',
        endDate: exp.is_current ? '' : (formatDateForPicker(exp.end_date) || ''),
        isCurrent: exp.is_current || false,
        description: exp.description || ''
      });

      // Map Profile Education to Resume Education
      const mapEducation = (edu: ProfileEducation): Education => ({
        id: edu.id || `edu-${Date.now()}-${Math.random()}`,
        school: edu.school || '',
        degree: edu.degree || '',
        field: '', // Profile Education doesn't have field
        startDate: formatDateForPicker(edu.start_date) || '',
        endDate: formatDateForPicker(edu.end_date) || ''
      });

      // Map Profile Skill to Resume Skill
      const mapSkill = (skill: ProfileSkill): Skill => ({
        id: skill.id || `skill-${Date.now()}-${Math.random()}`,
        name: skill.name || '',
        category: 'Technical' // Default category since Profile Skill doesn't have category
      });

      // Build resume data from profile
      const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
      const skills = skillsResult.status === 'fulfilled' ? skillsResult.value : [];
      const experience = experienceResult.status === 'fulfilled' ? experienceResult.value : [];
      const education = educationResult.status === 'fulfilled' ? educationResult.value : [];

      const { linkedin, website } = extractSocialLinks(profile?.social_links);

      // Split full_name into first and last name if individual fields are not available
      let firstName = profile?.first_name || '';
      let lastName = profile?.last_name || '';
      if (!firstName && !lastName && profile?.full_name) {
        const nameParts = profile.full_name.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      const defaultResumeData: ResumeData = {
        personalInfo: {
          firstName: firstName,
          lastName: lastName,
          email: profile?.email || '',
          phone: profile?.phone || '',
          location: profile?.location || '',
          jobTitle: profile?.job_title || '',
          linkedin: linkedin,
          website: website,
        },
        summary: profile?.professional_summary || '',
        workExperience: experience.map(mapWorkExperience),
        education: education.map(mapEducation),
        skills: skills.map(mapSkill),
        languages: [], // Profile languages structure might be different, handle separately if needed
      };
      
      const newResumeId = await saveResume('Untitled Resume', 'modern-professional', defaultResumeData);
      if (newResumeId) {
        navigate(`/resume-builder/edit?resume=${newResumeId}&template=modern-professional`);
      } else {
        throw new Error('Failed to create resume');
      }
    } catch (err) {
      console.error('Failed to create resume:', err);
      setError('Failed to create resume. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditResume = (resume: SavedResume) => {
    navigate(`/resume-builder/edit?resume=${resume.id}&template=${encodeURIComponent(resume.template_id)}`);
  };

  const handleDeleteClick = (resume: SavedResume) => {
    setResumeToDelete(resume);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!resumeToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteResume(resumeToDelete.id);
      setResumes(resumes.filter(r => r.id !== resumeToDelete.id));
      setDeleteDialogOpen(false);
      setResumeToDelete(null);
    } catch (err) {
      console.error('Failed to delete resume:', err);
      alert('Failed to delete resume. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const canCreateNew = resumes.length < MAX_FREE_RESUMES;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AppHeader active="resume" />
      
      <div className="container mx-auto px-4 py-10 max-w-6xl">

        {/* Create New Resume Card */}
        <div 
          className={`mb-10 relative overflow-hidden rounded-2xl transition-all duration-300 ${
            canCreateNew && !isCreating
              ? 'cursor-pointer group' 
              : 'cursor-not-allowed opacity-70'
          }`}
          onClick={canCreateNew && !isCreating ? handleCreateNew : undefined}
        >
          <div className={`absolute inset-0 ${
            canCreateNew 
              ? 'bg-[#295acf] group-hover:bg-[#295acf]/90' 
              : 'bg-slate-700'
          } transition-all duration-300`} />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          
          <div className="relative p-8 flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              canCreateNew ? 'bg-white/20' : 'bg-white/10'
            }`}>
              {isCreating ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : canCreateNew ? (
                <Plus className="w-8 h-8 text-white" />
              ) : (
                <Lock className="w-7 h-7 text-white/70" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                Craft New Resume
              </h2>
              <p className="text-white/80">
                {isCreating 
                  ? 'Creating your resume...'
                  : canCreateNew 
                    ? 'Start fresh with our AI-powered wizard to create a professional resume'
                    : `You've reached the limit of ${MAX_FREE_RESUMES} resumes. Delete one to create more.`
                }
              </p>
            </div>
            {canCreateNew && (
              <Button 
                size="lg"
                onClick={handleCreateNew}
                disabled={isCreating}
                className="bg-white text-[#295acf] hover:bg-white/90 font-semibold px-6 shadow-lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Get Started
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* My Resumes Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">My Resumes</h2>
                <p className="text-sm text-gray-500">
                  {resumes.length} of {MAX_FREE_RESUMES} resumes used
                </p>
              </div>
            </div>
            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              {[...Array(MAX_FREE_RESUMES)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < resumes.length ? 'bg-[#295acf]' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#295acf]" />
              </div>
              <p className="text-gray-500">Loading your resumes...</p>
            </div>
          ) : error ? (
            <Card className="p-10 text-center bg-white border-gray-200 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadResumes} variant="outline">
                Try Again
              </Button>
            </Card>
          ) : resumes.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-white p-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No resumes yet</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Create your first professional resume with our AI-powered wizard and stand out from the crowd
              </p>
              <Button onClick={handleCreateNew} size="lg" disabled={isCreating} className="bg-[#295acf] hover:bg-[#1f4ab8] text-white font-semibold px-8">
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Your First Resume'
                )}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((resume) => (
                <div 
                  key={resume.id} 
                  className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300 hover:shadow-xl"
                >
                  {/* Resume Preview */}
                  <div className="relative h-[300px] bg-gradient-to-b from-gray-100 to-gray-50 overflow-hidden">
                    <div className="absolute inset-0 p-4">
                      <div className="h-full flex items-start justify-center overflow-hidden">
                        <div 
                          className="bg-white shadow-xl rounded-lg border border-gray-200"
                          style={{ 
                            transform: 'scale(0.3)',
                            transformOrigin: 'top center',
                          }}
                        >
                          <div style={{ width: '800px', minHeight: '1000px' }}>
                            <TemplateRenderer 
                              templateId={resume.template_id || 'modern-professional'} 
                              data={resume.resume_data} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6 gap-3">
                      <Button 
                        size="sm" 
                        className="bg-white text-gray-900 hover:bg-gray-100 font-medium shadow-lg"
                        onClick={() => handleEditResume(resume)}
                      >
                        <Edit className="w-4 h-4 mr-1.5" />
                        Edit Resume
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-red-500 hover:bg-red-600 text-white font-medium shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(resume);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  {/* Resume Info */}
                  <div className="p-5 border-t border-gray-100">
                    <h3 className="font-semibold text-gray-900 truncate mb-2">
                      {resume.title || 'Untitled Resume'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Updated {formatDate(resume.updated_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <DialogTitle className="text-center text-xl">Delete Resume?</DialogTitle>
            <DialogDescription className="text-center text-gray-500">
              Are you sure you want to delete <span className="text-gray-900 font-medium">"{resumeToDelete?.title || 'this resume'}"</span>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Resume
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

