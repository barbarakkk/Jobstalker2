import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Plus, X, Trash2, User, Link2, Briefcase, GraduationCap, Code, Globe, Loader2, ChevronLeft, ChevronRight, Check, FileText, Search } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { profileApi, skillsApi, experienceApi, educationApi, languagesApi } from '@/lib/api';
import { SocialLink, CreateSkillData, CreateExperienceData, CreateEducationData, CreateLanguageData } from '@/lib/types';
import ColoredLogoHorizontal from '@/assets/ColoredLogoHorizontal.svg';
import { ExtensionDownloadDialog } from './ExtensionDownloadDialog';

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
  { id: 7, name: 'Work & Demographics', icon: FileText, color: 'blue' },
];

const REFERRAL_SOURCES = [
  'Reddit',
  'Google',
  'LinkedIn',
  'TikTok',
  'GitHub',
  'Friend',
  'Instagram',
  'Discord',
  'RoastMyResu.me',
  'University',
  'Job List',
  'Other'
];

const ETHNICITY_OPTIONS = [
  'Black/African American',
  'East Asian',
  'Hispanic/Latinx',
  'Middle Eastern',
  'Southeast Asian',
  'South Asian',
  'Native Hawaiian/Pacific Islander',
  'Native American/Alaskan',
  'White',
  'Prefer not to say'
];

const YES_NO_DECLINE = ['Yes', 'No', 'Decline to state'];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-Binary', 'Decline to state'];

