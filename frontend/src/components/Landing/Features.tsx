import { Card, CardContent } from '@/components/ui/card';
import { Target, User, BarChart2, Search, Calendar, FileText, Sparkles, Zap, Shield, Clock, TrendingUp, Award } from 'lucide-react';

const features = [
  {
    title: 'Smart Application Tracking',
    description: 'Keep track of all your job applications with intelligent status updates, automated reminders, and progress insights.',
    icon: <Target className="w-8 h-8 text-white" />,
    gradient: 'from-blue-500 to-indigo-500',
    bgGradient: 'from-blue-50 to-indigo-50',
    highlight: 'AI-powered insights'
  },
  {
    title: 'Interview Preparation',
    description: 'Get personalized interview prep with company-specific questions, behavioral coaching, and mock interview sessions.',
    icon: <User className="w-8 h-8 text-white" />,
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    highlight: 'Company-specific prep'
  },
  {
    title: 'Advanced Analytics',
    description: 'Track your job search performance with detailed analytics, success metrics, and personalized recommendations.',
    icon: <BarChart2 className="w-8 h-8 text-white" />,
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    highlight: 'Performance insights'
  },
  {
    title: 'AI Job Matching',
    description: 'Our AI algorithms match you with relevant opportunities based on your skills, experience, and career goals.',
    icon: <Search className="w-8 h-8 text-white" />,
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-50 to-red-50',
    highlight: 'Smart matching'
  },
  {
    title: 'Schedule Management',
    description: 'Organize interviews, follow-ups, and deadlines with integrated calendar management and smart notifications.',
    icon: <Calendar className="w-8 h-8 text-white" />,
    gradient: 'from-indigo-500 to-blue-500',
    bgGradient: 'from-indigo-50 to-blue-50',
    highlight: 'Smart scheduling'
  },
  {
    title: 'Resume Optimization',
    description: 'AI-powered resume analysis and optimization for better ATS compatibility and maximum impact.',
    icon: <FileText className="w-8 h-8 text-white" />,
    gradient: 'from-cyan-500 to-blue-500',
    bgGradient: 'from-cyan-50 to-blue-50',
    highlight: 'ATS optimized'
  },
];

const stats = [
  { icon: <Sparkles className="w-6 h-6" />, value: '85%', label: 'Success Rate' },
  { icon: <Zap className="w-6 h-6" />, value: '30%', label: 'Faster Placement' },
  { icon: <Shield className="w-6 h-6" />, value: '10k+', label: 'Professionals' },
  { icon: <Clock className="w-6 h-6" />, value: '24/7', label: 'AI Support' },
];

export function Features() {
  return (
    <section id="features" className="w-full py-20 lg:py-32 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50/30"></div>
      
      <div className="relative container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 text-blue-700 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            Powerful Features
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              land your dream job
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Powerful features designed specifically for experienced professionals and tech workers. 
            Get the tools you need to accelerate your career.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center text-blue-600">
                  {stat.icon}
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white"
            >
              <CardContent className="p-8">
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-slate-800 transition-colors">
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-slate-600 mb-4 leading-relaxed group-hover:text-slate-700 transition-colors">
                    {feature.description}
                  </p>
                  
                  {/* Highlight */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium group-hover:bg-slate-200 transition-colors">
                    <TrendingUp className="w-3 h-3" />
                    {feature.highlight}
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 lg:p-12 border border-blue-200/50">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Award className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl lg:text-3xl font-bold text-slate-900">Ready to accelerate your career?</h3>
            </div>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their job search with JobStalker's AI-powered platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                Start Free Trial
              </button>
              <button className="border-2 border-slate-300 text-slate-700 hover:border-blue-600 hover:text-blue-600 px-8 py-4 rounded-xl font-semibold bg-white transition-all duration-300">
                View Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 