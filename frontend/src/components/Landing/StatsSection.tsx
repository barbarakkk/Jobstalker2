import { TrendingUp, Users, Award, Clock } from 'lucide-react';

const stats = [
  {
    value: '10,000+',
    label: 'Professionals helped',
    description: 'Join our growing community of successful job seekers',
    icon: <Users className="w-8 h-8 text-blue-600" />,
    gradient: 'from-blue-500 to-indigo-500',
    bgGradient: 'from-blue-50 to-indigo-50'
  },
  {
    value: '85%',
    label: 'Success rate',
    description: 'Average success rate for users who complete our program',
    icon: <TrendingUp className="w-8 h-8 text-emerald-600" />,
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50'
  },
  {
    value: '30%',
    label: 'Faster job placement',
    description: 'Users find jobs 30% faster than traditional methods',
    icon: <Award className="w-8 h-8 text-purple-600" />,
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50'
  },
  {
    value: '24/7',
    label: 'AI Support',
    description: 'Round-the-clock AI assistance for your job search',
    icon: <Clock className="w-8 h-8 text-orange-600" />,
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-50 to-red-50'
  },
];

export function StatsSection() {
  return (
    <section className="w-full py-20 lg:py-32 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200 text-blue-700 font-semibold text-sm">
            <TrendingUp className="w-4 h-4" />
            Proven Results
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              thousands of professionals
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Our platform has helped professionals across the tech industry accelerate their careers 
            and land their dream jobs faster than ever before.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="group relative bg-white rounded-3xl p-8 shadow-xl border border-slate-200/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-r ${stat.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
                
                {/* Value */}
                <div className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2 group-hover:text-slate-800 transition-colors">
                  {stat.value}
                </div>
                
                {/* Label */}
                <div className="text-lg font-semibold text-slate-700 mb-3 group-hover:text-slate-600 transition-colors">
                  {stat.label}
                </div>
                
                {/* Description */}
                <div className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
                  {stat.description}
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
            </div>
          ))}
        </div>

        {/* Bottom Testimonial */}
        <div className="mt-20 text-center">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-slate-200/50 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👨‍💻</span>
              </div>
            </div>
            <blockquote className="text-xl lg:text-2xl text-slate-700 mb-6 italic leading-relaxed">
              "JobStalker helped me land my dream job at Google in just 3 weeks. The AI-powered insights and interview prep were game-changers."
            </blockquote>
            <div className="text-slate-600">
              <div className="font-semibold text-slate-900">Alex Chen</div>
              <div className="text-sm">Senior Software Engineer at Google</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 