import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useResumeBuilder } from '@/components/ResumeBuilder/context/ResumeBuilderContext';
import { AppHeader } from '@/components/Layout/AppHeader';
import { TemplateRenderer } from '@/components/ResumeBuilder/Templates/TemplateRenderer';
import { 
  Loader2, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  FileText,
  Save,
  Check,
  ArrowLeft,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { WorkExperience, Education, Skill } from '@/types/resume';

export function ResumeEditPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation() as any;
  const { 
    resumeData, 
    replaceResumeData, 
    selectedTemplate,
    setSelectedTemplate,
    currentResumeId,
    loadResume,
    updateResume,
  } = useResumeBuilder() as any;
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.7);
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    contacts: true,
    summary: false,
    experience: false,
    education: false,
    skills: false,
  });

  // Local form state for editing
  const [localData, setLocalData] = useState(resumeData);

  // Sync local data when resumeData changes (e.g., on load)
  useEffect(() => {
    if (resumeData) {
      setLocalData(resumeData);
    }
  }, [resumeData]);
  
  // Get template ID from URL params or context
  const templateIdFromUrl = searchParams.get('template');
  const templateId = templateIdFromUrl || selectedTemplate || 'modern-professional';
  const resumeIdFromUrl = searchParams.get('resume');

  useEffect(() => {
    if (templateIdFromUrl && templateIdFromUrl !== selectedTemplate) {
      setSelectedTemplate(templateIdFromUrl);
    }
  }, [templateIdFromUrl, selectedTemplate, setSelectedTemplate]);

  useEffect(() => {
    if (resumeIdFromUrl && resumeIdFromUrl !== currentResumeId) {
      loadResume(resumeIdFromUrl).catch((error: unknown) => {
        console.error('Error loading resume:', error);
      });
    }
  }, [resumeIdFromUrl, currentResumeId, loadResume]);

  useEffect(() => {
    if (state?.injectedResumeData) {
      replaceResumeData(state.injectedResumeData);
      setLocalData(state.injectedResumeData);
      state.injectedResumeData = undefined;
    }
  }, [state?.injectedResumeData, replaceResumeData]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Update handlers that sync to context
  const updatePersonalInfo = (field: string, value: string) => {
    const updated = {
      ...localData,
      personalInfo: { ...localData.personalInfo, [field]: value }
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const updateSummary = (value: string) => {
    const updated = { ...localData, summary: value };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const addWorkExperience = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: ''
    };
    const updated = {
      ...localData,
      workExperience: [...(localData.workExperience || []), newExp]
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const updateWorkExperience = (id: string, field: string, value: any) => {
    const updated = {
      ...localData,
      workExperience: localData.workExperience.map((exp: WorkExperience) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const removeWorkExperience = (id: string) => {
    const updated = {
      ...localData,
      workExperience: localData.workExperience.filter((exp: WorkExperience) => exp.id !== id)
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: ''
    };
    const updated = {
      ...localData,
      education: [...(localData.education || []), newEdu]
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const updateEducation = (id: string, field: string, value: any) => {
    const updated = {
      ...localData,
      education: localData.education.map((edu: Education) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const removeEducation = (id: string) => {
    const updated = {
      ...localData,
      education: localData.education.filter((edu: Education) => edu.id !== id)
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      name: '',
      category: 'Technical'
    };
    const updated = {
      ...localData,
      skills: [...(localData.skills || []), newSkill]
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const updateSkill = (id: string, field: string, value: any) => {
    const updated = {
      ...localData,
      skills: localData.skills.map((skill: Skill) =>
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const removeSkill = (id: string) => {
    const updated = {
      ...localData,
      skills: localData.skills.filter((skill: Skill) => skill.id !== id)
    };
    setLocalData(updated);
    replaceResumeData(updated);
  };

  const handleSave = async () => {
    if (!currentResumeId || !localData) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateResume(currentResumeId, undefined, localData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const container = document.querySelector('.resume-preview-container') as HTMLElement;
      if (!container) {
        alert('Resume content not found');
        return;
      }
      
      const element = container.querySelector('.resume-paper') as HTMLElement;
      if (!element) {
        alert('Resume content not found');
        return;
      }

      // Create a clone to avoid modifying the original
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.transform = 'none';
      clone.style.backgroundColor = '#ffffff';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Force all text to use standard colors to avoid oklch issues
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            const computed = window.getComputedStyle(htmlEl);
            // Only override if color contains oklch
            if (computed.color.includes('oklch') || computed.color.includes('color(')) {
              htmlEl.style.color = '#000000';
            }
            if (computed.backgroundColor.includes('oklch') || computed.backgroundColor.includes('color(')) {
              htmlEl.style.backgroundColor = '#ffffff';
            }
          });
        }
      });

      // Remove clone
      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        unit: 'in',
        format: 'letter',
        orientation: 'portrait'
      });

      const imgWidth = 8.5;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      const personName = localData?.personalInfo 
        ? `${localData.personalInfo.firstName || ''}${localData.personalInfo.lastName ? '_' + localData.personalInfo.lastName : ''}`.trim().replace(/\s+/g, '_') || 'Resume'
        : 'Resume';
      pdf.save(`${personName}_Resume.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!localData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your resume...</p>
        </div>
      </div>
    );
  }

  const sectionConfig = [
    { id: 'contacts', label: 'Contact Info', icon: User, color: 'blue' },
    { id: 'summary', label: 'Professional Summary', icon: FileText, color: 'purple' },
    { id: 'experience', label: 'Work Experience', icon: Briefcase, color: 'green', count: localData.workExperience?.length || 0 },
    { id: 'education', label: 'Education', icon: GraduationCap, color: 'orange', count: localData.education?.length || 0 },
    { id: 'skills', label: 'Skills', icon: Wrench, color: 'red', count: localData.skills?.length || 0 },
  ];

  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    orange: { bg: 'bg-amber-50', text: 'text-amber-600' },
    red: { bg: 'bg-rose-50', text: 'text-rose-600' },
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AppHeader active="resume" />
      
      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Resume saved successfully!</span>
          </div>
        </div>
      )}
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Editor */}
        <div className="w-[400px] bg-gradient-to-b from-slate-50 to-white border-r border-gray-200 flex flex-col flex-shrink-0 shadow-sm">
          {/* Sidebar Header */}
          <div className="px-5 py-4 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigate('/resume-builder')}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm">Back</span>
              </button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isSaving}
                className="h-10 px-5 rounded-xl font-semibold bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-all duration-200"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1.5 text-white" />
                    <span className="text-white">Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Scrollable Sections */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
            {sectionConfig.map((section) => {
              const Icon = section.icon;
              const colors = colorClasses[section.color];
              const isExpanded = expandedSections[section.id];
              
              return (
                <div 
                  key={section.id} 
                  className={`rounded-2xl overflow-hidden transition-all duration-200 ${
                    isExpanded 
                      ? 'bg-white shadow-sm ring-1 ring-gray-200' 
                      : 'bg-white/60 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-4 py-3.5 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shadow-sm`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-gray-800 text-[15px]">{section.label}</span>
                        {section.count !== undefined && section.count > 0 && (
                          <span className="ml-2 text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                            {section.count}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isExpanded ? 'bg-blue-100 rotate-0' : 'bg-gray-100'
                    }`}>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-blue-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  {/* Section Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                      {section.id === 'contacts' && (
                        <div className="space-y-4 pt-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">First name</Label>
                              <Input
                                value={localData.personalInfo?.firstName || ''}
                                onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
                                className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Last name</Label>
                              <Input
                                value={localData.personalInfo?.lastName || ''}
                                onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                                className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Job Title</Label>
                            <Input
                              value={localData.personalInfo?.jobTitle || ''}
                              onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
                              placeholder="e.g. Software Engineer"
                              className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors placeholder:text-gray-300"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Phone</Label>
                              <Input
                                value={localData.personalInfo?.phone || ''}
                                onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                                placeholder="+1 234 567 8900"
                                className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors placeholder:text-gray-300"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Email</Label>
                              <Input
                                value={localData.personalInfo?.email || ''}
                                onChange={(e) => updatePersonalInfo('email', e.target.value)}
                                placeholder="you@email.com"
                                className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors placeholder:text-gray-300"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Location</Label>
                            <Input
                              value={localData.personalInfo?.location || ''}
                              onChange={(e) => updatePersonalInfo('location', e.target.value)}
                              placeholder="City, Country"
                              className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors placeholder:text-gray-300"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">LinkedIn</Label>
                            <Input
                              value={localData.personalInfo?.linkedin || ''}
                              onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                              placeholder="linkedin.com/in/yourprofile"
                              className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors placeholder:text-gray-300"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Website</Label>
                            <Input
                              value={localData.personalInfo?.website || ''}
                              onChange={(e) => updatePersonalInfo('website', e.target.value)}
                              placeholder="yourwebsite.com"
                              className="h-11 bg-gray-50/80 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 focus:bg-white transition-colors placeholder:text-gray-300"
                            />
                          </div>
                        </div>
                      )}

                      {section.id === 'summary' && (
                        <div className="pt-3">
                          <Textarea
                            value={localData.summary || ''}
                            onChange={(e) => updateSummary(e.target.value)}
                            rows={5}
                            placeholder="Write a compelling professional summary that highlights your key achievements and career goals..."
                            className="resize-none bg-gray-50/80 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-purple-500 focus:bg-white transition-colors placeholder:text-gray-300"
                          />
                          <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                            <span className="inline-block w-1 h-1 bg-purple-400 rounded-full"></span>
                            Keep it concise, 2-4 sentences work best
                          </p>
                        </div>
                      )}

                      {section.id === 'experience' && (
                        <div className="space-y-3 pt-3">
                          {(localData.workExperience || []).map((exp: WorkExperience, index: number) => (
                            <div key={exp.id} className="p-4 bg-gradient-to-br from-emerald-50/50 to-white rounded-xl border border-emerald-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">
                                    {index + 1}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700">
                                    {exp.title || exp.company || 'New Experience'}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeWorkExperience(exp.id)}
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <Input
                                value={exp.title}
                                onChange={(e) => updateWorkExperience(exp.id, 'title', e.target.value)}
                                placeholder="Job Title"
                                className="h-10 text-sm bg-white border-gray-200 rounded-lg"
                              />
                              <Input
                                value={exp.company}
                                onChange={(e) => updateWorkExperience(exp.id, 'company', e.target.value)}
                                placeholder="Company Name"
                                className="h-10 text-sm bg-white border-gray-200 rounded-lg"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Start</Label>
                                  <Input
                                    type="month"
                                    value={exp.startDate}
                                    onChange={(e) => updateWorkExperience(exp.id, 'startDate', e.target.value)}
                                    className="h-9 text-sm bg-white border-gray-200 rounded-lg"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">End</Label>
                                  <Input
                                    type="month"
                                    value={exp.endDate}
                                    onChange={(e) => updateWorkExperience(exp.id, 'endDate', e.target.value)}
                                    disabled={exp.isCurrent}
                                    placeholder={exp.isCurrent ? 'Present' : ''}
                                    className="h-9 text-sm bg-white border-gray-200 rounded-lg disabled:bg-gray-50"
                                  />
                                </div>
                              </div>
                              <label className="flex items-center gap-2 cursor-pointer py-1">
                                <input
                                  type="checkbox"
                                  checked={exp.isCurrent}
                                  onChange={(e) => updateWorkExperience(exp.id, 'isCurrent', e.target.checked)}
                                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-xs text-gray-600">I currently work here</span>
                              </label>
                              <Textarea
                                value={exp.description}
                                onChange={(e) => updateWorkExperience(exp.id, 'description', e.target.value)}
                                placeholder="Describe your key responsibilities and achievements..."
                                rows={3}
                                className="resize-none text-sm bg-white border-gray-200 rounded-lg"
                              />
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addWorkExperience}
                            className="w-full h-11 border-2 border-dashed border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl font-medium"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Experience
                          </Button>
                        </div>
                      )}

                      {section.id === 'education' && (
                        <div className="space-y-3 pt-3">
                          {(localData.education || []).map((edu: Education, index: number) => (
                            <div key={edu.id} className="p-4 bg-gradient-to-br from-amber-50/50 to-white rounded-xl border border-amber-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600">
                                    {index + 1}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700">
                                    {edu.school || edu.degree || 'New Education'}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeEducation(edu.id)}
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <Input
                                value={edu.school}
                                onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                                placeholder="School / University"
                                className="h-10 text-sm bg-white border-gray-200 rounded-lg"
                              />
                              <Input
                                value={edu.degree}
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                placeholder="Degree (e.g. Bachelor's)"
                                className="h-10 text-sm bg-white border-gray-200 rounded-lg"
                              />
                              <Input
                                value={edu.field || ''}
                                onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                                placeholder="Field of Study"
                                className="h-10 text-sm bg-white border-gray-200 rounded-lg"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Start</Label>
                                  <Input
                                    type="month"
                                    value={edu.startDate}
                                    onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                                    className="h-9 text-sm bg-white border-gray-200 rounded-lg"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">End</Label>
                                  <Input
                                    type="month"
                                    value={edu.endDate}
                                    onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                                    className="h-9 text-sm bg-white border-gray-200 rounded-lg"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addEducation}
                            className="w-full h-11 border-2 border-dashed border-amber-200 text-amber-600 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50 rounded-xl font-medium"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Education
                          </Button>
                        </div>
                      )}

                      {section.id === 'skills' && (
                        <div className="space-y-3 pt-3">
                          <div className="flex flex-wrap gap-2">
                            {(localData.skills || []).map((skill: Skill) => (
                              <div 
                                key={skill.id} 
                                className="group flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-rose-50 to-white border border-rose-100 rounded-xl hover:border-rose-200 transition-all hover:shadow-sm"
                              >
                                <input
                                  value={skill.name}
                                  onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                                  placeholder="Skill"
                                  className="bg-transparent border-none p-0 text-sm text-gray-700 focus:outline-none focus:ring-0 w-auto min-w-[60px] max-w-[140px] font-medium"
                                  style={{ width: `${Math.max(60, (skill.name?.length || 5) * 8)}px` }}
                                />
                                <button
                                  onClick={() => removeSkill(skill.id)}
                                  className="text-rose-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addSkill}
                            className="w-full h-11 border-2 border-dashed border-rose-200 text-rose-600 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 rounded-xl font-medium"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Skill
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Bottom spacer */}
            <div className="h-8"></div>
          </div>
        </div>

        {/* Right Side - Resume Preview */}
        <div className="flex-1 flex flex-col bg-gray-200/50 overflow-hidden">
          {/* Preview Header */}
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewScale(Math.max(0.4, previewScale - 0.1))}
                className="p-1.5 rounded hover:bg-white transition-colors"
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-xs text-gray-500 w-12 text-center">{Math.round(previewScale * 100)}%</span>
              <button
                onClick={() => setPreviewScale(Math.min(1.2, previewScale + 0.1))}
                className="p-1.5 rounded hover:bg-white transition-colors"
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => navigate('/resume-builder')}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                Preview
              </Button>
              <Button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Preview Area */}
          <div className="flex-1 overflow-auto p-8">
            <div className="resume-preview-container flex justify-center">
              <div 
                className="resume-paper bg-white shadow-2xl rounded-sm"
                style={{
                  width: '816px', // 8.5 inches at 96 DPI
                  minHeight: '1056px', // 11 inches at 96 DPI
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                }}
              >
                <div className="p-12">
                  <TemplateRenderer 
                    templateId={templateId}
                    data={localData}
                  />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
