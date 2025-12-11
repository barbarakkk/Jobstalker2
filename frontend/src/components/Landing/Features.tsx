import { Card, CardContent } from '@/components/ui/card';
import { Target, BarChart2, Search, Calendar, FileText, Sparkles, Zap, Shield, Clock, TrendingUp, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import ATSFriendlyResume from '@/assets/ATSfriendlyresume.png';
import Jobmatcher from '@/assets/Jobmatcher.png';

const features = [
  {
    title: 'Smart Application Tracking',
    description: 'Keep track of all your job applications with intelligent status updates, progress insights, and detailed job information.',
    icon: <Target className="w-8 h-8 text-white" />,
    gradient: 'from-[#4169E1] to-[#3A5BCE]',
    bgGradient: 'from-[#4169E1]/10 to-[#4169E1]/20',
    highlight: 'Track all applications'
  },
  {
    title: 'AI Resume Builder',
    description: 'Create professional resumes in minutes with our AI-powered builder. Choose from multiple templates, use AI to generate summaries, and export as PDF.',
    icon: <FileText className="w-8 h-8 text-white" />,
    gradient: 'from-[#4169E1] to-[#3A5BCE]',
    bgGradient: 'from-[#4169E1]/10 to-[#4169E1]/20',
    highlight: 'AI-powered templates'
  },
  {
    title: 'Advanced Analytics',
    description: 'Track your job search performance with detailed analytics, success metrics, conversion rates, and visual insights.',
    icon: <BarChart2 className="w-8 h-8 text-white" />,
    gradient: 'from-[#3A5BCE] to-[#2E4AB8]',
    bgGradient: 'from-[#4169E1]/10 to-[#4169E1]/20',
    highlight: 'Performance insights'
  },
  {
    title: 'Chrome Extension',
    description: 'Save jobs directly from LinkedIn with one click. Our AI automatically extracts job details and syncs them to your dashboard.',
    icon: <Zap className="w-8 h-8 text-white" />,
    gradient: 'from-[#4169E1] to-[#3A5BCE]',
    bgGradient: 'from-[#4169E1]/10 to-[#4169E1]/20',
    highlight: 'One-click save'
  },
  {
    title: 'AI Job Matching',
    description: 'Our AI algorithms match you with relevant opportunities based on your skills, experience, and career goals.',
    icon: <Search className="w-8 h-8 text-white" />,
    gradient: 'from-[#4169E1] to-[#3A5BCE]',
    bgGradient: 'from-[#4169E1]/10 to-[#4169E1]/20',
    highlight: 'Smart matching',
    comingSoon: true
  },
  {
    title: 'Schedule Management',
    description: 'Organize interviews, follow-ups, and deadlines with integrated calendar management and smart notifications.',
    icon: <Calendar className="w-8 h-8 text-white" />,
    gradient: 'from-[#3A5BCE] to-[#2E4AB8]',
    bgGradient: 'from-[#4169E1]/10 to-[#4169E1]/20',
    highlight: 'Smart scheduling',
    comingSoon: true
  },
];

const stats = [
  { icon: <Sparkles className="w-6 h-6" />, value: '85%', label: 'Success Rate' },
  { icon: <Zap className="w-6 h-6" />, value: '30%', label: 'Faster Placement' },
  { icon: <Shield className="w-6 h-6" />, value: '1k+', label: 'Professionals' },
  { icon: <Clock className="w-6 h-6" />, value: '24/7', label: 'AI Support' },
];

const featureSections = [
  {
    badge: 'AI Resume Builder',
    badgeIcon: FileText,
    title: 'Create ATS-Friendly Resumes',
    titleHighlight: 'in Minutes',
    description: 'Our AI-powered resume builder helps you create professional, ATS-friendly resumes that get past applicant tracking systems and into the hands of recruiters. Choose from multiple templates, use AI to generate compelling summaries, and optimize your content for maximum impact.',
    features: [
      'ATS-optimized formatting that passes screening systems',
      'AI-generated professional summaries and bullet points',
      'Multiple professional templates to choose from',
      'Export as PDF ready for job applications'
    ],
    image: ATSFriendlyResume,
    imageAlt: 'ATS-Friendly Resume Example'
  },
  {
    badge: 'AI Job Matching',
    badgeIcon: Search,
    title: 'See Job Matching',
    titleHighlight: 'in Action',
    description: 'Our advanced AI-powered job matcher analyzes your profile data and automatically finds the best matching opportunities tailored to your skills, experience, and career goals. Get personalized job recommendations with match scores, salary ranges, and detailed insights to help you find your perfect role faster. That\'s why it\'s important to fill out all information in your profile page—complete profiles ensure we can match jobs perfectly to your qualifications.',
    features: [
      'AI-powered profile data analysis and skill matching',
      'Intelligent job matching with percentage scores based on your profile',
      'Real-time job recommendations personalized to your experience and goals',
      'Detailed match insights including salary, location, and requirements',
      'Better matches when your profile is fully completed'
    ],
    image: Jobmatcher,
    imageAlt: 'AI Job Matching Dashboard'
  }
];

export function Features() {
  const [currentSection, setCurrentSection] = useState(0);

  const nextSection = () => {
    setCurrentSection((prev) => (prev + 1) % featureSections.length);
  };

  const prevSection = () => {
    setCurrentSection((prev) => (prev - 1 + featureSections.length) % featureSections.length);
  };

  const currentFeatureSection = featureSections[currentSection];
  const BadgeIcon = currentFeatureSection.badgeIcon;

  return (
    <section id="features" className="w-full py-24 lg:py-36 bg-gradient-to-b from-white via-[#4169E1]/10 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4169E1]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>
      
      <div className="relative container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20 relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#4169E1]/20 via-[#4169E1]/10 to-[#4169E1]/20 border border-[#4169E1]/30 text-[#4169E1] font-semibold text-sm shadow-sm animate-fadeInUp">
            <Sparkles className="w-4 h-4 animate-pulse-slow" />
            Powerful Features
          </div>
          <h2 className="text-4xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight animate-fadeInUp animation-delay-100">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-[#4169E1] via-[#3A5BCE] to-[#2E4AB8] bg-clip-text text-transparent">
              land your dream job
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium animate-fadeInUp animation-delay-200">
            Powerful features designed specifically for experienced professionals and tech workers. 
            Get the tools you need to accelerate your career.
          </p>
        </div>

        {/* Feature Section Carousel */}
        <div className="mb-20 lg:mb-24 relative">
          {/* Tab Navigation */}
          <div className="flex justify-center gap-3 mb-10 flex-wrap">
            {featureSections.map((section, index) => {
              const SectionIcon = section.badgeIcon;
              return (
                <button
                  key={index}
                  onClick={() => setCurrentSection(index)}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                    currentSection === index
                      ? 'bg-gradient-to-r from-[#4169E1] to-[#3A5BCE] text-white shadow-lg shadow-[#4169E1]/30 scale-105'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200/60 hover:border-[#4169E1]/50 hover:bg-[#4169E1]/10 hover:shadow-md'
                  }`}
                  aria-label={`Switch to ${section.badge}`}
                >
                  <SectionIcon className="w-4 h-4" />
                  {section.badge}
                </button>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSection}
            className="absolute -left-4 lg:-left-12 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-125 hover:-translate-x-1 border border-gray-200 group"
            aria-label="Previous section"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700 group-hover:text-[#4169E1] transition-colors duration-300" />
          </button>
          
          <button
            onClick={nextSection}
            className="absolute -right-4 lg:-right-12 top-1/2 -translate-y-1/2 z-20 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-125 hover:translate-x-1 border border-gray-200 group"
            aria-label="Next section"
          >
            <ChevronRight className="w-6 h-6 text-gray-700 group-hover:text-[#4169E1] transition-colors duration-300" />
          </button>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
            {/* Left: Description */}
            <div className="space-y-7 animate-fadeInUp animation-delay-300">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#4169E1]/20 via-[#4169E1]/10 to-[#4169E1]/20 border border-[#4169E1]/30 text-[#4169E1] font-semibold text-sm shadow-sm">
                <BadgeIcon className="w-4 h-4" />
                {currentFeatureSection.badge}
              </div>
              <h3 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                {currentFeatureSection.title}{' '}
                <span className="bg-gradient-to-r from-[#4169E1] via-[#3A5BCE] to-[#2E4AB8] bg-clip-text text-transparent">
                  {currentFeatureSection.titleHighlight}
                </span>
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed font-medium">
                {currentFeatureSection.description}
              </p>
              <div className="space-y-4">
                {currentFeatureSection.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4169E1]/20 to-[#4169E1]/30 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#4169E1]"></div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Image */}
            <div className="relative animate-fadeInUp animation-delay-400">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200/60 bg-white/90 backdrop-blur-sm p-5 hover:shadow-3xl transition-all duration-500">
                <img 
                  src={currentFeatureSection.image} 
                  alt={currentFeatureSection.imageAlt} 
                  className="w-full h-auto rounded-xl transition-opacity duration-500"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-r from-[#4169E1]/40 to-[#4169E1]/50 rounded-full opacity-15 blur-3xl"></div>
              <div className="absolute -top-6 -left-6 w-40 h-40 bg-gradient-to-r from-sky-300 to-[#4169E1]/40 rounded-full opacity-10 blur-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 