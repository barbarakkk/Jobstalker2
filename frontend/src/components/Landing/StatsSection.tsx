import { TrendingUp, Users, Award, Clock } from 'lucide-react';

const stats = [
  {
    value: '1,000+',
    label: 'Professionals helped',
    description: 'Join our growing community of successful job seekers',
    icon: <Users className="w-8 h-8 text-white" />,
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100'
  },
  {
    value: '85%',
    label: 'Success rate',
    description: 'Average success rate for users who complete our program',
    icon: <TrendingUp className="w-8 h-8 text-white" />,
    gradient: 'from-blue-600 to-blue-700',
    bgGradient: 'from-blue-50 to-blue-100'
  },
  {
    value: '30%',
    label: 'Faster job placement',
    description: 'Users find jobs 30% faster than traditional methods',
    icon: <Award className="w-8 h-8 text-white" />,
    gradient: 'from-blue-700 to-blue-800',
    bgGradient: 'from-blue-50 to-blue-100'
  },
  {
    value: '24/7',
    label: 'AI Support',
    description: 'Round-the-clock AI assistance for your job search',
    icon: <Clock className="w-8 h-8 text-white" />,
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100'
  },
];

export function StatsSection() {
  return (
    <section className="w-full py-20 lg:py-32 bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 text-blue-700 font-semibold text-sm animate-fadeInUp">
            <TrendingUp className="w-4 h-4 animate-pulse-slow" />
            Proven Results
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight animate-fadeInUp animation-delay-100">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              thousands of professionals
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-fadeInUp animation-delay-200">
            Our platform has helped professionals across the tech industry accelerate their careers 
            and land their dream jobs faster than ever before.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="group relative bg-white rounded-3xl p-8 shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 overflow-hidden animate-fadeInUp"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-r ${stat.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                  {stat.icon}
                </div>
                
                {/* Value */}
                <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                  {stat.value}
                </div>
                
                {/* Label */}
                <div className="text-lg font-semibold text-gray-700 mb-3 group-hover:text-gray-600 transition-colors">
                  {stat.label}
                </div>
                
                {/* Description */}
                <div className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                  {stat.description}
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-blue-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
} 