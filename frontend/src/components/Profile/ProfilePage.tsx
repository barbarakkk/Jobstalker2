import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { AppHeader } from '@/components/Layout/AppHeader';
import { 
  Edit, 
  Trash2, 
  Plus, 
  X, 
  User, 
  Briefcase, 
  AlertTriangle,
  Save,
  Star,
  Calendar,
  Award,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  Profile, 
  Skill, 
  WorkExperience, 
  Education,
  Language,
  ProfileStats,
  CreateExperienceData,
  CreateEducationData,
  CreateLanguageData,
  UpdateProfileData
} from '@/lib/types';
import { 
  profileApi, 
  skillsApi, 
  experienceApi, 
  educationApi,
  languagesApi
} from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

interface ProfilePageProps {
  onStatsClick?: (type: 'jobs' | 'interviews' | 'offers') => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onStatsClick }) => {
  const navigate = useNavigate();
  
  // State management
  // Default to the Experience tab and sync with URL hash for reload/deeplink support
  const getTabFromHash = (): 'skills' | 'experience' | 'account' => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (hash === 'skills' || hash === 'experience' || hash === 'account') return hash;
    return 'experience';
  };
  const [activeTab, setActiveTab] = useState<'skills' | 'experience' | 'account'>(getTabFromHash());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Individual loading states for better UX
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isLoadingExperience, setIsLoadingExperience] = useState(false);
  const [isLoadingEducation, setIsLoadingEducation] = useState(false);
  

  // Profile data
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    location: '',
    professional_summary: '',
    social_links: [] as { platform: string; url: string }[]
  });

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats
  const [stats, setStats] = useState<ProfileStats>({
    jobs_applied: 0,
    interviews: 0,
    offers: 0
  });

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      console.log('Starting account deletion...');

      // Delete user profile data first
      try {
        console.log('Calling profileApi.deleteProfile()...');
        const response = await profileApi.deleteProfile();
        console.log('Delete profile response:', response);
      } catch (profileError) {
        console.error('Failed to delete profile data:', profileError);
        setError(`Failed to delete profile data: ${profileError instanceof Error ? profileError.message : 'Unknown error'}`);
        return; // Stop execution if profile deletion fails
      }

      console.log('Profile deleted successfully, signing out...');

      // Sign out the user
      await supabase.auth.signOut();
      
      // Show success message
      setSuccessMessage('Account and all data deleted successfully. You have been signed out.');
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Error in handleDeleteAccount:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

     // Skills
   const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Intermediate');
  const [updatingSkillId, setUpdatingSkillId] = useState<string | null>(null);

  // Experience
  const [experience, setExperience] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [newLanguageName, setNewLanguageName] = useState('');
  const [newLanguageProficiency, setNewLanguageProficiency] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Native'>('Intermediate');
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState<WorkExperience | null>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<string>('');
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [editingEducationId, setEditingEducationId] = useState<string>('');
  const [experienceForm, setExperienceForm] = useState<CreateExperienceData>({
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    description: '',
    is_current: false
  });
  const [educationForm, setEducationForm] = useState<CreateEducationData>({
    school: '',
    degree: '',
    start_date: '',
    end_date: ''
  });

  // Removed resume management state

  // Load initial data - Load profile first, then other data
  useEffect(() => {
    loadProfileData();
  }, []);

  // Removed resume loading effects

  // Keep tab in sync with URL hash so refresh/direct link opens correct tab
  useEffect(() => {
    const handleHashChange = () => {
      const next = getTabFromHash();
      setActiveTab(next);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (value: string) => {
    const next = (value === 'skills' || value === 'experience' || value === 'account') ? value : 'experience';
    setActiveTab(next);
    if (typeof window !== 'undefined') {
      window.location.hash = next;
    }
  };

  const loadProfileData = async () => {
    // Don't block - show page immediately
    setError(null);
    // Set loading only for initial load, not blocking
    if (!profile) {
      setIsLoading(true);
    }

    try {
      // Load ALL data in parallel from the start for faster navigation
      const [profileResult, statsResult, skillsResult, experienceResult, educationResult, languagesResult] = await Promise.allSettled([
        profileApi.getProfile(),
        profileApi.getProfileStats(),
        skillsApi.getSkills(),
        experienceApi.getExperience(),
        educationApi.getEducation(),
        languagesApi.getLanguages()
      ]);

      // Handle profile data
      if (profileResult.status === 'fulfilled') {
        const profileData = profileResult.value;
        console.log('Profile data loaded:', profileData);
        
        // If email is missing from backend, fetch it from Supabase auth as fallback
        let email = profileData.email;
        if (!email) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
              email = user.email;
              profileData.email = email;
            }
          } catch (authError) {
            console.warn('Could not fetch email from auth:', authError);
          }
        }
        
        setProfile(profileData);
        setProfileForm({
          full_name: profileData.full_name || '',
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: email || '',
          phone: profileData.phone || '',
          job_title: profileData.job_title || '',
          location: profileData.location || '',
          professional_summary: profileData.professional_summary || '',
          social_links: profileData.social_links || []
        });
      } else {
        console.warn('Failed to load profile:', profileResult.reason);
        setError('Failed to load profile data');
      }

      // Handle stats
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      } else {
        console.warn('Failed to load stats:', statsResult.reason);
      }

      // Handle skills
      if (skillsResult.status === 'fulfilled') {
        setSkills(skillsResult.value);
      } else {
        console.warn('Failed to load skills:', skillsResult.reason);
      }

      // Handle experience
      if (experienceResult.status === 'fulfilled') {
        setExperience(experienceResult.value);
      } else {
        console.warn('Failed to load experience:', experienceResult.reason);
      }

      // Handle education
      if (educationResult.status === 'fulfilled') {
        setEducation(educationResult.value);
      } else {
        const error = educationResult.reason;
        if (error instanceof Error && !error.message.includes('Server disconnected')) {
          console.warn('Failed to load education:', error);
        }
        setEducation([]);
      }

      // Handle languages
      if (languagesResult.status === 'fulfilled') {
        setLanguages(languagesResult.value);
      } else {
        const error = languagesResult.reason;
        if (error instanceof Error && !error.message.includes('Server disconnected')) {
          console.warn('Failed to load languages:', error);
        }
        setLanguages([]);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  // Profile management
  const handleProfileSave = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      setError(null);

      // Include personal information and social links
      const backendData: UpdateProfileData = {
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone: profileForm.phone,
        social_links: profileForm.social_links || [],  // Include social links
        // email is managed by auth.users, not user_profile - removed from update
      };

      const updatedProfile = await profileApi.updateProfile(backendData);
      
             // Update both the profile and the form state
       setProfile(updatedProfile);
               setProfileForm({
           full_name: updatedProfile.full_name || '',
           first_name: updatedProfile.first_name || '',
           last_name: updatedProfile.last_name || '',
           email: updatedProfile.email || '',
           phone: updatedProfile.phone || '',
           job_title: updatedProfile.job_title || '',
           location: updatedProfile.location || '',
           professional_summary: updatedProfile.professional_summary || '',
           social_links: updatedProfile.social_links || []
         });
      
      setIsEditingProfile(false);
      setSuccessMessage('Profile updated successfully!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Save social links separately
  const handleSocialLinksSave = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      setError(null);

      // Save only social links
      const backendData: UpdateProfileData = {
        social_links: profileForm.social_links || []
      };

      const updatedProfile = await profileApi.updateProfile(backendData);
      
      // Update both the profile and the form state
      setProfile(updatedProfile);
      setProfileForm({
        ...profileForm,
        social_links: updatedProfile.social_links || []
      });
      
      setIsEditingProfile(false);
      setSuccessMessage('Social links saved successfully!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save social links');
    } finally {
      setIsSaving(false);
    }
  };

  // Skills management
  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;

    try {
      setError(null);
      console.log('Adding skill with proficiency level:', newSkillLevel); // Debug log
      const skill = await skillsApi.addSkill({
        name: newSkill.trim(),
        proficiency_level: newSkillLevel as 'Beginner' | 'Intermediate' | 'Expert'
      });
      console.log('Skill added successfully:', skill); // Debug log
      setSkills([...skills, skill]);
      setNewSkill('');
      setNewSkillLevel('Intermediate'); // Reset to default after adding
      setSuccessMessage('Skill added successfully!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error adding skill:', error); // Debug log
      setError(error instanceof Error ? error.message : 'Failed to add skill');
    }
  };

  const handleUpdateSkillProficiency = async (skillId: string, proficiencyLevel: 'Beginner' | 'Intermediate' | 'Expert') => {
    try {
      setUpdatingSkillId(skillId);
      setError(null);
      const updatedSkill = await skillsApi.updateSkill(skillId, {
        proficiency_level: proficiencyLevel
      });
      setSkills(skills.map(skill => {
        const currentSkillId = skill.added_at || skill.id || '';
        return currentSkillId === skillId ? updatedSkill : skill;
      }));
      setSuccessMessage('Skill proficiency updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating skill proficiency:', error);
      setError(error instanceof Error ? error.message : 'Failed to update skill proficiency');
    } finally {
      setUpdatingSkillId(null);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      setError(null);
      await skillsApi.deleteSkill(skillId);
      setSkills(skills.filter(skill => (skill.added_at || skill.id) !== skillId));
      setSuccessMessage('Skill deleted successfully!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete skill');
    }
  };

  // Experience management
  const handleSaveExperience = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Client-side validation - show user-friendly messages
      if (!experienceForm.title || experienceForm.title.trim() === '') {
        setError('Please enter a job title');
        setIsSaving(false);
        return;
      }

      if (!experienceForm.company || experienceForm.company.trim() === '') {
        setError('Please enter a company name');
        setIsSaving(false);
        return;
      }

      // Prepare data - convert empty strings to undefined for optional fields
      const experienceData: CreateExperienceData = {
        title: experienceForm.title.trim(),
        company: experienceForm.company.trim(),
        location: experienceForm.location && experienceForm.location.trim() !== '' ? experienceForm.location.trim() : undefined,
        start_date: experienceForm.start_date && experienceForm.start_date.trim() !== '' ? experienceForm.start_date.trim() : undefined,
        end_date: experienceForm.is_current || !experienceForm.end_date || experienceForm.end_date.trim() === '' 
          ? undefined 
          : experienceForm.end_date.trim(),
        description: experienceForm.description && experienceForm.description.trim() !== '' ? experienceForm.description.trim() : undefined,
        is_current: experienceForm.is_current,
      };

      if (editingExperience && editingExperienceId) {
        const updated = await experienceApi.updateExperience(editingExperienceId, experienceData);
        setExperience(experience.map(exp => (exp.added_at || exp.id) === editingExperienceId ? updated : exp));
      } else {
        const newExp = await experienceApi.addExperience(experienceData);
        setExperience([...experience, newExp]);
      }

      setShowExperienceModal(false);
      setEditingExperience(null);
      setEditingExperienceId('');
      setExperienceForm({
        title: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        description: '',
        is_current: false
      });
      setSuccessMessage(`Experience ${editingExperience ? 'updated' : 'added'} successfully!`);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      // Log technical error to console only
      console.error('Error saving experience (technical):', error);
      
      // Show user-friendly message
      const errorMessage = error instanceof Error ? error.message : 'Failed to save experience';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      setError(null);
      await experienceApi.deleteExperience(id);
      setExperience(experience.filter(exp => (exp.added_at || exp.id) !== id));
      setSuccessMessage('Experience deleted successfully!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete experience');
    }
  };

  // Education management
  const handleSaveEducation = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Format dates: convert "YYYY-MM" to "YYYY-MM-01" (first day of month) for backend
      const formatDateForAPI = (dateString: string | undefined): string | undefined => {
        if (!dateString || dateString.trim() === '') return undefined;
        // If already in YYYY-MM-DD format, return as is
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateString;
        }
        // If in YYYY-MM format, append "-01"
        if (dateString.match(/^\d{4}-\d{2}$/)) {
          return `${dateString}-01`;
        }
        return dateString;
      };

      const educationData = {
        ...educationForm,
        start_date: formatDateForAPI(educationForm.start_date),
        end_date: formatDateForAPI(educationForm.end_date),
      };

      if (editingEducation && editingEducationId) {
        const updated = await educationApi.updateEducation(editingEducationId, educationData);
        setEducation(education.map(edu => (edu.added_at || edu.id) === editingEducationId ? updated : edu));
      } else {
        const newEdu = await educationApi.addEducation(educationData);
        setEducation([...education, newEdu]);
      }

      setShowEducationModal(false);
      setEditingEducation(null);
      setEditingEducationId('');
      setEducationForm({
        school: '',
        degree: '',
        start_date: '',
        end_date: ''
      });
      setSuccessMessage(`Education ${editingEducation ? 'updated' : 'added'} successfully!`);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save education');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      setError(null);
      await educationApi.deleteEducation(id);
      setEducation(education.filter(edu => (edu.added_at || edu.id) !== id));
      setSuccessMessage('Education deleted successfully!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete education');
    }
  };

  // Removed resume management handlers

  const handleRefreshProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const refreshedProfile = await profileApi.getProfile();
      console.log('Profile refreshed:', refreshedProfile);
      setProfile(refreshedProfile);
      setProfileForm({
        full_name: refreshedProfile.full_name || '',
        first_name: refreshedProfile.first_name || '',
        last_name: refreshedProfile.last_name || '',
        email: refreshedProfile.email || '',
        phone: refreshedProfile.phone || '',
        job_title: refreshedProfile.job_title || '',
        location: refreshedProfile.location || '',
        professional_summary: refreshedProfile.professional_summary || '',
        social_links: refreshedProfile.social_links || []
      });
      setSuccessMessage('Profile refreshed successfully!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to refresh profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

     const getProficiencyColor = (level: string) => {
     console.log('Proficiency level:', level); // Debug log
     switch (level) {
       case 'Expert': return 'bg-green-100 text-green-800 border-green-200';
       case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
       case 'Beginner': return 'bg-blue-100 text-blue-800 border-blue-200';
       default: return 'bg-gray-100 text-gray-800 border-gray-200';
     }
   };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sans">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <AppHeader active="profile" />

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar */}
        <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 lg:min-h-screen p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Profile Card */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg text-gray-900">Profile</CardTitle>
                <Button
                  onClick={handleRefreshProfile}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800 text-xs sm:text-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <span className="hidden sm:inline">Refresh</span>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex flex-col items-center space-y-4">
                {/* Profile Info */}
                <div className="text-center w-full">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {profile?.first_name && profile?.last_name 
                        ? `${profile.first_name} ${profile.last_name}` 
                        : profile?.full_name || 'Your Name'}
                    </h3>
                    <p className="text-gray-600 mt-1">{profile?.email || 'No email'}</p>
                    <p className="text-gray-500 text-sm mt-1">{profile?.phone || 'No phone'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div 
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => onStatsClick?.('jobs')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Jobs Applied</p>
                    <p className="text-xl font-semibold text-gray-900">{stats.jobs_applied}</p>
                  </div>
                </div>
              </div>

              <div 
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                onClick={() => onStatsClick?.('interviews')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                                         <p className="text-sm text-gray-600">Interviews Scheduled</p>
                    <p className="text-xl font-semibold text-gray-900">{stats.interviews}</p>
                  </div>
                </div>
              </div>

                             <div 
                 className="flex items-center justify-between p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                 onClick={() => onStatsClick?.('offers')}
               >
                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                     <Award className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <p className="text-sm text-gray-600">Accepted Jobs</p>
                     <p className="text-xl font-semibold text-gray-900">{stats.offers}</p>
                   </div>
                 </div>
               </div>
            </CardContent>
          </Card>

          {/* Resume Manager removed per request */}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3 sm:p-4 lg:p-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
                <TabsTrigger value="skills" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-xs sm:text-sm">Skills</TabsTrigger>
                <TabsTrigger value="experience" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-xs sm:text-sm">Experience</TabsTrigger>
                <TabsTrigger value="account" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 text-xs sm:text-sm">Account</TabsTrigger>
             </TabsList>

            

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-4 sm:space-y-6">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">Skills & Expertise</CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-600">
                    Add your technical and professional skills with proficiency levels
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
                  {/* Add New Skill */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a new skill..."
                      className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                    />
                    <Select 
                      value={newSkillLevel} 
                      onValueChange={(value) => {
                        const level = value as 'Beginner' | 'Intermediate' | 'Expert';
                        console.log('Skill level selected:', level);
                        setNewSkillLevel(level);
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-32 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddSkill} disabled={!newSkill.trim()} className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Add
                    </Button>
                  </div>

                                     {/* Skills List */}
                   <div className="space-y-3">
                     {skills.map((skill) => {
                       const skillId = skill.added_at || skill.id || '';
                       const isUpdating = updatingSkillId === skillId;
                       return (
                         <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                           <div className="flex items-center space-x-3 flex-1">
                             <span className="font-medium text-gray-900">{skill.name}</span>
                             <Select 
                               value={skill.proficiency_level || 'Beginner'} 
                               onValueChange={(value: 'Beginner' | 'Intermediate' | 'Expert') => {
                                 handleUpdateSkillProficiency(skillId, value);
                               }}
                               disabled={isUpdating}
                             >
                               <SelectTrigger className={`w-auto min-w-[80px] h-7 px-2 py-1 text-xs font-medium border rounded-md shadow-none ${getProficiencyColor(skill.proficiency_level || 'Beginner')} hover:opacity-80 transition-opacity cursor-pointer`}>
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="Beginner">Beginner</SelectItem>
                                 <SelectItem value="Intermediate">Intermediate</SelectItem>
                                 <SelectItem value="Expert">Expert</SelectItem>
                               </SelectContent>
                             </Select>
                             {isUpdating && (
                               <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                             )}
                           </div>
                           <Button
                             size="sm"
                             variant="ghost"
                             onClick={() => handleDeleteSkill(skillId)}
                             className="text-red-600 hover:text-red-700 hover:bg-red-50"
                             disabled={isUpdating}
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </div>
                       );
                     })}
                   </div>

                  
                </CardContent>
              </Card>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="space-y-6">
              {/* Work Experience */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900">Work Experience</CardTitle>
                      <CardDescription className="text-gray-600">
                        Add your professional work history
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowExperienceModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {experience.map((exp) => (
                    <div key={exp.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                          <p className="text-gray-600">{exp.company}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : formatDate(exp.end_date || '')}
                          </p>
                          <p className="text-gray-700 mt-2 whitespace-pre-wrap">{exp.description}</p>
                        </div>
                        <div className="flex space-x-2 sm:ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingExperience(exp);
                              setEditingExperienceId(exp.added_at || exp.id || '');
                              setExperienceForm({
                                title: exp.title,
                                company: exp.company,
                                start_date: exp.start_date,
                                end_date: exp.end_date || '',
                                description: exp.description,
                                is_current: exp.is_current
                              });
                              setShowExperienceModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteExperience(exp.added_at || exp.id || '')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Education */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900">Education</CardTitle>
                      <CardDescription className="text-gray-600">
                        Add your educational background
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowEducationModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Education
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                          <p className="text-gray-600">{edu.school}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : 'Present'}
                          </p>
                        </div>
                        <div className="flex space-x-2 sm:ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingEducation(edu);
                              setEditingEducationId(edu.added_at || edu.id || '');
                              // Convert YYYY-MM-DD to YYYY-MM for DatePicker
                              const formatDateForPicker = (dateString: string | undefined): string | undefined => {
                                if (!dateString || dateString.trim() === '') return undefined;
                                // If in YYYY-MM-DD format, extract YYYY-MM
                                if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                  return dateString.substring(0, 7); // Extract YYYY-MM
                                }
                                // If already in YYYY-MM format, return as is
                                if (dateString.match(/^\d{4}-\d{2}$/)) {
                                  return dateString;
                                }
                                return undefined;
                              };
                              setEducationForm({
                                school: edu.school,
                                degree: edu.degree,
                                start_date: formatDateForPicker(edu.start_date) || '',
                                end_date: formatDateForPicker(edu.end_date) || ''
                              });
                              setShowEducationModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEducation(edu.added_at || edu.id || '')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              {/* Personal Information */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900">Personal Information</CardTitle>
                      <CardDescription className="text-gray-600">Update your personal details</CardDescription>
                    </div>
                    {!isEditingProfile && (
                      <Button 
                        onClick={() => setIsEditingProfile(true)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingProfile ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>First Name</Label>
                          <Input
                            value={profileForm.first_name}
                            onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                            placeholder="First Name"
                          />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input
                            value={profileForm.last_name}
                            onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                            placeholder="Last Name"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                            placeholder="Email"
                            disabled
                            className="bg-gray-100 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">Email is managed by your account settings</p>
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                            placeholder="Phone"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          onClick={() => setIsEditingProfile(false)}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleProfileSave}
                          disabled={isSaving}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">First Name:</span>
                        <span className="text-sm text-gray-900">{profile?.first_name || 'Not set'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Last Name:</span>
                        <span className="text-sm text-gray-900">{profile?.last_name || 'Not set'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <span className="text-sm text-gray-900">{profile?.email || 'Not set'}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-600">Phone:</span>
                        <span className="text-sm text-gray-900">{profile?.phone || 'Not set'}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">Social & Professional Links</CardTitle>
                  <CardDescription className="text-gray-600">Manage your social media and professional profiles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingProfile ? (
                    <>
                      {profileForm.social_links.map((link, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                          <div className="md:col-span-4">
                            <Label>Platform</Label>
                            <Select
                              value={link.platform}
                              onValueChange={(value) => {
                                const updated = [...profileForm.social_links];
                                updated[index] = { ...updated[index], platform: value };
                                setProfileForm({...profileForm, social_links: updated});
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                                <SelectItem value="GitHub">GitHub</SelectItem>
                                <SelectItem value="Portfolio">Portfolio</SelectItem>
                                <SelectItem value="Twitter">Twitter</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-7">
                            <Label>URL</Label>
                            <Input
                              value={link.url}
                              onChange={(e) => {
                                const updated = [...profileForm.social_links];
                                updated[index] = { ...updated[index], url: e.target.value };
                                setProfileForm({...profileForm, social_links: updated});
                              }}
                              placeholder="https://..."
                            />
                          </div>
                          <div className="md:col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const updated = profileForm.social_links.filter((_, i) => i !== index);
                                setProfileForm({...profileForm, social_links: updated});
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setProfileForm({
                            ...profileForm,
                            social_links: [...profileForm.social_links, { platform: 'LinkedIn', url: '' }]
                          });
                        }}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Social Link
                      </Button>
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditingProfile(false);
                            // Reset form to match current profile
                            if (profile) {
                              setProfileForm({
                                ...profileForm,
                                social_links: profile.social_links || []
                              });
                            }
                          }}
                          disabled={isSaving}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleSocialLinksSave}
                          disabled={isSaving}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      {profile?.social_links && profile.social_links.length > 0 ? (
                        profile.social_links.map((link, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <strong className="text-gray-700 font-medium">{link.platform}:</strong>
                                <a 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:underline truncate"
                                >
                                  {link.url}
                                </a>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setIsEditingProfile(true);
                                  // Ensure the link is in the form state
                                  const linkExists = profileForm.social_links.some(
                                    (l) => l.platform === link.platform && l.url === link.url
                                  );
                                  if (!linkExists) {
                                    setProfileForm({
                                      ...profileForm,
                                      social_links: [...profileForm.social_links, { ...link }]
                                    });
                                  }
                                }}
                                className="h-8 w-8"
                                title="Edit link"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setIsEditingProfile(true);
                                  // Remove the link from form state
                                  const updated = profileForm.social_links.filter(
                                    (l, i) => !(l.platform === link.platform && l.url === link.url)
                                  );
                                  setProfileForm({
                                    ...profileForm,
                                    social_links: updated
                                  });
                                }}
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Remove link"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 py-2">No social links added</p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(true);
                          // If no links exist, add a new one
                          if (!profileForm.social_links || profileForm.social_links.length === 0) {
                            setProfileForm({
                              ...profileForm,
                              social_links: [{ platform: 'LinkedIn', url: '' }]
                            });
                          }
                        }}
                        className="w-full mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {profile?.social_links && profile.social_links.length > 0 ? 'Add Another Link' : 'Add Social Link'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Languages */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">Languages</CardTitle>
                  <CardDescription className="text-gray-600">Manage your language proficiencies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {languages.length > 0 ? (
                    <div className="space-y-2">
                      {languages.map((lang) => (
                        <div key={lang.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <strong>{lang.language}</strong> - <span className="text-gray-600">{lang.proficiency}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (lang.id) {
                                try {
                                  await languagesApi.deleteLanguage(lang.id);
                                  setLanguages(languages.filter(l => l.id !== lang.id));
                                  setSuccessMessage('Language deleted successfully!');
                                  setTimeout(() => setSuccessMessage(null), 3000);
                                } catch (error) {
                                  setError(error instanceof Error ? error.message : 'Failed to delete language');
                                }
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No languages added</p>
                  )}
                  {isAddingLanguage ? (
                    <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                      <div>
                        <Label htmlFor="language-name">Language Name</Label>
                        <Input
                          id="language-name"
                          value={newLanguageName}
                          onChange={(e) => setNewLanguageName(e.target.value)}
                          placeholder="e.g., English, Spanish, French"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="language-proficiency">Proficiency</Label>
                        <Select
                          value={newLanguageProficiency}
                          onValueChange={(value) => setNewLanguageProficiency(value as 'Beginner' | 'Intermediate' | 'Advanced' | 'Native')}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Native">Native</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddingLanguage(false);
                            setNewLanguageName('');
                            setNewLanguageProficiency('Intermediate');
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={async () => {
                            if (!newLanguageName.trim()) {
                              setError('Please enter a language name');
                              return;
                            }
                            try {
                              setError(null);
                              const newLang = await languagesApi.createLanguage({
                                language: newLanguageName.trim(),
                                proficiency: newLanguageProficiency
                              });
                              setLanguages([...languages, newLang]);
                              setSuccessMessage('Language added successfully!');
                              setTimeout(() => setSuccessMessage(null), 3000);
                              setIsAddingLanguage(false);
                              setNewLanguageName('');
                              setNewLanguageProficiency('Intermediate');
                            } catch (error) {
                              setError(error instanceof Error ? error.message : 'Failed to add language');
                            }
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingLanguage(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Language
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-red-600">Danger Zone</CardTitle>
                  <CardDescription className="text-gray-600">Deleting your account is irreversible</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="border-red-600 text-red-600 hover:bg-red-50"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting Account...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 mr-2" /> 
                        Delete Account
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Experience Modal */}
      <Dialog open={showExperienceModal} onOpenChange={setShowExperienceModal}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingExperience ? 'Edit Experience' : 'Add Work Experience'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900">Job Title</label>
                <Input
                  value={experienceForm.title}
                  onChange={(e) => setExperienceForm({...experienceForm, title: e.target.value})}
                  placeholder="Software Engineer"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900">Company</label>
                <Input
                  value={experienceForm.company}
                  onChange={(e) => setExperienceForm({...experienceForm, company: e.target.value})}
                  placeholder="Company Name"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">Start Date</label>
                <DatePicker
                  type="month"
                  value={experienceForm.start_date || undefined}
                  onChange={(value) => setExperienceForm({...experienceForm, start_date: value || ''})}
                  placeholder="Select month"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">End Date</label>
                <DatePicker
                  type="month"
                  value={experienceForm.end_date || undefined}
                  onChange={(value) => setExperienceForm({...experienceForm, end_date: value || ''})}
                  disabled={experienceForm.is_current}
                  placeholder={experienceForm.is_current ? 'Present' : 'Select month'}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="current"
                checked={experienceForm.is_current}
                onCheckedChange={(checked) => {
                  setExperienceForm({
                    ...experienceForm,
                    is_current: checked as boolean,
                    end_date: checked ? '' : experienceForm.end_date
                  });
                }}
              />
              <label htmlFor="current" className="text-sm text-gray-900">Current Position</label>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900">Description</label>
              <Textarea
                value={experienceForm.description || ''}
                onChange={(e) => setExperienceForm({...experienceForm, description: e.target.value})}
                placeholder="Describe your role and achievements..."
                className="min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowExperienceModal(false)} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                Cancel
              </Button>
              <Button onClick={handleSaveExperience} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {editingExperience ? 'Update' : 'Add'} Experience
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Education Modal */}
      <Dialog open={showEducationModal} onOpenChange={setShowEducationModal}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingEducation ? 'Edit Education' : 'Add Education'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900">School/University</label>
                <Input
                  value={educationForm.school}
                  onChange={(e) => setEducationForm({...educationForm, school: e.target.value})}
                  placeholder="University Name"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900">Degree</label>
                <Input
                  value={educationForm.degree}
                  onChange={(e) => setEducationForm({...educationForm, degree: e.target.value})}
                  placeholder="Bachelor of Science"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">Start Date</label>
                <DatePicker
                  type="month"
                  value={educationForm.start_date || undefined}
                  onChange={(value) => setEducationForm({...educationForm, start_date: value || ''})}
                  placeholder="Select month"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 mb-1 block">End Date</label>
                <DatePicker
                  type="month"
                  value={educationForm.end_date || undefined}
                  onChange={(value) => setEducationForm({...educationForm, end_date: value || ''})}
                  placeholder="Select month"
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEducationModal(false)} className="border-gray-300 text-gray-700 hover:bg-gray-100">
                Cancel
              </Button>
              <Button onClick={handleSaveEducation} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {editingEducation ? 'Update' : 'Add'} Education
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-red-600 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Delete Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data including:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
              <li>Your profile information</li>
              <li>All job applications</li>
              <li>Skills and experience data</li>
              <li>All statistics and progress</li>
            </ul>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Your account will be signed out and all data will be deleted. 
                The account may still exist in the authentication system but will be inaccessible.
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;

