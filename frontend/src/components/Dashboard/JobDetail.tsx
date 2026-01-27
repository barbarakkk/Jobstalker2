import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AppHeader } from '@/components/Layout/AppHeader';
import { jobApi, aiApi, subscriptionApi } from '@/lib/api';
import { Job } from '@/lib/types';
import { useResumeBuilder } from '@/components/ResumeBuilder/context/ResumeBuilderContext';
import { UpgradeModal } from '@/components/Subscription';
import { 
  ExternalLink, 
  MapPin, 
  DollarSign, 
  CalendarClock, 
  Building2,
  Star,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  Zap,
  Briefcase,
  GraduationCap,
  Code,
  Edit,
  Save,
  X,
  FileCheck,
  Crown,
  Check,
  Loader2 as Loader2Icon,
  Lock,
  ArrowLeft
} from 'lucide-react';

interface MatchAnalysis {
  matchScore: number;
  strengths: string[];
  improvements: string[];
  missingSkills: string[];
  matchedSkills: string[];
}

// Move helper functions outside component to prevent recreation on every render
const getInitials = (text: string) => {
  if (!text) return 'JS';
  const words = text.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const getStatusBadgeClasses = (status: Job['status']) => {
  switch (status) {
    case 'Bookmarked':
      return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    case 'Applying':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'Applied':
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    case 'Interviewing':
      return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'Accepted':
      return 'bg-green-50 text-green-700 border border-green-200';
    default:
      return '';
  }
};

const getMatchScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-orange-600';
};

const getMatchScoreBg = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-orange-500';
};