// Comprehensive list of country calling codes
const COUNTRY_CODES = [
  { code: '+1', country: 'US/Canada' },
  { code: '+7', country: 'Russia/Kazakhstan' },
  { code: '+20', country: 'Egypt' },
  { code: '+27', country: 'South Africa' },
  { code: '+30', country: 'Greece' },
  { code: '+31', country: 'Netherlands' },
  { code: '+32', country: 'Belgium' },
  { code: '+33', country: 'France' },
  { code: '+34', country: 'Spain' },
  { code: '+36', country: 'Hungary' },
  { code: '+39', country: 'Italy' },
  { code: '+40', country: 'Romania' },
  { code: '+41', country: 'Switzerland' },
  { code: '+43', country: 'Austria' },
  { code: '+44', country: 'UK' },
  { code: '+45', country: 'Denmark' },
  { code: '+46', country: 'Sweden' },
  { code: '+47', country: 'Norway' },
  { code: '+48', country: 'Poland' },
  { code: '+49', country: 'Germany' },
  { code: '+51', country: 'Peru' },
  { code: '+52', country: 'Mexico' },
  { code: '+53', country: 'Cuba' },
  { code: '+54', country: 'Argentina' },
  { code: '+55', country: 'Brazil' },
  { code: '+56', country: 'Chile' },
  { code: '+57', country: 'Colombia' },
  { code: '+58', country: 'Venezuela' },
  { code: '+60', country: 'Malaysia' },
  { code: '+61', country: 'Australia' },
  { code: '+62', country: 'Indonesia' },
  { code: '+63', country: 'Philippines' },
  { code: '+64', country: 'New Zealand' },
  { code: '+65', country: 'Singapore' },
  { code: '+66', country: 'Thailand' },
  { code: '+81', country: 'Japan' },
  { code: '+82', country: 'South Korea' },
  { code: '+84', country: 'Vietnam' },
  { code: '+86', country: 'China' },
  { code: '+90', country: 'Turkey' },
  { code: '+91', country: 'India' },
  { code: '+92', country: 'Pakistan' },
  { code: '+93', country: 'Afghanistan' },
  { code: '+94', country: 'Sri Lanka' },
  { code: '+95', country: 'Myanmar' },
  { code: '+98', country: 'Iran' },
  { code: '+212', country: 'Morocco' },
  { code: '+213', country: 'Algeria' },
  { code: '+216', country: 'Tunisia' },
  { code: '+218', country: 'Libya' },
  { code: '+220', country: 'Gambia' },
  { code: '+221', country: 'Senegal' },
  { code: '+222', country: 'Mauritania' },
  { code: '+223', country: 'Mali' },
  { code: '+224', country: 'Guinea' },
  { code: '+225', country: 'Ivory Coast' },
  { code: '+226', country: 'Burkina Faso' },
  { code: '+227', country: 'Niger' },
  { code: '+228', country: 'Togo' },
  { code: '+229', country: 'Benin' },
  { code: '+230', country: 'Mauritius' },
  { code: '+231', country: 'Liberia' },
  { code: '+232', country: 'Sierra Leone' },
  { code: '+233', country: 'Ghana' },
  { code: '+234', country: 'Nigeria' },
  { code: '+235', country: 'Chad' },
  { code: '+236', country: 'Central African Republic' },
  { code: '+237', country: 'Cameroon' },
  { code: '+238', country: 'Cape Verde' },
  { code: '+239', country: 'São Tomé and Príncipe' },
  { code: '+240', country: 'Equatorial Guinea' },
  { code: '+241', country: 'Gabon' },
  { code: '+242', country: 'Republic of the Congo' },
  { code: '+243', country: 'DR Congo' },
  { code: '+244', country: 'Angola' },
  { code: '+245', country: 'Guinea-Bissau' },
  { code: '+246', country: 'British Indian Ocean Territory' },
  { code: '+248', country: 'Seychelles' },
  { code: '+249', country: 'Sudan' },
  { code: '+250', country: 'Rwanda' },
  { code: '+251', country: 'Ethiopia' },
  { code: '+252', country: 'Somalia' },
  { code: '+253', country: 'Djibouti' },
  { code: '+254', country: 'Kenya' },
  { code: '+255', country: 'Tanzania' },
  { code: '+256', country: 'Uganda' },
  { code: '+257', country: 'Burundi' },
  { code: '+258', country: 'Mozambique' },
  { code: '+260', country: 'Zambia' },
  { code: '+261', country: 'Madagascar' },
  { code: '+262', country: 'Réunion' },
  { code: '+263', country: 'Zimbabwe' },
  { code: '+264', country: 'Namibia' },
  { code: '+265', country: 'Malawi' },
  { code: '+266', country: 'Lesotho' },
  { code: '+267', country: 'Botswana' },
  { code: '+268', country: 'Eswatini' },
  { code: '+269', country: 'Comoros' },
  { code: '+290', country: 'Saint Helena' },
  { code: '+291', country: 'Eritrea' },
  { code: '+297', country: 'Aruba' },
  { code: '+298', country: 'Faroe Islands' },
  { code: '+299', country: 'Greenland' },
  { code: '+350', country: 'Gibraltar' },
  { code: '+351', country: 'Portugal' },
  { code: '+352', country: 'Luxembourg' },
  { code: '+353', country: 'Ireland' },
  { code: '+354', country: 'Iceland' },
  { code: '+355', country: 'Albania' },
  { code: '+356', country: 'Malta' },
  { code: '+357', country: 'Cyprus' },
  { code: '+358', country: 'Finland' },
  { code: '+359', country: 'Bulgaria' },
  { code: '+370', country: 'Lithuania' },
  { code: '+371', country: 'Latvia' },
  { code: '+372', country: 'Estonia' },
  { code: '+373', country: 'Moldova' },
  { code: '+374', country: 'Armenia' },
  { code: '+375', country: 'Belarus' },
  { code: '+376', country: 'Andorra' },
  { code: '+377', country: 'Monaco' },
  { code: '+378', country: 'San Marino' },
  { code: '+380', country: 'Ukraine' },
  { code: '+381', country: 'Serbia' },
  { code: '+382', country: 'Montenegro' },
  { code: '+383', country: 'Kosovo' },
  { code: '+385', country: 'Croatia' },
  { code: '+386', country: 'Slovenia' },
  { code: '+387', country: 'Bosnia and Herzegovina' },
  { code: '+389', country: 'North Macedonia' },
  { code: '+420', country: 'Czech Republic' },
  { code: '+421', country: 'Slovakia' },
  { code: '+423', country: 'Liechtenstein' },
  { code: '+500', country: 'Falkland Islands' },
  { code: '+501', country: 'Belize' },
  { code: '+502', country: 'Guatemala' },
  { code: '+503', country: 'El Salvador' },
  { code: '+504', country: 'Honduras' },
  { code: '+505', country: 'Nicaragua' },
  { code: '+506', country: 'Costa Rica' },
  { code: '+507', country: 'Panama' },
  { code: '+508', country: 'Saint Pierre and Miquelon' },
  { code: '+509', country: 'Haiti' },
  { code: '+590', country: 'Guadeloupe' },
  { code: '+591', country: 'Bolivia' },
  { code: '+592', country: 'Guyana' },
  { code: '+593', country: 'Ecuador' },
  { code: '+594', country: 'French Guiana' },
  { code: '+595', country: 'Paraguay' },
  { code: '+596', country: 'Martinique' },
  { code: '+597', country: 'Suriname' },
  { code: '+598', country: 'Uruguay' },
  { code: '+599', country: 'Curaçao' },
  { code: '+670', country: 'East Timor' },
  { code: '+672', country: 'Antarctica' },
  { code: '+673', country: 'Brunei' },
  { code: '+674', country: 'Nauru' },
  { code: '+675', country: 'Papua New Guinea' },
  { code: '+676', country: 'Tonga' },
  { code: '+677', country: 'Solomon Islands' },
  { code: '+678', country: 'Vanuatu' },
  { code: '+679', country: 'Fiji' },
  { code: '+680', country: 'Palau' },
  { code: '+681', country: 'Wallis and Futuna' },
  { code: '+682', country: 'Cook Islands' },
  { code: '+683', country: 'Niue' },
  { code: '+685', country: 'Samoa' },
  { code: '+686', country: 'Kiribati' },
  { code: '+687', country: 'New Caledonia' },
  { code: '+688', country: 'Tuvalu' },
  { code: '+689', country: 'French Polynesia' },
  { code: '+690', country: 'Tokelau' },
  { code: '+691', country: 'Micronesia' },
  { code: '+692', country: 'Marshall Islands' },
  { code: '+850', country: 'North Korea' },
  { code: '+852', country: 'Hong Kong' },
  { code: '+853', country: 'Macau' },
  { code: '+855', country: 'Cambodia' },
  { code: '+856', country: 'Laos' },
  { code: '+880', country: 'Bangladesh' },
  { code: '+886', country: 'Taiwan' },
  { code: '+960', country: 'Maldives' },
  { code: '+961', country: 'Lebanon' },
  { code: '+962', country: 'Jordan' },
  { code: '+963', country: 'Syria' },
  { code: '+964', country: 'Iraq' },
  { code: '+965', country: 'Kuwait' },
  { code: '+966', country: 'Saudi Arabia' },
  { code: '+967', country: 'Yemen' },
  { code: '+968', country: 'Oman' },
  { code: '+970', country: 'Palestine' },
  { code: '+971', country: 'UAE' },
  { code: '+972', country: 'Israel' },
  { code: '+973', country: 'Bahrain' },
  { code: '+974', country: 'Qatar' },
  { code: '+975', country: 'Bhutan' },
  { code: '+976', country: 'Mongolia' },
  { code: '+977', country: 'Nepal' },
  { code: '+992', country: 'Tajikistan' },
  { code: '+993', country: 'Turkmenistan' },
  { code: '+994', country: 'Azerbaijan' },
  { code: '+995', country: 'Georgia' },
  { code: '+996', country: 'Kyrgyzstan' },
  { code: '+998', country: 'Uzbekistan' },
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
  const [referralSource, setReferralSource] = useState('');

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

  // Work Authorization
  const [workAuthUS, setWorkAuthUS] = useState<boolean | null>(null);
  const [workAuthCanada, setWorkAuthCanada] = useState<boolean | null>(null);
  const [workAuthUK, setWorkAuthUK] = useState<boolean | null>(null);
  const [requiresSponsorship, setRequiresSponsorship] = useState<boolean | null>(null);
  
  // Demographics
  const [ethnicity, setEthnicity] = useState('');
  const [hasDisability, setHasDisability] = useState<'Yes' | 'No' | 'Decline to state' | ''>('');
  const [isVeteran, setIsVeteran] = useState<'Yes' | 'No' | 'Decline to state' | ''>('');
  const [isLgbtq, setIsLgbtq] = useState<'Yes' | 'No' | 'Decline to state' | ''>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Non-Binary' | 'Decline to state' | ''>('');
  
  // Location & Personal
  const [currentLocation, setCurrentLocation] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
  const [countryCodeSearch, setCountryCodeSearch] = useState('');

  // Extension Dialog
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);

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
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !referralSource) {
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
        referral_source: referralSource || undefined,
        work_auth_us: workAuthUS ?? undefined,
        work_auth_canada: workAuthCanada ?? undefined,
        work_auth_uk: workAuthUK ?? undefined,
        requires_sponsorship: requiresSponsorship ?? undefined,
        ethnicity: ethnicity || undefined,
        has_disability: hasDisability || undefined,
        is_veteran: isVeteran || undefined,
        is_lgbtq: isLgbtq || undefined,
        gender: gender || undefined,
        current_location: currentLocation || undefined,
        date_of_birth: dateOfBirth || undefined,
        phone_country_code: phoneCountryCode || undefined,
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
            degree: edu.degree || '',
            start_date: edu.graduationYear ? `${edu.graduationYear}-01-01` : new Date().toISOString().split('T')[0],
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

      // Mark as submitted before showing dialog
      setIsSubmitting(true);
      
      // Show extension download dialog
      console.log('Profile completed successfully, showing extension dialog');
      setShowExtensionDialog(true);
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
              
              const handleStepClick = () => {
                const targetStep = index + 1;
                if (targetStep !== currentStep) {
                  setCurrentStep(targetStep);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              };
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div 
                      onClick={handleStepClick}
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 cursor-pointer hover:scale-110 ${getStepColorClasses()}`}
                      title={`Go to ${step.name}`}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                    </div>
                    <span 
                      onClick={handleStepClick}
                      className={`text-xs mt-2 font-medium cursor-pointer hover:text-sky-600 transition-colors ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}
                      title={`Go to ${step.name}`}
                    >
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
              <CardContent className="pt-6 space-y-6">
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
                      Phone <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                    </Label>
                    <div className="flex gap-3">
                      <div className="w-48 flex flex-col gap-2">
                        <Select value={phoneCountryCode} onValueChange={(value) => {
                          setPhoneCountryCode(value);
                          setCountryCodeSearch(''); // Clear search when selection is made
                        }}>
                          <SelectTrigger className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[400px]">
                            {/* Search Input */}
                            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 p-2">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  placeholder="Search country..."
                                  value={countryCodeSearch}
                                  onChange={(e) => setCountryCodeSearch(e.target.value)}
                                  className="pl-9 h-9 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20"
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            {/* Filtered Country List */}
                            <div className="max-h-[300px] overflow-y-auto">
                              {COUNTRY_CODES
                                .filter((country) => {
                                  if (!countryCodeSearch) return true;
                                  const searchLower = countryCodeSearch.toLowerCase();
                                  return (
                                    country.country.toLowerCase().includes(searchLower) ||
                                    country.code.includes(searchLower)
                                  );
                                })
                                .map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    {country.code} ({country.country})
                                  </SelectItem>
                                ))}
                              {COUNTRY_CODES.filter((country) => {
                                if (!countryCodeSearch) return false;
                                const searchLower = countryCodeSearch.toLowerCase();
                                return (
                                  country.country.toLowerCase().includes(searchLower) ||
                                  country.code.includes(searchLower)
                                );
                              }).length === 0 && (
                                <div className="px-2 py-4 text-sm text-slate-500 text-center">
                                  No countries found
                                </div>
                              )}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Please enter valid phone number"
                        className="flex-1 h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all"
                      />
                    </div>
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
                <div className="space-y-2.5">
                  <Label htmlFor="referralSource" className="text-sm font-semibold text-slate-700">
                    How did you hear about Jobstalker? <span className="text-red-500">*</span>
                  </Label>
                  <Select value={referralSource} onValueChange={setReferralSource}>
                    <SelectTrigger id="referralSource" className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {REFERRAL_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <CardContent className="pt-6 space-y-6">
                <div className="flex justify-end mb-4">
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
                          <DatePicker
                            value={exp.startDate}
                            onChange={(value) => updateWorkExperience(exp.id, 'startDate', value)}
                            placeholder="Select start date"
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-sm font-semibold text-slate-700">End Date</Label>
                          <DatePicker
                            value={exp.endDate}
                            onChange={(value) => updateWorkExperience(exp.id, 'endDate', value)}
                            placeholder="Select end date"
                            disabled={exp.isCurrent}
                            className="h-12"
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
              <CardContent className="pt-6 space-y-6">
                <div className="flex justify-end mb-4">
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
              <CardContent className="pt-6 space-y-5">
                <div className="flex justify-end mb-4">
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
              <CardContent className="pt-6 space-y-5">
                <div className="flex justify-end mb-4">
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

          {/* Step 7: Work & Demographics */}
          {currentStep === 7 && (
            <Card className="border border-slate-200 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardContent className="pt-6 space-y-6">
                {/* Information Box */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg mt-0.5">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-slate-900 mb-2">
                        Why we collect this information
                      </h4>
                      <p className="text-sm text-slate-700 leading-relaxed mb-2">
                        This information helps our Chrome extension automatically fill out job application forms on your behalf, saving you time and ensuring accuracy. The extension uses your work authorization status, location, and other details to pre-populate application fields when you're applying to jobs.
                      </p>
                      <p className="text-sm text-slate-600 font-medium">
                        <span className="text-blue-600 font-semibold">💡 Important:</span> All fields in this section are completely optional. If you prefer not to share this information, you can skip any or all of these questions. Your privacy is important to us.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Work Authorization Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 pb-2">Work Authorization</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2.5">
                      <Label className="text-sm font-semibold text-slate-700">
                        Are you authorized to work in the US?
                      </Label>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant={workAuthUS === true ? "default" : "outline"}
                          onClick={() => setWorkAuthUS(true)}
                          className={`flex-1 h-12 ${workAuthUS === true ? 'bg-sky-500 text-white hover:bg-sky-600' : 'border-slate-300'}`}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant={workAuthUS === false ? "default" : "outline"}
                          onClick={() => setWorkAuthUS(false)}
                          className={`flex-1 h-12 ${workAuthUS === false ? 'bg-sky-500 text-white hover:bg-sky-600' : 'border-slate-300'}`}
                        >
                          No
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-sm font-semibold text-slate-700">
                        Are you authorized to work in Canada?
                      </Label>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant={workAuthCanada === true ? "default" : "outline"}
                          onClick={() => setWorkAuthCanada(true)}
                          className={`flex-1 h-12 ${workAuthCanada === true ? 'bg-sky-500 text-white hover:bg-sky-600' : 'border-slate-300'}`}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant={workAuthCanada === false ? "default" : "outline"}
                          onClick={() => setWorkAuthCanada(false)}
                          className={`flex-1 h-12 ${workAuthCanada === false ? 'bg-sky-500 text-white hover:bg-sky-600' : 'border-slate-300'}`}
                        >
                          No
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-sm font-semibold text-slate-700">
                        Are you authorized to work in the United Kingdom?
                      </Label>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant={workAuthUK === true ? "default" : "outline"}
                          onClick={() => setWorkAuthUK(true)}
                          className={`flex-1 h-12 ${workAuthUK === true ? 'bg-sky-500 text-white hover:bg-sky-600' : 'border-slate-300'}`}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant={workAuthUK === false ? "default" : "outline"}
                          onClick={() => setWorkAuthUK(false)}
                          className={`flex-1 h-12 ${workAuthUK === false ? 'bg-sky-500 text-white hover:bg-sky-600' : 'border-slate-300'}`}
                        >
                          No
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-sm font-semibold text-slate-700">
                        Will you now or in the future require sponsorship for employment visa status?
                      </Label>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant={requiresSponsorship === true ? "default" : "outline"}
                          onClick={() => setRequiresSponsorship(true)}
                          className={`flex-1 h-12 ${requiresSponsorship === true ? 'bg-sky-500 text-white hover:bg-sky-600' : 'border-slate-300'}`}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant={requiresSponsorship === false ? "default" : "outline"}
                          onClick={() => setRequiresSponsorship(false)}
                          className={`flex-1 h-12 ${requiresSponsorship === false ? 'bg-sky-500 text-white hover:bg-sky-600' : 'border-slate-300'}`}
                        >
                          No
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Separator */}
                <div className="border-t border-slate-200 pt-6"></div>

                {/* Demographics Section */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-slate-900 pb-2">Demographics</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2.5">
                      <Label htmlFor="ethnicity" className="text-sm font-semibold text-slate-700">
                        What is your ethnicity?
                      </Label>
                      <Select value={ethnicity} onValueChange={setEthnicity}>
                        <SelectTrigger id="ethnicity" className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {ETHNICITY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="hasDisability" className="text-sm font-semibold text-slate-700">
                        Do you have a disability?
                      </Label>
                      <Select value={hasDisability} onValueChange={(value) => setHasDisability(value as 'Yes' | 'No' | 'Decline to state' | '')}>
                        <SelectTrigger id="hasDisability" className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {YES_NO_DECLINE.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="isVeteran" className="text-sm font-semibold text-slate-700">
                        Are you a veteran?
                      </Label>
                      <Select value={isVeteran} onValueChange={(value) => setIsVeteran(value as 'Yes' | 'No' | 'Decline to state' | '')}>
                        <SelectTrigger id="isVeteran" className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {YES_NO_DECLINE.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="isLgbtq" className="text-sm font-semibold text-slate-700">
                        Do you identify as LGBTQ+?
                      </Label>
                      <Select value={isLgbtq} onValueChange={(value) => setIsLgbtq(value as 'Yes' | 'No' | 'Decline to state' | '')}>
                        <SelectTrigger id="isLgbtq" className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {YES_NO_DECLINE.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="gender" className="text-sm font-semibold text-slate-700">
                        What is your gender?
                      </Label>
                      <Select value={gender} onValueChange={(value) => setGender(value as 'Male' | 'Female' | 'Non-Binary' | 'Decline to state' | '')}>
                        <SelectTrigger id="gender" className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Visual Separator */}
                <div className="border-t border-slate-200 pt-6"></div>

                {/* Additional Information Section */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-slate-900 pb-2">Additional Information</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2.5">
                      <Label htmlFor="currentLocation" className="text-sm font-semibold text-slate-700">
                        Where are you currently located?
                      </Label>
                      <Input
                        id="currentLocation"
                        value={currentLocation}
                        onChange={(e) => setCurrentLocation(e.target.value)}
                        placeholder="Type city to search"
                        className="h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500/20 transition-all"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="dateOfBirth" className="text-sm font-semibold text-slate-700">
                        What's your date of birth?
                      </Label>
                      <DatePicker
                        value={dateOfBirth}
                        onChange={setDateOfBirth}
                        placeholder="Select date of birth"
                        className="h-12"
                      />
                    </div>

                  </div>
                </div>
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
      
      {/* Extension Download Dialog */}
      <ExtensionDownloadDialog 
        open={showExtensionDialog} 
        onClose={() => {
          setShowExtensionDialog(false);
          // Navigate to resume builder after dialog is closed
          navigate('/resume-builder');
        }} 
      />
    </div>
  );
}
