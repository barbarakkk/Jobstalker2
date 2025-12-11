import { TrendingUp, Award, Zap } from 'lucide-react';

const stats = [
  {
    value: '80%',
    label: 'Easier & Less Stressful',
    description: '80% of users say the job search process is easier and less stressful.',
    icon: <Zap className="w-8 h-8 text-white" />,
    gradient: 'from-[#4169E1] to-[#3A5BCE]',
    bgGradient: 'from-[#4169E1]/10 to-[#4169E1]/20'
  },
  {
    value: '30%',
    label: 'Faster Job Placements',
    description: 'Job placements are 30% faster compared to traditional methods.',
    icon: <Award className="w-8 h-8 text-white" />,
    gradient: 'from-[#3A5BCE] to-[#2E4AB8]',
    bgGradient: 'from-[#4169E1]/10 to-[#4169E1]/20'
  },
  {
    value: 'Increased',
    label: 'Interview Success',
    description: 'Interview landing rates and speed have increased for our community.',
    icon: <TrendingUp className="w-8 h-8 text-white" />,
    gradient: 'from-[#4169E1] to-[#3A5BCE]',
    bgGradient: 'from-[#4169E1]/10 to-[#4169E1]/20'
  },
];

export function StatsSection() {
  return (
    <section className="w-full py-24 lg:py-36 bg-gradient-to-br from-[#4169E1]/10 via-sky-50/60 to-[#4169E1]/20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-[#4169E1]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-[#4169E1]/40 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20 relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#4169E1]/20 via-[#4169E1]/10 to-[#4169E1]/20 border border-[#4169E1]/30 text-[#4169E1] font-semibold text-sm shadow-sm animate-fadeInUp">
            <TrendingUp className="w-4 h-4 animate-pulse-slow" />
            Benefits
          </div>
          <h2 className="text-4xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight animate-fadeInUp animation-delay-100">
            Benefits of Using JobStalker AI
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative z-10">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="group relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 lg:p-10 shadow-lg border border-gray-200/60 hover:shadow-2xl hover:border-[#4169E1]/50 transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] overflow-hidden animate-fadeInUp"
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
              <div className="absolute inset-0 bg-gradient-to-r from-[#4169E1]/5 to-[#3A5BCE]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
} 