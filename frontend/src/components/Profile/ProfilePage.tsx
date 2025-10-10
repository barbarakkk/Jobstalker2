import React, { useState, useEffect, useRef } from 'react';
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
import ColoredLogoHorizontal from '@/assets/ColoredLogoHorizontal.svg';
import { 
  MapPin, 
  Edit, 
  Trash2, 
  Plus, 
  X, 
  User, 
  Briefcase, 
  AlertTriangle,
  Save,
  Camera,
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
  ProfileStats,
  CreateExperienceData,
  CreateEducationData
} from '@/lib/types';
import { 
  profileApi, 
  skillsApi, 
  experienceApi, 
  educationApi 
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
    job_title: '',
    location: ''
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

  // Experience
  const [experience, setExperience] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState<WorkExperience | null>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<string>('');
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [editingEducationId, setEditingEducationId] = useState<string>('');
  const [experienceForm, setExperienceForm] = useState<CreateExperienceData>({
    title: '',
    company: '',
    start_date: '',
    end_date: '',
    description: '',
    is_current: false
  });
  const [educationForm, setEducationForm] = useState<CreateEducationData>({
    school: '',
    degree: '',
    field_of_study: '',
    start_date: '',
    end_date: ''
  });

  // Removed resume management state

  // Profile picture
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const pictureInputRef = useRef<HTMLInputElement>(null);

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
    try {
      setIsLoading(true);
      setError(null);

      // Load profile data first (most important)
      const profileData = await profileApi.getProfile();
      console.log('Profile data loaded:', profileData);
      setProfile(profileData);
      setProfileForm({
        full_name: profileData.full_name || '',
        job_title: profileData.job_title || '',
        location: profileData.location || ''
      });
      console.log('Profile picture URL:', profileData.profile_picture_url);
      setProfilePicture(profileData.profile_picture_url || null);

      // Load stats data (quick to load)
      try {
        const statsData = await profileApi.getProfileStats();
        setStats(statsData);
      } catch (error) {
        console.warn('Failed to load stats:', error);
      }

      // Load other data in parallel (non-critical)
      Promise.allSettled([
        skillsApi.getSkills(),
        experienceApi.getExperience(),
        educationApi.getEducation()
      ]).then((results) => {
        // Handle skills
        if (results[0].status === 'fulfilled') {
          setSkills(results[0].value);
        } else {
          console.warn('Failed to load skills:', results[0].reason);
        }

        // Handle experience
        if (results[1].status === 'fulfilled') {
          setExperience(results[1].value);
        } else {
          console.warn('Failed to load experience:', results[1].reason);
        }

        // Handle education
        if (results[2].status === 'fulfilled') {
          setEducation(results[2].value);
        } else {
          console.warn('Failed to load education:', results[2].reason);
        }
      });

      // Removed resumes load

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

             // Map frontend fields to backend fields
       const backendData = {
         full_name: profileForm.full_name,
         job_title: profileForm.job_title,
         location: profileForm.location
       };

      const updatedProfile = await profileApi.updateProfile(backendData);
      
             // Update both the profile and the form state
       setProfile(updatedProfile);
               setProfileForm({
           full_name: updatedProfile.full_name || '',
           job_title: updatedProfile.job_title || '',
           location: updatedProfile.location || ''
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

  const handleProfilePictureUpload = async (file: File) => {
    try {
      setUploadingPicture(true);
      setError(null);

      console.log('Uploading profile picture:', file.name, file.type, file.size);
      const result = await profileApi.uploadProfilePicture(file);
      console.log('Profile picture upload result:', result);
      setProfilePicture(result.profile_picture_url);
      setSuccessMessage('Profile picture updated successfully!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Profile picture upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  // Skills management
  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;

    try {
      setError(null);
      const skill = await skillsApi.addSkill({
        name: newSkill.trim(),
        proficiency_level: newSkillLevel
      });
      setSkills([...skills, skill]);
      setNewSkill('');
      setSuccessMessage('Skill added successfully!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add skill');
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

      if (editingExperience && editingExperienceId) {
        const updated = await experienceApi.updateExperience(editingExperienceId, experienceForm);
        setExperience(experience.map(exp => (exp.added_at || exp.id) === editingExperienceId ? updated : exp));
      } else {
        const newExp = await experienceApi.addExperience(experienceForm);
        setExperience([...experience, newExp]);
      }

      setShowExperienceModal(false);
      setEditingExperience(null);
      setEditingExperienceId('');
      setExperienceForm({
        title: '',
        company: '',
        start_date: '',
        end_date: '',
        description: '',
        is_current: false
      });
      setSuccessMessage(`Experience ${editingExperience ? 'updated' : 'added'} successfully!`);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save experience');
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

      if (editingEducation && editingEducationId) {
        const updated = await educationApi.updateEducation(editingEducationId, educationForm);
        setEducation(education.map(edu => (edu.added_at || edu.id) === editingEducationId ? updated : edu));
      } else {
        const newEdu = await educationApi.addEducation(educationForm);
        setEducation([...education, newEdu]);
      }

      setShowEducationModal(false);
      setEditingEducation(null);
      setEditingEducationId('');
      setEducationForm({
        school: '',
        degree: '',
        field_of_study: '',
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
        job_title: refreshedProfile.job_title || '',
        location: refreshedProfile.location || ''
      });
      setProfilePicture(refreshedProfile.profile_picture_url || null);
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
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
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
              <a href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Jobs</a>
              <a href="/statistics" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Statistics</a>
              <a href="/profile" className="text-blue-600 font-semibold">Profile</a>
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
            <button onClick={() => navigate('/dashboard')} className="px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">Jobs</button>
            <button onClick={() => navigate('/statistics')} className="px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">Statistics</button>
            <button className="px-3 py-1.5 text-sm rounded-full bg-blue-50 text-blue-600 font-semibold whitespace-nowrap">Profile</button>
          </div>
        </div>
      </header>

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
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {profilePicture ? (
                      <img 
                        src={profilePicture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Profile picture failed to load:', profilePicture);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Profile picture loaded successfully:', profilePicture);
                        }}
                      />
                    ) : (
                      <User className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={() => pictureInputRef.current?.click()}
                    disabled={uploadingPicture}
                    className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 sm:p-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploadingPicture ? (
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </button>
                  <input
                    ref={pictureInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProfilePictureUpload(file);
                    }}
                  />
                </div>

                {/* Profile Info */}
                <div className="text-center w-full">
                  {isEditingProfile ? (
                    <div className="space-y-3">
                      <Input
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                        placeholder="Full Name"
                        className="text-center font-semibold border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Input
                                        value={profileForm.job_title}
                onChange={(e) => setProfileForm({...profileForm, job_title: e.target.value})}
                        placeholder="Current Role"
                        className="text-center text-gray-600 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Input
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                        placeholder="Location"
                        className="text-center text-gray-600 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleProfileSave}
                          disabled={isSaving}
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save
                        </Button>
                        <Button 
                          onClick={() => setIsEditingProfile(false)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{profile?.full_name || 'Your Name'}</h3>
                      <p className="text-gray-600">{profile?.job_title || 'Your Role'}</p>
                      <div className="flex items-center justify-center mt-2 text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{profile?.location || 'Location'}</span>
                      </div>
                      <Button 
                        onClick={() => setIsEditingProfile(true)}
                        variant="outline"
                        size="sm"
                        className="mt-3 border-gray-300 text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      {profilePicture && (
                        <div className="mt-2 text-xs text-gray-500 text-center max-w-full truncate">
                          Picture: {profilePicture.split('/').pop()}
                        </div>
                      )}
                    </div>
                  )}
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
                    <Select value={newSkillLevel} onValueChange={(value: any) => setNewSkillLevel(value)}>
                      <SelectTrigger className="w-full sm:w-32 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base">
                        <SelectValue />
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
                     {skills.map((skill) => (
                       <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                         <div className="flex items-center space-x-3">
                           <span className="font-medium text-gray-900">{skill.name}</span>
                           <Badge 
                             variant="secondary" 
                             className={`px-2 py-1 text-xs font-medium ${getProficiencyColor(skill.proficiency_level)}`}
                           >
                             {skill.proficiency_level || 'Beginner'}
                           </Badge>
                         </div>
                         <Button
                           size="sm"
                           variant="ghost"
                           onClick={() => handleDeleteSkill(skill.added_at || skill.id || '')}
                           className="text-red-600 hover:text-red-700 hover:bg-red-50"
                         >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </div>
                     ))}
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
                          <p className="text-sm text-gray-500">{edu.field_of_study}</p>
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
                              setEducationForm({
                                school: edu.school,
                                degree: edu.degree,
                                field_of_study: edu.field_of_study,
                                start_date: edu.start_date,
                                end_date: edu.end_date || ''
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
                <label className="text-sm font-medium text-gray-900">Start Date</label>
                <Input
                  type="date"
                  value={experienceForm.start_date}
                  onChange={(e) => setExperienceForm({...experienceForm, start_date: e.target.value})}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900">End Date</label>
                <Input
                  type="date"
                  value={experienceForm.end_date}
                  onChange={(e) => setExperienceForm({...experienceForm, end_date: e.target.value})}
                  disabled={experienceForm.is_current}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                value={experienceForm.description}
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
            <div>
              <label className="text-sm font-medium text-gray-900">Field of Study</label>
              <Input
                value={educationForm.field_of_study}
                onChange={(e) => setEducationForm({...educationForm, field_of_study: e.target.value})}
                placeholder="Computer Science"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-900">Start Date</label>
                <Input
                  type="date"
                  value={educationForm.start_date}
                  onChange={(e) => setEducationForm({...educationForm, start_date: e.target.value})}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900">End Date</label>
                <Input
                  type="date"
                  value={educationForm.end_date}
                  onChange={(e) => setEducationForm({...educationForm, end_date: e.target.value})}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
              <li>Uploaded resumes</li>
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

