import { Zap } from 'lucide-react';

export function CallToAction() {
  return (
    <section className="relative w-full py-20 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#4169E1] via-[#3A5BCE] to-[#2E4AB8]"></div>
      
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
            <span className="bg-gradient-to-r from-[#4169E1]/80 to-[#4169E1] bg-clip-text text-transparent">
              job search?
            </span>
          </h2>
          
          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed animate-fadeInUp animation-delay-200">
            Start tracking your applications today and see the difference.
          </p>
        </div>
      </div>
    </section>
  );
} 