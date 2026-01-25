import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Loader2, Edit2, Save, Trash2, Code, MapPin, Sparkles, ChevronDown } from 'lucide-react';
import { apiCall, profileApi, skillsApi, invalidateCache } from '@/lib/api';
import { JobMatchingPreferences, Skill } from '@/lib/types';
import ColoredLogoHorizontal from '@/assets/ColoredLogoHorizontal.svg';

interface JobMatchingPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (preferences: JobMatchingPreferences) => void;
}

export function JobMatchingPreferencesModal({ isOpen, onClose, onConfirm }: JobMatchingPreferencesModalProps) {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [minSalary, setMinSalary] = useState<number | null>(null);
  const [salaryCurrency, setSalaryCurrency] = useState<string>('USD');
  
  // Skills editing
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 'Intermediate' });

  // Scroll indicator state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  // Check if content is scrollable and update indicator
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      // Hide indicator when user has scrolled near the bottom (within 50px)
      setShowScrollIndicator(scrollHeight - scrollTop - clientHeight > 50);
    }
  };

  // Fetch profile data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProfileData();
      // Reset scroll indicator when modal opens
      setShowScrollIndicator(true);
      // Reset salary fields when modal opens
      setMinSalary(null);
      setSalaryCurrency('USD');
    }
  }, [isOpen]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Invalidate profile cache to ensure fresh data
      invalidateCache('/api/profile');
      
      // Fetch profile and skills in parallel for better performance
      const [profileData, skillsData] = await Promise.allSettled([
        profileApi.getProfile(),
        skillsApi.getSkills()
      ]);
      
      // Use skills from direct API call (more reliable), fallback to profile skills
      if (skillsData.status === 'fulfilled' && skillsData.value.length > 0) {
        setSkills(skillsData.value);
        console.log('Skills loaded from skills API:', skillsData.value);
      } else if (profileData.status === 'fulfilled' && profileData.value.skills && profileData.value.skills.length > 0) {
        // Map profile skills to ensure proficiency_level field exists
        const mappedSkills = profileData.value.skills.map((skill: any) => ({
          ...skill,
          proficiency_level: skill.proficiency_level || skill.proficiency || 'Intermediate'
        }));
        setSkills(mappedSkills);
        console.log('Skills loaded from profile (fallback):', mappedSkills);
      } else {
        setSkills([]);
        console.log('No skills found - skillsData:', skillsData, 'profileData:', profileData);
      }
      
      // Set preferred locations from profile
      if (profileData.status === 'fulfilled' && profileData.value.current_location) {
        setPreferredLocations([profileData.value.current_location]);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name.trim()) return;
    
    try {
      const skill = await skillsApi.addSkill({
        name: newSkill.name.trim(),
        proficiency_level: newSkill.proficiency as 'Beginner' | 'Intermediate' | 'Expert'
      });
      setSkills([...skills, skill]);
      setNewSkill({ name: '', proficiency: 'Intermediate' });
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Failed to add skill. Please try again.');
    }
  };

  const handleUpdateSkill = async (skillId: string, skill: Skill) => {
    try {
      const updated = await skillsApi.updateSkill(skillId, {
        name: skill.name,
        proficiency_level: skill.proficiency_level
      });
      setSkills(skills.map(s => s.id === skillId ? updated : s));
      setEditingSkill(null);
    } catch (error) {
      console.error('Error updating skill:', error);
      alert('Failed to update skill. Please try again.');
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    
    try {
      await skillsApi.deleteSkill(skillId);
      setSkills(skills.filter(s => s.id !== skillId));
    } catch (error) {
      console.error('Error deleting skill:', error);
      alert('Failed to delete skill. Please try again.');
    }
  };

  const handleAddLocation = () => {
    if (newLocation.trim() && !preferredLocations.includes(newLocation.trim())) {
      setPreferredLocations([...preferredLocations, newLocation.trim()]);
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (location: string) => {
    setPreferredLocations(preferredLocations.filter(l => l !== location));
  };

  const handleConfirm = async () => {
    if (skills.length === 0) {
      alert('Please add at least one skill');
      return;
    }

    const preferences: JobMatchingPreferences = {
      skills,
      preferredLocations,
      minSalary: minSalary,
      salaryCurrency: salaryCurrency,
    };

    try {
      setLoading(true);
      await apiCall('/api/job-matcher/preferences', {
        method: 'POST',
        body: JSON.stringify({
          preferredLocations: preferences.preferredLocations,
          minSalary: preferences.minSalary,
          salaryCurrency: preferences.salaryCurrency,
        }),
      });
      
      onConfirm(preferences);
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && skills.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#295acf]">Loading</DialogTitle>
            <DialogDescription>Loading profile data...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#295acf]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border-0 shadow-2xl">
        <DialogHeader className="relative pb-6 border-b border-gray-200/60 bg-white -m-6 mb-0 px-8 pt-8 rounded-t-lg">
          <div className="flex items-center gap-4">
            {/* Logo container with enhanced styling */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#295acf] to-blue-600 rounded-2xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
              <div className="relative p-3 bg-white rounded-2xl shadow-lg border border-gray-100 ring-1 ring-gray-200/50 group-hover:shadow-xl group-hover:ring-[#295acf]/20 transition-all duration-300">
                <img 
                  src={ColoredLogoHorizontal} 
                  alt="JobStalker AI" 
                  className="h-7 w-auto"
                />
              </div>
            </div>
            
            {/* Title and description */}
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-1.5 tracking-tight">
                Job Matching Preferences
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-sm leading-relaxed">
                Set your skills and preferred locations to find matching jobs.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content - with visible scrollbar */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto py-6 px-1 space-y-8 scrollbar-thin scrollbar-thumb-[#295acf]/30 scrollbar-track-gray-100 hover:scrollbar-thumb-[#295acf]/50 relative" 
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(41, 90, 207, 0.3) #f3f4f6' }}
        >
          {/* Skills Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
              <div className="p-2 bg-gradient-to-br from-[#295acf] to-blue-600 rounded-lg">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <Label className="text-lg font-bold text-gray-900">Your Skills *</Label>
                <p className="text-sm text-gray-600 mt-0.5">Add or edit your skills from your profile</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {skills.length === 0 && !loading && (
                <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Code className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-1">No skills found in your profile</p>
                  <p className="text-sm text-gray-500">Add skills below to get started with job matching</p>
                </div>
              )}
              {skills.map((skill, index) => (
                <Card key={skill.id || `skill-${index}`} className="border border-gray-200 hover:border-[#295acf]/30 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4">
                    {editingSkill === skill.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={skill.name}
                          onChange={(e) => setSkills(skills.map(s => 
                            s.id === skill.id ? { ...s, name: e.target.value } : s
                          ))}
                          className="flex-1 border-gray-300 focus:border-[#295acf] focus:ring-[#295acf]"
                          autoFocus
                        />
                        <Select
                          value={skill.proficiency_level || 'Intermediate'}
                          onValueChange={(value) => setSkills(skills.map(s => 
                            s.id === skill.id ? { ...s, proficiency_level: value as 'Beginner' | 'Intermediate' | 'Expert' } : s
                          ))}
                        >
                          <SelectTrigger className="w-36 border-gray-300 focus:border-[#295acf] focus:ring-[#295acf]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="bg-[#295acf] hover:bg-blue-700 text-white"
                          onClick={() => {
                            const updatedSkill = skills.find(s => s.id === skill.id);
                            if (updatedSkill) handleUpdateSkill(skill.id!, updatedSkill);
                          }}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingSkill(null)}
                          className="hover:bg-gray-100"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-gradient-to-r from-[#295acf] to-blue-600 text-white border-0 px-3 py-1 font-semibold">
                            {skill.name}
                          </Badge>
                          <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                            {skill.proficiency_level || 'Intermediate'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSkill(skill.id!)}
                            className="hover:bg-blue-50 hover:text-[#295acf]"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSkill(skill.id!)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              <Card className="border-2 border-dashed border-[#295acf]/30 bg-gradient-to-br from-[#295acf]/5 to-blue-50/30 hover:border-[#295acf]/50 transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a new skill"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                      className="flex-1 border-gray-300 focus:border-[#295acf] focus:ring-[#295acf] bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddSkill();
                        }
                      }}
                    />
                    <Select
                      value={newSkill.proficiency}
                      onValueChange={(value) => setNewSkill({ ...newSkill, proficiency: value })}
                    >
                      <SelectTrigger className="w-36 border-gray-300 focus:border-[#295acf] focus:ring-[#295acf] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleAddSkill}
                      className="bg-gradient-to-r from-[#295acf] to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Preferred Locations Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
              <div className="p-2 bg-gradient-to-br from-[#295acf] to-blue-600 rounded-lg">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <Label className="text-lg font-bold text-gray-900">Preferred Locations</Label>
                <p className="text-sm text-gray-600 mt-0.5">Where would you like to work?</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., San Francisco, New York, Remote"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLocation();
                  }
                }}
                className="flex-1 border-gray-300 focus:border-[#295acf] focus:ring-[#295acf]"
              />
              <Button 
                onClick={handleAddLocation} 
                className="bg-gradient-to-r from-[#295acf] to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {preferredLocations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {preferredLocations.map((loc) => (
                  <Badge 
                    key={loc} 
                    className="flex items-center gap-2 bg-gradient-to-r from-[#295acf] to-blue-600 text-white border-0 px-4 py-1.5 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <MapPin className="w-3 h-3" />
                    {loc}
                    <button
                      onClick={() => handleRemoveLocation(loc)}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-2" />

          {/* Salary Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
              <div className="p-2 bg-gradient-to-br from-[#295acf] to-blue-600 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <Label className="text-lg font-bold text-gray-900">Minimum Salary (Optional)</Label>
                <p className="text-sm text-gray-600 mt-0.5">Set your minimum expected salary</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="e.g., 100000"
                value={minSalary || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setMinSalary(value ? parseInt(value, 10) : null);
                }}
                min="0"
                step="1000"
                className="flex-1 border-gray-300 focus:border-[#295acf] focus:ring-[#295acf]"
              />
              <Select
                value={salaryCurrency}
                onValueChange={setSalaryCurrency}
              >
                <SelectTrigger className="w-32 border-gray-300 focus:border-[#295acf] focus:ring-[#295acf]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {minSalary && (
              <p className="text-sm text-gray-600">
                Minimum salary: {minSalary.toLocaleString()} {salaryCurrency} per year
              </p>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        {showScrollIndicator && (
          <div className="flex justify-center py-2 bg-gradient-to-t from-white via-white to-transparent -mt-8 pt-8 pointer-events-none">
            <div className="flex flex-col items-center text-gray-400 animate-bounce">
              <span className="text-xs font-medium mb-1">Scroll for more</span>
              <ChevronDown className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 bg-gray-50/50 -m-6 mt-0 px-6 pb-6 rounded-b-lg">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-gray-300 hover:bg-gray-100 text-gray-700 font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || skills.length === 0}
            className="bg-gradient-to-r from-[#295acf] to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Start Matching Jobs
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
