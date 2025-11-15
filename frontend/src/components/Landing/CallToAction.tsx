import { CheckCircle, Zap } from 'lucide-react';

export function CallToAction() {
  return (
    <section className="relative w-full py-20 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800"></div>
      
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-white/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-white/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold text-sm animate-fadeInUp animate-pulse-slow">
            <Zap className="w-4 h-4" />
            Limited Time Offer
          </div>

          {/* Main Heading */}
          <h2 className="text-4xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fadeInUp animation-delay-100">
            Ready to accelerate your{' '}
            <span className="bg-gradient-to-r from-blue-200 to-blue-300 bg-clip-text text-transparent">
              job search?
            </span>
          </h2>
          
          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed animate-fadeInUp animation-delay-200">
            Join 1,000+ professionals who have streamlined their job search with JobStalker AI's 
            AI-powered platform. Start tracking your applications today and see the difference.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12">
            <div className="flex items-center gap-2 text-blue-100 text-lg font-medium">
              <CheckCircle className="w-6 h-6 text-blue-200" />
              No credit card required
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/20 animate-fadeInUp animation-delay-300 hover:bg-white/15 transition-all duration-500 hover:scale-105">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                  <div className="flex -space-x-2">
                    {['👩‍💻', '👨‍💻', '👩‍💼', '👨‍💼'].map((avatar, index) => (
                      <div 
                        key={index} 
                        className="w-12 h-12 rounded-full border-2 border-white bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-xl shadow-sm hover:scale-125 hover:z-10 transition-all duration-300 cursor-default animate-float"
                        style={{ animationDelay: `${index * 0.2}s` }}
                      >
                        {avatar}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-white">
                  <div className="text-2xl font-bold mb-2">1,000+ professionals</div>
                  <div className="text-blue-100">trust JobStalker AI with their careers</div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                {[
                  { value: '4.9★', label: 'Average Rating' },
                  { value: '85%', label: 'Success Rate' },
                  { value: '30%', label: 'Faster Placement' }
                ].map((stat, index) => (
                  <div 
                    key={index} 
                    className="text-center hover:scale-110 transition-transform duration-300 animate-fadeInUp"
                    style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                  >
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-blue-100 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 