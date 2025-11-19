import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Trash2, User, Link2, Briefcase, GraduationCap, Code, Globe, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { profileApi, skillsApi, experienceApi, educationApi, languagesApi } from '@/lib/api';
import { SocialLink, CreateSkillData, CreateExperienceData, CreateEducationData, CreateLanguageData } from '@/lib/types';
import ColoredLogoHorizontal from '@/assets/ColoredLogoHorizontal.svg';

interface WorkExperienceForm {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

interface EducationForm {
  id: string;
  school: string;
  degree: string;
  graduationYear: string;
}

interface SkillForm {
  id: string;
  name: string;
  category: string;
  level: string;
}

interface LanguageForm {
  id: string;
  language: string;
  proficiency: string;
}

const STEPS = [
  { id: 1, name: 'Personal Info', icon: User, color: 'blue' },
  { id: 2, name: 'Professional Links', icon: Link2, color: 'teal' },
  { id: 3, name: 'Work Experience', icon: Briefcase, color: 'blue' },
  { id: 4, name: 'Education', icon: GraduationCap, color: 'teal' },
  { id: 5, name: 'Skills', icon: Code, color: 'blue' },
  { id: 6, name: 'Languages', icon: Globe, color: 'teal' },
];

export function RegistrationComplete() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Personal Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [jobPosition, setJobPosition] = useState('');
  const [professionalSummary, setProfessionalSummary] = useState('');