// Move parseJobDescription outside component - it's a pure function
const parseJobDescription = (description: string, jobData?: Job) => {
  if (!description) return { salary: null, skills: [], requirements: [], notes: description };

  const text = description.toLowerCase();
  const lines = description.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Extract salary (if not already in job.salary)
  let extractedSalary = null;
  if (!jobData?.salary) {
    const salaryPatterns = [
      /\$[\d,]+(?:-\$[\d,]+)?\s*(?:per\s+year|annually|yearly|yr)/gi,
      /\$[\d,]+(?:-\$[\d,]+)?\s*(?:per\s+month|monthly)/gi,
      /\$[\d,]+(?:-\$[\d,]+)?\s*(?:per\s+hour|hourly)/gi,
      /salary[:\s]+[\$]?[\d,]+(?:-\$?[\d,]+)?/gi,
      /compensation[:\s]+[\$]?[\d,]+(?:-\$?[\d,]+)?/gi,
      /pay[:\s]+[\$]?[\d,]+(?:-\$?[\d,]+)?/gi,
    ];
    
    for (const pattern of salaryPatterns) {
      const match = description.match(pattern);
      if (match && match[0]) {
        extractedSalary = match[0].trim();
        break;
      }
    }
  }

  // Common tech skills keywords
  const skillKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust', 'swift', 'kotlin',
    'react', 'vue', 'angular', 'node.js', 'express', 'next.js', 'nuxt', 'svelte',
    'html', 'css', 'sass', 'scss', 'tailwind', 'bootstrap',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd',
    'git', 'github', 'gitlab', 'agile', 'scrum', 'jira',
    'machine learning', 'ai', 'deep learning', 'tensorflow', 'pytorch',
    'rest api', 'graphql', 'microservices', 'serverless',
    'figma', 'adobe', 'ui/ux', 'design systems'
  ];

  // Extract skills
  const skills: string[] = [];
  const skillSet = new Set<string>();
  
  for (const keyword of skillKeywords) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(description)) {
      // Capitalize properly
      const formatted = keyword.split('/').map(s => 
        s.charAt(0).toUpperCase() + s.slice(1)
      ).join('/');
      skillSet.add(formatted);
    }
  }

  // Also look for skills in common sections
  const skillsSectionPatterns = [
    /(?:required|preferred|must have|nice to have)[\s\S]{0,500}?skills?[:\s]+([^\n]+)/gi,
    /skills?[:\s]+([^\n]+)/gi,
    /technologies?[:\s]+([^\n]+)/gi,
  ];

  for (const pattern of skillsSectionPatterns) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const skillList = match[1].split(/[,;•\-\n]/).map(s => s.trim()).filter(s => s.length > 0);
        skillList.forEach(skill => {
          if (skill.length < 50) { // Reasonable skill name length
            skillSet.add(skill);
          }
        });
      }
    }
  }

  skills.push(...Array.from(skillSet).slice(0, 20)); // Limit to 20 skills

  // Extract requirements
  const requirements: string[] = [];
  const requirementPatterns = [
    /(?:requirements?|qualifications?|must have|required)[:\s]+([\s\S]{0,2000})/gi,
    /(?:minimum|preferred)[\s\S]{0,200}?(?:years?|experience)[\s\S]{0,100}/gi,
    /(?:bachelor|master|phd|degree|education)[\s\S]{0,200}/gi,
  ];

  for (const pattern of requirementPatterns) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      if (match[0] || match[1]) {
        const reqText = (match[1] || match[0]).trim();
        if (reqText.length > 10 && reqText.length < 500) {
          // Split into individual requirements
          const reqs = reqText.split(/[•\-\n]/).map(r => r.trim()).filter(r => r.length > 10);
          requirements.push(...reqs.slice(0, 10)); // Limit to 10 requirements
        }
      }
    }
  }

  // Remove duplicates and clean up
  const uniqueRequirements = Array.from(new Set(requirements.map(r => r.replace(/^\W+/, '')))).slice(0, 10);

  // Extract notes (remaining content after removing extracted sections)
  let notes = description;
  
  // Remove salary mentions
  if (extractedSalary) {
    notes = notes.replace(new RegExp(extractedSalary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
  }

  // Remove skills section if found
  const skillsSectionMatch = description.match(/(?:skills?|technologies?)[:\s]+([^\n]+)/gi);
  if (skillsSectionMatch) {
    skillsSectionMatch.forEach(match => {
      notes = notes.replace(match, '');
    });
  }

  // Remove requirements section if found
  const reqSectionMatch = description.match(/(?:requirements?|qualifications?)[:\s]+([\s\S]{0,2000})/gi);
  if (reqSectionMatch) {
    reqSectionMatch.forEach(match => {
      notes = notes.replace(match, '');
    });
  }

  notes = notes.trim();

  return {
    salary: extractedSalary || jobData?.salary || null,
    skills: skills,
    requirements: uniqueRequirements,
    notes: notes || description // Fallback to full description if parsing removes everything
  };
};

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [processingUpgrade, setProcessingUpgrade] = useState(false);
  const [checkingResume, setCheckingResume] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro'>('free');
  const { listResumes, saveResume } = useResumeBuilder();

  // Load subscription status on mount
  useEffect(() => {
    const loadSubscriptionInfo = async () => {
      try {
        const subscriptionInfo = await subscriptionApi.getStatus();
        setSubscriptionTier(subscriptionInfo.tier as 'free' | 'pro');
      } catch (error) {
        console.error('Failed to load subscription info:', error);
        // Default to free tier on error
        setSubscriptionTier('free');
      }
    };
    loadSubscriptionInfo();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const jobData = await jobApi.getJob(id);
        setJob(jobData);
      } catch (error) {
        console.error('Failed to load job:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Memoize handleAnalyzeMatch to prevent recreation on every render
  const handleAnalyzeMatch = useCallback(async () => {
    if (!job || !id) return;
    
    // Check if user has pro tier
    if (subscriptionTier === 'free') {
      setUpgradeModalOpen(true);
      return;
    }
    
    setAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const analysis = await aiApi.analyzeJobMatch(id);
      setMatchAnalysis(analysis);
    } catch (error) {
      console.error('Failed to analyze match:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze job match');
    } finally {
      setAnalyzing(false);
    }
  }, [job, id, subscriptionTier]);

  // Handle Tailor Resume button click
  const handleTailorResume = useCallback(async () => {
    if (!job) return;
    
    setCheckingResume(true);
    try {
      // Check subscription status
      const subscriptionInfo = await subscriptionApi.getStatus();
      const maxResumes = subscriptionInfo.limits.max_resumes ?? 1; // Default to 1 if null
      const tier = subscriptionInfo.tier;
      
      // Get existing resumes
      const resumes = await listResumes();
      const resumeCount = resumes?.length || 0;
      
      // Check if user has reached limit
      if (maxResumes && resumeCount >= maxResumes && tier === 'free') {
        setUpgradeModalOpen(true);
        setCheckingResume(false);
        return;
      }
      
      // Use existing resume if available, otherwise create new one
      let resumeId: string;
      if (resumes && resumes.length > 0) {
        // Use the first resume
        resumeId = resumes[0].id;
      } else {
        // Create a new resume with basic data
        const defaultResumeData = {
          personalInfo: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            location: '',
            jobTitle: '',
            linkedin: '',
            website: '',
          },
          summary: '',
          workExperience: [],
          education: [],
          skills: [],
          languages: [],
        };
        resumeId = await saveResume('My Resume', 'modern-professional', defaultResumeData);
        if (!resumeId) {
          throw new Error('Failed to create resume');
        }
      }
      
      // Navigate to edit page with job context
      const editUrl = `/resume-builder/edit?resume=${resumeId}&template=modern-professional&targetRole=${encodeURIComponent(job.job_title || '')}&jobDescription=${encodeURIComponent(job.description || '')}`;
      navigate(editUrl);
    } catch (error) {
      console.error('Failed to tailor resume:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to tailor resume';
      if (errorMessage.includes('Resume limit reached') || errorMessage.includes('403')) {
        setUpgradeModalOpen(true);
      } else {
        alert(errorMessage);
      }
    } finally {
      setCheckingResume(false);
    }
  }, [job, listResumes, saveResume, navigate]);

  // Handle upgrade to Pro
  const handleActivatePro = async () => {
    try {
      setProcessingUpgrade(true);
      const session = await subscriptionApi.createCheckoutSession();
      // Redirect to Stripe checkout
      window.location.href = session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
      setProcessingUpgrade(false);
    }
  };

  // Memoize parsedInfo - only recalculate when job or job.description changes
  const parsedInfo = useMemo(() => {
    if (!job?.description) {
      return {
        salary: job?.salary || null,
        skills: [],
        requirements: [],
        notes: job?.description || ''
      };
    }
    return parseJobDescription(job.description, job);
  }, [job?.description, job?.salary]);

  // Initialize edited values when job changes
  useEffect(() => {
    if (job) {
      setEditedDescription(job.description || '');
    }
  }, [job]);

  // Memoize renderStars function
  const renderStars = useCallback((level: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < level
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  }, []);

  if (loading || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-40 bg-gray-200 rounded" />
            <div className="h-64 bg-gray-200 rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded-lg" />
              <div className="h-96 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100">
      <AppHeader active="jobs" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        {/* Go Back Button */}
        <Button
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          className="mb-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back to Dashboard
        </Button>
        
        {/* Hero Header Card */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white overflow-hidden">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-2xl lg:text-3xl font-bold shadow-lg">
                    {getInitials(job.company || job.job_title)}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{job.job_title}</h1>
                    <div className="flex items-center gap-2 text-blue-100 mb-4">
                      <Building2 className="h-5 w-5 lg:h-6 lg:w-6" />
                      <span className="text-base lg:text-lg font-medium">{job.company}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mb-4">
                  {job.salary && (
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
                      <DollarSign className="h-5 w-5 flex-shrink-0" />
                      <span className="font-semibold text-sm lg:text-base">{job.salary}</span>
                    </div>
                  )}
                  {job.location && (
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
                      <MapPin className="h-5 w-5 flex-shrink-0" />
                      <span className="font-semibold text-sm lg:text-base">{job.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
                    <CalendarClock className="h-5 w-5 flex-shrink-0" />
                    <span className="font-semibold text-sm lg:text-base">{job.date_applied || 'Not applied'}</span>
                  </div>
                </div>

                {/* Excitement Level */}
                {job.excitement_level && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 w-fit">
                    <span className="text-sm font-medium">Excitement:</span>
                    <div className="flex gap-1">
                      {renderStars(job.excitement_level)}
                    </div>
                  </div>
                )}
              </div>

              {/* Status + Actions */}
              <div className="flex flex-col items-end gap-4">
                <Badge className={`px-4 py-2 text-sm font-bold rounded-full ${getStatusBadgeClasses(job.status)}`}>
                  {job.status}
                </Badge>
                <div className="flex flex-col gap-2 w-full lg:w-auto">
                  {job.job_url && (
                    <Button 
                      asChild 
                      size="lg" 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg w-full lg:w-auto"
                    >
                      <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-5 w-5 mr-2" /> Apply Now
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm rounded-lg p-1">
            <TabsTrigger value="overview" className="rounded-md">
              Overview
            </TabsTrigger>
            <TabsTrigger value="match" className="rounded-md">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Match Analysis
              {subscriptionTier === 'free' && (
                <Lock className="h-3 w-3 ml-1" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Job Details - Structured Sections */}
              <div className="lg:col-span-2 space-y-6">
                {/* Job Description Section */}
                <Card className="border border-gray-200 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xl lg:text-2xl">
                        <FileText className="h-6 w-6 text-blue-600" />
                        Job Description
                      </CardTitle>
                      {!isEditingDescription && (
                        <Button
                          onClick={() => {
                            setIsEditingDescription(true);
                            setEditedDescription(job.description || '');
                          }}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      {isEditingDescription && (
                        <div className="flex gap-2">
                          <Button
                            onClick={async () => {
                              try {
                                await jobApi.updateJob(job.id, { description: editedDescription });
                                setJob({ ...job, description: editedDescription });
                                setIsEditingDescription(false);
                              } catch (error) {
                                console.error('Failed to save description:', error);
                                alert('Failed to save description');
                              }
                            }}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            onClick={() => {
                              setIsEditingDescription(false);
                              setEditedDescription(job.description || '');
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isEditingDescription ? (
                      <Textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="min-h-[300px] text-base lg:text-lg leading-relaxed"
                        placeholder="Enter job description..."
                      />
                    ) : job.description ? (
                      <div className="prose prose-lg max-w-none whitespace-pre-wrap text-gray-800 text-base lg:text-lg leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-6 lg:p-8 min-h-[300px] max-h-[calc(100vh-400px)] overflow-y-auto">
                        {job.description}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 lg:p-12 bg-gray-50 text-center min-h-[300px] flex flex-col items-center justify-center">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="font-medium text-gray-700 mb-2 text-lg">No description available</p>
                        <p className="text-sm text-gray-500">Job description will appear here when available.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* Quick Actions */}
              <div>
                <Card className="border border-gray-200 shadow-lg sticky top-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg lg:text-xl">AI-Powered Tools</CardTitle>
                    <p className="text-xs lg:text-sm text-gray-500 mt-1">Get personalized help for this job</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {job.job_url && (
                      <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base py-6">
                        <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-5 w-5 mr-2" /> Apply Now
                        </a>
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => {
                        if (subscriptionTier === 'free') {
                          setUpgradeModalOpen(true);
                          return;
                        }
                        setActiveTab('match');
                        setTimeout(() => handleAnalyzeMatch(), 100);
                      }}
                      variant="outline"
                      className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 text-base py-6"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Analyze Job Match
                      {subscriptionTier === 'free' && (
                        <Lock className="h-4 w-4 ml-2" />
                      )}
                    </Button>

                    {/* Job Specific Keywords - Premium Feature */}
                    <Card className="border border-gray-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                          <Code className="h-5 w-5 text-blue-600" />
                          Job Specific Keywords
                          {subscriptionTier === 'free' && (
                            <Badge className="ml-auto bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Pro
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-xs text-gray-500 mt-1">Important terms from job description</p>
                      </CardHeader>
                      <CardContent>
                        {subscriptionTier === 'free' ? (
                          <div className="text-center py-6">
                            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-gray-700 mb-2">Premium Feature</p>
                            <p className="text-xs text-gray-500 mb-4">
                              Unlock Job Specific Keywords with Pro to see important terms extracted from job descriptions.
                            </p>
                            <Button
                              onClick={() => setUpgradeModalOpen(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4"
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Upgrade to Pro
                            </Button>
                          </div>
                        ) : parsedInfo.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-2 lg:gap-2.5">
                            {parsedInfo.skills.map((skill, idx) => (
                              <Badge 
                                key={idx} 
                                className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 text-xs lg:text-sm font-medium hover:bg-blue-200 transition-colors cursor-default"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        ) : job.description ? (
                          <div className="text-center py-6">
                            <Code className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No keywords detected</p>
                            <p className="text-xs text-gray-400 mt-1">Keywords will appear here when found</p>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <Code className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No job description available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Tailor Resume Card */}
                    <Card className="border border-gray-200 shadow-sm">
                      <CardContent className="pt-6">
                        <Button 
                          onClick={handleTailorResume}
                          disabled={checkingResume}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base py-6"
                        >
                          {checkingResume ? (
                            <>
                              <Loader2Icon className="h-5 w-5 mr-2 animate-spin" />
                              Checking...
                            </>
                          ) : (
                            <>
                              <FileCheck className="h-5 w-5 mr-2" />
                              Tailor Resume
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="match" className="space-y-6">
            {/* AI Match Analyzer */}
            <Card className="border-2 border-blue-200 shadow-xl bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Sparkles className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl lg:text-2xl text-gray-900 flex items-center gap-2">
                        AI Job Match Analyzer
                        {subscriptionTier === 'free' && (
                          <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Pro
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm lg:text-base text-gray-600 mt-1">
                        See how well your profile matches this job opportunity
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {subscriptionTier === 'free' ? (
                  <div className="text-center py-8 lg:py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-blue-100 mb-4">
                      <Lock className="h-10 w-10 lg:h-12 lg:w-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
                      Premium Feature
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto text-base lg:text-lg">
                      AI Job Match Analyzer is a Pro feature. Upgrade to see how well your profile matches this job opportunity with personalized insights and recommendations.
                    </p>
                    <Button
                      onClick={() => setUpgradeModalOpen(true)}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg text-base lg:text-lg px-8 py-6"
                    >
                      <Crown className="h-5 w-5 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </div>
                ) : !matchAnalysis ? (
                  <div className="text-center py-8 lg:py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-blue-100 mb-4">
                      <Zap className="h-10 w-10 lg:h-12 lg:w-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
                      Ready to Analyze Your Match?
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto text-base lg:text-lg">
                      Our AI will compare your skills, experience, and education against this job's requirements 
                      to give you personalized insights and recommendations.
                    </p>
                    {(!job?.description || job.description.trim().length < 50) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="text-left">
                            <p className="text-sm font-semibold text-yellow-800 mb-1">Job Description Needed</p>
                            <p className="text-xs text-yellow-700">
                              Add a detailed job description with requirements and skills for accurate match analysis.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <Button 
                      onClick={handleAnalyzeMatch}
                      disabled={analyzing}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg text-base lg:text-lg px-8 py-6"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Analyze Job Match
                        </>
                      )}
                    </Button>
                    {analysisError && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 inline mr-2" />
                        {analysisError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Match Score */}
                    <div className="bg-white rounded-xl p-6 lg:p-8 border-2 border-gray-200 shadow-lg">
                      <div className="text-center mb-6">
                        <div className={`text-5xl lg:text-7xl font-bold mb-3 ${getMatchScoreColor(matchAnalysis.matchScore)}`}>
                          {matchAnalysis.matchScore}%
                        </div>
                        <p className="text-lg lg:text-xl font-medium text-gray-700 mb-4">Overall Match Score</p>
                        <div className="w-full bg-gray-200 rounded-full h-5 lg:h-6 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${getMatchScoreBg(matchAnalysis.matchScore)}`}
                            style={{ width: `${matchAnalysis.matchScore}%` }}
                          />
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-2 text-sm lg:text-base text-gray-600">
                          {matchAnalysis.matchScore >= 80 && (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <span>Excellent match! You're well-qualified for this role.</span>
                            </>
                          )}
                          {matchAnalysis.matchScore >= 60 && matchAnalysis.matchScore < 80 && (
                            <>
                              <TrendingUp className="h-5 w-5 text-yellow-500" />
                              <span>Good match! Consider highlighting your strengths.</span>
                            </>
                          )}
                          {matchAnalysis.matchScore < 60 && (
                            <>
                              <AlertCircle className="h-5 w-5 text-orange-500" />
                              <span>Some gaps identified. Review recommendations below.</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Strengths */}
                    {matchAnalysis.strengths.length > 0 && (
                      <div className="bg-white rounded-xl p-5 lg:p-6 border border-green-200 shadow-md">
                        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
                          Your Strengths
                        </h3>
                        <div className="space-y-3">
                          {matchAnalysis.strengths.map((strength, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <p className="text-base lg:text-lg text-gray-700 flex-1 leading-relaxed">{strength}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matched Skills */}
                    {matchAnalysis.matchedSkills.length > 0 && (
                      <div className="bg-white rounded-xl p-5 lg:p-6 border border-blue-200 shadow-md">
                        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Zap className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                          Skills You Have ({matchAnalysis.matchedSkills.length})
                        </h3>
                        <div className="flex flex-wrap gap-2 lg:gap-3">
                          {matchAnalysis.matchedSkills.map((skill, idx) => (
                            <Badge key={idx} className="bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 text-sm lg:text-base">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Improvements */}
                    {matchAnalysis.improvements.length > 0 && (
                      <div className="bg-white rounded-xl p-5 lg:p-6 border border-yellow-200 shadow-md">
                        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-600" />
                          Recommendations for Improvement
                        </h3>
                        <div className="space-y-3">
                          {matchAnalysis.improvements.map((improvement, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <p className="text-base lg:text-lg text-gray-700 flex-1 leading-relaxed">{improvement}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {matchAnalysis.missingSkills.length > 0 && (
                      <div className="bg-white rounded-xl p-5 lg:p-6 border border-orange-200 shadow-md">
                        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600" />
                          Skills to Consider Learning ({matchAnalysis.missingSkills.length})
                        </h3>
                        <div className="flex flex-wrap gap-2 lg:gap-3">
                          {matchAnalysis.missingSkills.map((skill, idx) => (
                            <Badge key={idx} className="bg-orange-100 text-orange-700 border border-orange-200 px-4 py-2 text-sm lg:text-base">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Re-analyze Button */}
                    <div className="text-center pt-4">
                      <Button 
                        onClick={handleAnalyzeMatch}
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Re-analyze Match
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upgrade to Pro Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        onActivate={handleActivatePro}
        processing={processingUpgrade}
      />
    </div>
  );
}


