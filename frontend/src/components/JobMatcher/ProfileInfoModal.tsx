import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { profileApi, skillsApi, experienceApi, educationApi } from '@/lib/api';
import { Profile, Skill, WorkExperience, Education } from '@/lib/types';
import { Plus, Trash2, Edit2, Save, X, Briefcase, GraduationCap, Code } from 'lucide-react';

interface ProfileInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ProfileInfoModal({ isOpen, onClose, onConfirm }: ProfileInfoModalProps) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  
  // Editing states
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [editingExperience, setEditingExperience] = useState<string | null>(null);
  const [editingEducation, setEditingEducation] = useState<string | null>(null);
  
  // New item states
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 'Intermediate' });
  const [newExperience, setNewExperience] = useState({
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: ''
  });
  const [newEducation, setNewEducation] = useState({
    school: '',
    degree: '',
    field: '',
    start_date: '',
    end_date: ''
  });

  // Fetch profile data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProfileData();
    }
  }, [isOpen]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const profileData = await profileApi.getProfile();
      setProfile(profileData);
      setSkills(profileData.skills || []);
      setWorkExperience(profileData.work_experience || []);
      setEducation(profileData.education || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Skills handlers
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

  // Work Experience handlers
  const handleAddExperience = async () => {
    if (!newExperience.title.trim() || !newExperience.company.trim()) {
      alert('Please fill in at least title and company');
      return;
    }
    
    try {
      const exp = await experienceApi.addExperience({
        title: newExperience.title.trim(),
        company: newExperience.company.trim(),
        location: newExperience.location.trim() || undefined,
        start_date: newExperience.start_date || undefined,
        end_date: newExperience.is_current ? undefined : (newExperience.end_date || undefined),
        is_current: newExperience.is_current,
        description: newExperience.description.trim() || undefined
      });
      setWorkExperience([...workExperience, exp]);
      setNewExperience({
        title: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: ''
      });
    } catch (error) {
      console.error('Error adding experience:', error);
      alert('Failed to add work experience. Please try again.');
    }
  };

  const handleUpdateExperience = async (expId: string, exp: WorkExperience) => {
    try {
      const updated = await experienceApi.updateExperience(expId, {
        title: exp.title,
        company: exp.company,
        location: exp.location || undefined,
        start_date: exp.start_date,
        end_date: exp.end_date,
        is_current: exp.is_current,
        description: exp.description
      });
      setWorkExperience(workExperience.map(e => e.id === expId ? updated : e));
      setEditingExperience(null);
    } catch (error) {
      console.error('Error updating experience:', error);
      alert('Failed to update work experience. Please try again.');
    }
  };

  const handleDeleteExperience = async (expId: string) => {
    if (!confirm('Are you sure you want to delete this work experience?')) return;
    
    try {
      await experienceApi.deleteExperience(expId);
      setWorkExperience(workExperience.filter(e => e.id !== expId));
    } catch (error) {
      console.error('Error deleting experience:', error);
      alert('Failed to delete work experience. Please try again.');
    }
  };

  // Education handlers
  const handleAddEducation = async () => {
    if (!newEducation.school.trim()) {
      alert('Please fill in at least school name');
      return;
    }
    
    try {
      const edu = await educationApi.addEducation({
        school: newEducation.school.trim(),
        degree: newEducation.degree?.trim() || '',
        start_date: newEducation.start_date || undefined,
        end_date: newEducation.end_date || undefined
      });
      setEducation([...education, edu]);
      setNewEducation({
        school: '',
        degree: '',
        field: '',
        start_date: '',
        end_date: ''
      });
    } catch (error) {
      console.error('Error adding education:', error);
      alert('Failed to add education. Please try again.');
    }
  };

  const handleUpdateEducation = async (eduId: string, edu: Education) => {
    try {
      const updated = await educationApi.updateEducation(eduId, {
        school: edu.school,
        degree: edu.degree,
        start_date: edu.start_date,
        end_date: edu.end_date
      });
      setEducation(education.map(e => e.id === eduId ? updated : e));
      setEditingEducation(null);
    } catch (error) {
      console.error('Error updating education:', error);
      alert('Failed to update education. Please try again.');
    }
  };

  const handleDeleteEducation = async (eduId: string) => {
    if (!confirm('Are you sure you want to delete this education?')) return;
    
    try {
      await educationApi.deleteEducation(eduId);
      setEducation(education.filter(e => e.id !== eduId));
    } catch (error) {
      console.error('Error deleting education:', error);
      alert('Failed to delete education. Please try again.');
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Your Profile Information</DialogTitle>
          <DialogDescription>
            Review and update your skills, work experience, and education for job matching
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Skills Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Skills</h3>
              </div>
            </div>
            
            <div className="space-y-3">
              {skills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  {editingSkill === skill.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={skill.name}
                        onChange={(e) => setSkills(skills.map(s => 
                          s.id === skill.id ? { ...s, name: e.target.value } : s
                        ))}
                        className="flex-1"
                      />
                      <Select
                        value={skill.proficiency_level || 'Intermediate'}
                        onValueChange={(value) => setSkills(skills.map(s => 
                          s.id === skill.id ? { ...s, proficiency_level: value as 'Beginner' | 'Intermediate' | 'Expert' } : s
                        ))}
                      >
                        <SelectTrigger className="w-32">
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
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{skill.name}</Badge>
                        <span className="text-sm text-gray-500">
                          ({skill.proficiency_level || 'Intermediate'})
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingSkill(skill.id!)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSkill(skill.id!)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {/* Add new skill */}
              <div className="flex gap-2 p-3 border-2 border-dashed rounded-lg">
                <Input
                  placeholder="Skill name"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="flex-1"
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
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddSkill}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Work Experience Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Work Experience</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              {workExperience.map((exp) => (
                <div key={exp.id} className="p-4 bg-gray-50 rounded-lg">
                  {editingExperience === exp.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Job Title</Label>
                          <Input
                            value={exp.title}
                            onChange={(event) => setWorkExperience(workExperience.map(expItem => 
                              expItem.id === exp.id ? { ...expItem, title: event.target.value } : expItem
                            ))}
                          />
                        </div>
                        <div>
                          <Label>Company</Label>
                          <Input
                            value={exp.company}
                            onChange={(event) => setWorkExperience(workExperience.map(expItem => 
                              expItem.id === exp.id ? { ...expItem, company: event.target.value } : expItem
                            ))}
                          />
                        </div>
                      </div>
                      <div>
                        <div>
                          <Label>Location</Label>
                          <Input
                            value={exp.location || ''}
                            onChange={(event) => setWorkExperience(workExperience.map(expItem => 
                              expItem.id === exp.id ? { ...expItem, location: event.target.value } : expItem
                            ))}
                            placeholder="City, State/Country"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={exp.start_date ? new Date(exp.start_date).toISOString().split('T')[0] : ''}
                            onChange={(event) => setWorkExperience(workExperience.map(expItem => 
                              expItem.id === exp.id ? { ...expItem, start_date: event.target.value } : expItem
                            ))}
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={exp.end_date ? new Date(exp.end_date).toISOString().split('T')[0] : ''}
                            onChange={(event) => setWorkExperience(workExperience.map(expItem => 
                              expItem.id === exp.id ? { ...expItem, end_date: event.target.value } : expItem
                            ))}
                            disabled={exp.is_current}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`current-${exp.id}`}
                          checked={exp.is_current}
                          onChange={(event) => setWorkExperience(workExperience.map(expItem => 
                            expItem.id === exp.id ? { ...expItem, is_current: event.target.checked, end_date: event.target.checked ? undefined : expItem.end_date } : expItem
                          ))}
                          className="w-4 h-4"
                        />
                        <Label htmlFor={`current-${exp.id}`} className="cursor-pointer">Current Position</Label>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={exp.description || ''}
                          onChange={(event) => setWorkExperience(workExperience.map(expItem => 
                            expItem.id === exp.id ? { ...expItem, description: event.target.value } : expItem
                          ))}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const updatedExp = workExperience.find(e => e.id === exp.id);
                            if (updatedExp) handleUpdateExperience(exp.id!, updatedExp);
                          }}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingExperience(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{exp.title}</h4>
                          <p className="text-sm text-gray-600">{exp.company}</p>
                          {exp.location && (
                            <p className="text-xs text-gray-500">{exp.location}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {exp.start_date && new Date(exp.start_date).toLocaleDateString()} - 
                            {exp.is_current ? ' Present' : (exp.end_date ? ' ' + new Date(exp.end_date).toLocaleDateString() : '')}
                          </p>
                          {exp.description && (
                            <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingExperience(exp.id!)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteExperience(exp.id!)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {/* Add new experience */}
              <div className="p-4 border-2 border-dashed rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Job Title"
                    value={newExperience.title}
                    onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                  />
                  <Input
                    placeholder="Company"
                    value={newExperience.company}
                    onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Location (City, State/Country)"
                  value={newExperience.location}
                  onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newExperience.start_date}
                      onChange={(e) => setNewExperience({ ...newExperience, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={newExperience.end_date}
                        onChange={(e) => setNewExperience({ ...newExperience, end_date: e.target.value })}
                        disabled={newExperience.is_current}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="new-current"
                          checked={newExperience.is_current}
                          onChange={(e) => setNewExperience({ ...newExperience, is_current: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="new-current" className="text-sm cursor-pointer">Current</Label>
                      </div>
                    </div>
                  </div>
                </div>
                <Textarea
                  placeholder="Job description and responsibilities"
                  value={newExperience.description}
                  onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                  rows={3}
                />
                <Button onClick={handleAddExperience} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Experience
                </Button>
              </div>
            </div>
          </div>

          {/* Education Section */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Education</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="p-4 bg-gray-50 rounded-lg">
                  {editingEducation === edu.id ? (
                    <div className="space-y-3">
                      <Input
                        placeholder="School"
                        value={edu.school}
                        onChange={(event) => setEducation(education.map(eduItem => 
                          eduItem.id === edu.id ? { ...eduItem, school: event.target.value } : eduItem
                        ))}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Degree"
                          value={edu.degree || ''}
                          onChange={(event) => setEducation(education.map(eduItem => 
                            eduItem.id === edu.id ? { ...eduItem, degree: event.target.value } : eduItem
                          ))}
                        />
                        <Input
                          placeholder="Field of Study"
                          value={edu.field || ''}
                          onChange={(event) => setEducation(education.map(eduItem => 
                            eduItem.id === edu.id ? { ...eduItem, field: event.target.value } : eduItem
                          ))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={edu.start_date ? new Date(edu.start_date).toISOString().split('T')[0] : ''}
                            onChange={(event) => setEducation(education.map(eduItem => 
                              eduItem.id === edu.id ? { ...eduItem, start_date: event.target.value } : eduItem
                            ))}
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={edu.end_date ? new Date(edu.end_date).toISOString().split('T')[0] : ''}
                            onChange={(event) => setEducation(education.map(eduItem => 
                              eduItem.id === edu.id ? { ...eduItem, end_date: event.target.value } : eduItem
                            ))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const updatedEdu = education.find(e => e.id === edu.id);
                            if (updatedEdu) handleUpdateEducation(edu.id!, updatedEdu);
                          }}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingEducation(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{edu.school}</h4>
                        {edu.degree && <p className="text-sm text-gray-600">{edu.degree}</p>}
                        {edu.field && <p className="text-sm text-gray-600">{edu.field}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          {edu.start_date && new Date(edu.start_date).toLocaleDateString()} - 
                          {edu.end_date ? ' ' + new Date(edu.end_date).toLocaleDateString() : ' Present'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingEducation(edu.id!)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteEducation(edu.id!)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add new education */}
              <div className="p-4 border-2 border-dashed rounded-lg space-y-3">
                <Input
                  placeholder="School Name"
                  value={newEducation.school}
                  onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Degree"
                    value={newEducation.degree}
                    onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                  />
                  <Input
                    placeholder="Field of Study"
                    value={newEducation.field}
                    onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newEducation.start_date}
                      onChange={(e) => setNewEducation({ ...newEducation, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newEducation.end_date}
                      onChange={(e) => setNewEducation({ ...newEducation, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddEducation} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Education
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
            Confirm & Start Matching
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