  // Social Links
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { platform: 'LinkedIn', url: '' }
  ]);

  // Work Experience
  const [workExperience, setWorkExperience] = useState<WorkExperienceForm[]>([]);

  // Education
  const [education, setEducation] = useState<EducationForm[]>([]);

  // Skills
  const [skills, setSkills] = useState<SkillForm[]>([]);

  // Languages
  const [languages, setLanguages] = useState<LanguageForm[]>([]);

  useEffect(() => {
    // Pre-fill email from auth user
    const loadUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    loadUserEmail();
  }, []);

  // Prevent auto-submission when reaching step 6
  useEffect(() => {
    if (currentStep === STEPS.length && !isSubmitting) {
      console.log('Reached step 6 - preventing any auto-submission');
      // Ensure we're not submitting automatically
      setIsSubmitting(false);
    }
  }, [currentStep, isSubmitting]);

  const validateStep = (step: number): boolean => {
    setError(null);
    
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
        setError('Please fill in all required fields');
        return false;
      }
    }
    // Other steps are optional, so no validation needed
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        const nextStepNumber = currentStep + 1;
        console.log(`Moving from step ${currentStep} to step ${nextStepNumber}`);
        setCurrentStep(nextStepNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        console.log('Already on last step, cannot go to next step');
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: 'LinkedIn', url: '' }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  const addWorkExperience = () => {
    setWorkExperience([
      ...workExperience,
      {
        id: Date.now().toString(),
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: ''
      }
    ]);
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperience(workExperience.filter(exp => exp.id !== id));
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperienceForm, value: any) => {
    setWorkExperience(workExperience.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const addEducation = () => {
    setEducation([
      ...education,
      {
        id: Date.now().toString(),
        school: '',
        degree: '',
        graduationYear: ''
      }
    ]);
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id));
  };

  const updateEducation = (id: string, field: keyof EducationForm, value: string) => {
    setEducation(education.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const addSkill = () => {
    setSkills([
      ...skills,
      {
        id: Date.now().toString(),
        name: '',
        category: 'Technical',
        level: 'Intermediate'
      }
    ]);
  };

  const removeSkill = (id: string) => {
    setSkills(skills.filter(skill => skill.id !== id));
  };

  const updateSkill = (id: string, field: keyof SkillForm, value: string) => {
    setSkills(skills.map(skill => 
      skill.id === id ? { ...skill, [field]: value } : skill
    ));
  };

  const addLanguage = () => {
    setLanguages([
      ...languages,
      {
        id: Date.now().toString(),
        language: '',
        proficiency: 'Intermediate'
      }
    ]);
  };

  const removeLanguage = (id: string) => {
    setLanguages(languages.filter(lang => lang.id !== id));
  };

  const updateLanguage = (id: string, field: keyof LanguageForm, value: string) => {
    setLanguages(languages.map(lang => 
      lang.id === id ? { ...lang, [field]: value } : lang
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log(`handleSubmit called on step ${currentStep}, STEPS.length is ${STEPS.length}`);
    
    // Only allow submission on the last step
    if (currentStep !== STEPS.length) {
      console.log('Not on last step, returning early');
      return;
    }
    
    if (!validateStep(currentStep)) {
      console.log('Validation failed, returning early');
      return;
    }

    console.log('Starting profile submission...');
    setIsSubmitting(true);
    setLoading(true);
    setError(null);

    try {
      // Update profile with personal information
      // Note: email is managed by auth.users, not stored in user_profile
      // Now saving first_name and last_name since columns exist in database
      await profileApi.updateProfile({
        full_name: `${firstName} ${lastName}`.trim() || 'User',
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        phone: phone,
        job_title: jobPosition || undefined,
        location: location || undefined,
        professional_summary: professionalSummary || undefined,
        social_links: socialLinks.filter(link => link.url.trim() !== ''),
      });

      // Save work experience
      for (const exp of workExperience) {
        if (exp.title && exp.company) {
          await experienceApi.addExperience({
            title: exp.title,
            company: exp.company,
            start_date: exp.startDate || undefined,
            end_date: exp.isCurrent ? undefined : (exp.endDate || undefined),
            is_current: exp.isCurrent,
            description: exp.description || undefined,
          });
        }
      }

      // Save education
      for (const edu of education) {
        if (edu.school) {
          await educationApi.addEducation({
            school: edu.school,
            degree: edu.degree || undefined,
            start_date: undefined,
            end_date: edu.graduationYear ? `${edu.graduationYear}-01-01` : undefined,
          });
        }
      }

      // Save skills
      for (const skill of skills) {
        if (skill.name) {
          await skillsApi.addSkill({
            name: skill.name,
            proficiency_level: skill.level as 'Beginner' | 'Intermediate' | 'Expert',
          });
        }
      }

      // Save languages
      for (const lang of languages) {
        if (lang.language) {
          await languagesApi.createLanguage({
            language: lang.language,
            proficiency: lang.proficiency as 'Beginner' | 'Intermediate' | 'Advanced' | 'Native',
          });
        }
      }

      // Mark profile as completed ONLY after all steps are done
      await profileApi.completeProfile();

      // Mark as submitted before redirecting
      setIsSubmitting(true);
      
      // Redirect to dashboard
      console.log('Profile completed successfully, redirecting to dashboard');
      navigate('/dashboard');
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep - 1];
  const IconComponent = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <img src={ColoredLogoHorizontal} alt="JobStalker AI" className="h-12" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Complete Your Profile</h1>
          <p className="text-lg text-slate-600 font-medium mb-4">
            Step {currentStep} of {STEPS.length}: {currentStepData.name}
          </p>
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-200 rounded-xl p-4 mb-6">
            <p className="text-slate-700 font-medium">
              <span className="text-sky-600 font-bold">💡 Did you know?</span> Completing your profile helps us create better resumes and applications, making your job search <span className="text-sky-600 font-semibold">60% more effective</span>! 
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Fill out all the essential information below to unlock all features and make your job search process as smooth and efficient as possible.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index + 1 < currentStep;
              const isCurrent = index + 1 === currentStep;
              
              const getStepColorClasses = () => {
                if (isCompleted) return 'bg-sky-500 border-sky-500 text-white shadow-md';
                if (isCurrent) {
                  const colorMap: Record<string, string> = {
                    blue: 'bg-sky-500 border-sky-500 text-white shadow-lg scale-105',
                    teal: 'bg-cyan-500 border-cyan-500 text-white shadow-lg scale-105',
                  };
                  return colorMap[step.color] || 'bg-sky-500 border-sky-500 text-white shadow-lg scale-105';
                }
                return 'bg-white border-slate-300 text-slate-400';
              };
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${getStepColorClasses()}`}>
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 -mt-6 transition-all duration-300 rounded-full ${isCompleted ? 'bg-sky-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 shadow-inner">
            <div 
              className="bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-500 h-2.5 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault(); // ALWAYS prevent form submission
            e.stopPropagation(); // Stop event propagation
            console.log('Form onSubmit triggered - PREVENTED. Only button click can submit.');
            return false; // Extra safety
          }} 
          onKeyDown={(e) => {
            // ALWAYS prevent Enter key from submitting form
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              console.log('Enter key pressed - PREVENTED form submission');
              // If on last step and user wants to submit, they must click the button
              return false;
            }
          }}
          onKeyPress={(e) => {
            // Prevent Enter key press as well
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }}
          className="space-y-6"
          noValidate
        >
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <Card className="border border-slate-200 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-5 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-500 rounded-xl shadow-sm">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-slate-900">Personal Information</CardTitle>
                    <CardDescription className="text-slate-600 mt-1.5">
                      Tell us about yourself. This information helps us create professional resumes and personalized application materials.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-7 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="John"
                      className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="Doe"
                      className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="john@example.com"
                      className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                      Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="+1 (555) 123-4567"
                      className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="location" className="text-sm font-semibold text-slate-700">
                      Location <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., New York, USA"
                      className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="jobPosition" className="text-sm font-semibold text-slate-700">
                      Job Position <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="jobPosition"
                      value={jobPosition}
                      onChange={(e) => setJobPosition(e.target.value)}
                      placeholder="e.g., Senior Software Engineer"
                      className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="professionalSummary" className="text-sm font-semibold text-slate-700">
                    Professional Summary <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                  </Label>
                  <Textarea
                    id="professionalSummary"
                    value={professionalSummary}
                    onChange={(e) => setProfessionalSummary(e.target.value)}
                    placeholder="Write a brief 2-3 sentence summary of your career goals, key strengths, and what you offer as a professional..."
                    rows={5}
                    className="resize-y border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Professional Links */}
          {currentStep === 2 && (
            <Card className="border border-slate-200 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-5 border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-sky-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-500 rounded-xl shadow-sm">
                    <Link2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-slate-900">Professional Links</CardTitle>
                    <CardDescription className="text-slate-600 mt-1.5">
                      Add your social and professional profiles. These links will be included in your resume and help employers learn more about your work.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-7 space-y-5">
                {socialLinks.map((link, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-4 p-5 bg-slate-50/80 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1 space-y-2.5">
                      <Label className="text-sm font-semibold text-slate-700">Platform</Label>
                      <Select
                        value={link.platform}
                        onValueChange={(value) => updateSocialLink(index, 'platform', value)}
                      >
                        <SelectTrigger className="w-full h-12 border-slate-300 bg-white">
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
                    <div className="flex-1 space-y-2.5">
                      <Label className="text-sm font-semibold text-slate-700">Profile URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={link.url}
                          onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                          placeholder="https://linkedin.com/in/yourprofile"
                          className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all bg-white"
                        />
                        {socialLinks.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSocialLink(index)}
                            className="h-12 w-12 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addSocialLink} 
                  className="w-full h-12 border-2 border-dashed border-slate-300 hover:border-cyan-400 hover:bg-cyan-50/50 text-slate-700 font-medium rounded-xl transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Link
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Work Experience */}
          {currentStep === 3 && (
            <Card className="border border-slate-200 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-5 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-500 rounded-xl shadow-sm">
                      <Briefcase className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-slate-900">Work Experience</CardTitle>
                      <CardDescription className="text-slate-600 mt-1.5">
                        Add your professional work history. This information is essential for building a comprehensive resume and showcasing your expertise.
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    onClick={addWorkExperience} 
                    variant="outline"
                    className="border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 rounded-xl transition-all shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-7 space-y-6">
                {workExperience.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
                    <Briefcase className="h-14 w-14 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 font-semibold text-lg">No work experience added yet</p>
                    <p className="text-sm text-slate-400 mt-2">Click "Add Experience" to get started</p>
                  </div>
                ) : (
                  workExperience.map((exp) => (
                    <div key={exp.id} className="border border-slate-200 rounded-2xl p-6 bg-gradient-to-br from-white to-slate-50/50 space-y-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-sm font-semibold text-slate-700">Job Title</Label>
                          <Input
                            value={exp.title}
                            onChange={(e) => updateWorkExperience(exp.id, 'title', e.target.value)}
                            placeholder="e.g., Senior Developer"
                            className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all bg-white"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-sm font-semibold text-slate-700">Company</Label>
                          <Input
                            value={exp.company}
                            onChange={(e) => updateWorkExperience(exp.id, 'company', e.target.value)}
                            placeholder="e.g., Tech Company Inc."
                            className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all bg-white"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-sm font-semibold text-slate-700">Start Date</Label>
                          <Input
                            type="date"
                            value={exp.startDate}
                            onChange={(e) => updateWorkExperience(exp.id, 'startDate', e.target.value)}
                            className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all bg-white"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-sm font-semibold text-slate-700">End Date</Label>
                          <Input
                            type="date"
                            value={exp.endDate}
                            onChange={(e) => updateWorkExperience(exp.id, 'endDate', e.target.value)}
                            disabled={exp.isCurrent}
                            className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all bg-white disabled:bg-slate-100"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`current-${exp.id}`}
                          checked={exp.isCurrent}
                          onChange={(e) => updateWorkExperience(exp.id, 'isCurrent', e.target.checked)}
                          className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                        />
                        <Label htmlFor={`current-${exp.id}`} className="text-sm font-medium text-slate-700 cursor-pointer">
                          I currently work here
                        </Label>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-sm font-semibold text-slate-700">
                          Description <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                        </Label>
                        <Textarea
                          value={exp.description}
                          onChange={(e) => updateWorkExperience(exp.id, 'description', e.target.value)}
                          placeholder="Describe your role and achievements..."
                          rows={3}
                          className="resize-y border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all bg-white"
                        />
                      </div>
                      <div className="flex justify-end pt-3 border-t border-slate-200">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWorkExperience(exp.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                {workExperience.length > 0 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addWorkExperience} 
                    className="w-full h-12 border-2 border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50/50 text-slate-700 font-medium rounded-xl transition-all"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Experience
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Education */}
          {currentStep === 4 && (
            <Card className="border border-slate-200 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-5 border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-sky-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-500 rounded-xl shadow-sm">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-slate-900">Education</CardTitle>
                      <CardDescription className="text-slate-600 mt-1.5">
                        Add your educational background. Your qualifications will be prominently featured in your resume and application materials.
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    onClick={addEducation} 
                    variant="outline"
                    className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-400 rounded-xl transition-all shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Education
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-7 space-y-6">
                {education.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
                    <GraduationCap className="h-14 w-14 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 font-semibold text-lg">No education added yet</p>
                    <p className="text-sm text-slate-400 mt-2">Click "Add Education" to get started</p>
                  </div>
                ) : (
                  education.map((edu) => (
                    <div key={edu.id} className="border border-slate-200 rounded-2xl p-6 bg-gradient-to-br from-white to-slate-50/50 space-y-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-sm font-semibold text-slate-700">School/University</Label>
                          <Input
                            value={edu.school}
                            onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                            placeholder="e.g., MIT, Stanford University"
                            className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all bg-white"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-sm font-semibold text-slate-700">Degree</Label>
                          <Input
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            placeholder="e.g., Bachelor, Master, PhD"
                            className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all bg-white"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-sm font-semibold text-slate-700">Graduation Year</Label>
                          <Input
                            value={edu.graduationYear}
                            onChange={(e) => updateEducation(edu.id, 'graduationYear', e.target.value)}
                            placeholder="e.g., 2020"
                            className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-3 border-t border-slate-200">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEducation(edu.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                {education.length > 0 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addEducation} 
                    className="w-full h-12 border-2 border-dashed border-slate-300 hover:border-cyan-400 hover:bg-cyan-50/50 text-slate-700 font-medium rounded-xl transition-all"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Education
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Skills */}
          {currentStep === 5 && (
            <Card className="border border-slate-200 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-5 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-500 rounded-xl shadow-sm">
                      <Code className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-slate-900">Skills</CardTitle>
                      <CardDescription className="text-slate-600 mt-1.5">
                        Add your professional skills. These skills will be highlighted in your resume and help showcase your capabilities to employers.
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    onClick={addSkill} 
                    variant="outline"
                    className="border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 rounded-xl transition-all shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skill
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-7 space-y-5">
                {skills.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
                    <Code className="h-14 w-14 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 font-semibold text-lg">No skills added yet</p>
                    <p className="text-sm text-slate-400 mt-2">Click "Add Skill" to get started</p>
                  </div>
                ) : (
                  <>
                    {skills.map((skill) => (
                      <div key={skill.id} className="flex flex-col sm:flex-row gap-4 p-5 bg-slate-50/80 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1 space-y-2.5">
                          <Label className="text-sm font-semibold text-slate-700">Skill Name</Label>
                          <Input
                            value={skill.name}
                            onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                            placeholder="e.g., React, Leadership"
                            className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all bg-white"
                          />
                        </div>
                        <div className="sm:w-40 space-y-2.5">
                          <Label className="text-sm font-semibold text-slate-700">Category</Label>
                          <Select
                            value={skill.category}
                            onValueChange={(value) => updateSkill(skill.id, 'category', value)}
                          >
                            <SelectTrigger className="w-full h-12 border-slate-300 bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Technical">Technical</SelectItem>
                              <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                              <SelectItem value="Languages">Languages</SelectItem>
                              <SelectItem value="Tools">Tools</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:w-40 space-y-2.5">
                          <Label className="text-sm font-semibold text-slate-700">Level</Label>
                          <Select
                            value={skill.level}
                            onValueChange={(value) => updateSkill(skill.id, 'level', value)}
                          >
                            <SelectTrigger className="w-full h-12 border-slate-300 bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                              <SelectItem value="Expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSkill(skill.id)}
                            className="h-12 w-12 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addSkill} 
                      className="w-full h-12 border-2 border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50/50 text-slate-700 font-medium rounded-xl transition-all"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Skill
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 6: Languages */}
          {currentStep === 6 && (
            <Card className="border border-slate-200 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-5 border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-sky-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-500 rounded-xl shadow-sm">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-slate-900">Languages</CardTitle>
                      <CardDescription className="text-slate-600 mt-1.5">
                        Add languages you speak. Language skills are valuable assets that will be included in your resume and profile.
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    onClick={addLanguage} 
                    variant="outline"
                    className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-400 rounded-xl transition-all shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Language
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-7 space-y-5">
                {languages.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
                    <Globe className="h-14 w-14 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 font-semibold text-lg">No languages added yet</p>
                    <p className="text-sm text-slate-400 mt-2">Click "Add Language" to get started</p>
                  </div>
                ) : (
                  <>
                    {languages.map((lang) => (
                      <div key={lang.id} className="flex flex-col sm:flex-row gap-4 p-5 bg-slate-50/80 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1 space-y-2.5">
                          <Label className="text-sm font-semibold text-slate-700">Language</Label>
                          <Input
                            value={lang.language}
                            onChange={(e) => updateLanguage(lang.id, 'language', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                              }
                            }}
                            placeholder="e.g., English, Spanish"
                            className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all bg-white"
                          />
                        </div>
                        <div className="sm:w-48 space-y-2.5">
                          <Label className="text-sm font-semibold text-slate-700">Proficiency</Label>
                          <Select
                            value={lang.proficiency}
                            onValueChange={(value) => updateLanguage(lang.id, 'proficiency', value)}
                          >
                            <SelectTrigger className="w-full h-12 border-slate-300 bg-white">
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
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLanguage(lang.id)}
                            className="h-12 w-12 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={addLanguage} 
                      className="w-full h-12 border-2 border-dashed border-slate-300 hover:border-cyan-400 hover:bg-cyan-50/50 text-slate-700 font-medium rounded-xl transition-all"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Language
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50/90 border border-red-200 rounded-2xl p-5 shadow-md backdrop-blur-sm">
              <p className="text-red-700 font-semibold flex items-center gap-2.5">
                <X className="h-5 w-5" />
                {error}
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-8 pb-6 border-t border-slate-200 bg-white/50 backdrop-blur-sm -mx-4 px-4 rounded-2xl mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="h-12 px-8 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-medium transition-all shadow-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={nextStep}
                className="h-12 px-10 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl rounded-xl transition-all duration-200"
              >
                Next Step
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Complete Registration button clicked, calling handleSubmit');
                  handleSubmit(e as any);
                }}
                disabled={loading || isSubmitting}
                className="h-12 px-10 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <Check className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
