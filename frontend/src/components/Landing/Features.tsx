import { Card, CardContent } from '@/components/ui/card';
import { Target, User, BarChart2, Search, Calendar, FileText, Sparkles, Zap, Shield, Clock, TrendingUp, Award } from 'lucide-react';

const features = [
  {
    title: 'Smart Application Tracking',
    description: 'Keep track of all your job applications with intelligent status updates, automated reminders, and progress insights.',
    icon: <Target className="w-8 h-8 text-white" />,
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100',
    highlight: 'AI-powered insights'
  },
  {
    title: 'Interview Preparation',
    description: 'Get personalized interview prep with company-specific questions, behavioral coaching, and mock interview sessions.',
    icon: <User className="w-8 h-8 text-white" />,
    gradient: 'from-blue-600 to-blue-700',
    bgGradient: 'from-blue-50 to-blue-100',
    highlight: 'Company-specific prep',
    comingSoon: true
  },
  {
    title: 'Advanced Analytics',
    description: 'Track your job search performance with detailed analytics, success metrics, and personalized recommendations.',
    icon: <BarChart2 className="w-8 h-8 text-white" />,
    gradient: 'from-blue-700 to-blue-800',
    bgGradient: 'from-blue-50 to-blue-100',
    highlight: 'Performance insights'
  },
  {
    title: 'AI Job Matching',
    description: 'Our AI algorithms match you with relevant opportunities based on your skills, experience, and career goals.',
    icon: <Search className="w-8 h-8 text-white" />,
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100',
    highlight: 'Smart matching',
    comingSoon: true
  },
  {
    title: 'Schedule Management',
    description: 'Organize interviews, follow-ups, and deadlines with integrated calendar management and smart notifications.',
    icon: <Calendar className="w-8 h-8 text-white" />,
    gradient: 'from-blue-600 to-blue-700',
    bgGradient: 'from-blue-50 to-blue-100',
    highlight: 'Smart scheduling'
  },
  {
    title: 'Resume Optimization',
    description: 'AI-powered resume analysis and optimization for better ATS compatibility and maximum impact.',
    icon: <FileText className="w-8 h-8 text-white" />,
    gradient: 'from-blue-700 to-blue-800',
    bgGradient: 'from-blue-50 to-blue-100',
    highlight: 'ATS optimized',
    comingSoon: true
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
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50/30"></div>
      
      <div className="relative container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 text-blue-700 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            Powerful Features
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              land your dream job
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Powerful features designed specifically for experienced professionals and tech workers. 
            Get the tools you need to accelerate your career.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl flex items-center justify-center text-blue-600">
                  {stat.icon}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-gray-200 bg-white relative"
              style={{
                transitionDelay: `${index * 60}ms`,
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className={`leading-relaxed mb-4 ${feature.comingSoon ? 'text-gray-500' : 'text-gray-600'}`}>
                      {feature.description}
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-200 text-blue-700 text-sm font-semibold">
                      {feature.highlight}
                    </div>
                    {feature.comingSoon && (
                      <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-yellow-100 border border-yellow-200 text-yellow-800 text-xs font-semibold">
                        Coming soon
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>


      </div>
    </section>
  );
} 