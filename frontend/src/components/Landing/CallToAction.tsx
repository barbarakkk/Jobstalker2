import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CallToAction() {
  const navigate = useNavigate();

  const handleStartFreeTrial = () => {
    navigate('/register');
  };

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
          <div className="inline-flex items-center gap-2 mb-8 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold text-sm">
            <Zap className="w-4 h-4" />
            Limited Time Offer
          </div>

          {/* Main Heading */}
          <h2 className="text-4xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Ready to accelerate your{' '}
            <span className="bg-gradient-to-r from-blue-200 to-blue-300 bg-clip-text text-transparent">
              job search?
            </span>
          </h2>
          
          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of professionals who have streamlined their job search with JobStalker's 
            AI-powered platform. Start your free trial today and see the difference.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Button 
              onClick={handleStartFreeTrial}
              className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 rounded-2xl"
            >
              Start Free Trial
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 backdrop-blur-sm px-10 py-5 text-xl font-bold rounded-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Play className="w-6 h-6 mr-3" />
              Watch Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12">
            <div className="flex items-center gap-2 text-blue-100 text-lg font-medium">
              <CheckCircle className="w-6 h-6 text-blue-200" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2 text-blue-100 text-lg font-medium">
              <CheckCircle className="w-6 h-6 text-blue-200" />
              No credit card required
            </div>
            <div className="flex items-center gap-2 text-blue-100 text-lg font-medium">
              <CheckCircle className="w-6 h-6 text-blue-200" />
              Cancel anytime
            </div>
          </div>

          {/* Social Proof */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/20">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                  <div className="flex -space-x-2">
                    {['👩‍💻', '👨‍💻', '👩‍💼', '👨‍💼'].map((avatar, index) => (
                      <div key={index} className="w-12 h-12 rounded-full border-2 border-white bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-xl shadow-sm">
                        {avatar}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-white">
                  <div className="text-2xl font-bold mb-2">10,000+ professionals</div>
                  <div className="text-blue-100">trust JobStalker with their careers</div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">4.9★</div>
                  <div className="text-blue-100 text-sm">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">85%</div>
                  <div className="text-blue-100 text-sm">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">30%</div>
                  <div className="text-blue-100 text-sm">Faster Placement</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 