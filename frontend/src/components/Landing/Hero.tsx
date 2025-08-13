import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, CheckCircle, Star, TrendingUp, Users } from 'lucide-react';

const jobs = [
  { 
    company: 'TechCorp', 
    title: 'Senior Developer', 
    status: 'Interview', 
    statusColor: 'bg-blue-100 text-blue-700 border-blue-200',
    logo: '🔵',
    salary: '$120k-150k'
  },
  { 
    company: 'StartupXYZ', 
    title: 'Tech Lead', 
    status: 'Applied', 
    statusColor: 'bg-blue-100 text-blue-700 border-blue-200',
    logo: '🟢',
    salary: '$140k-180k'
  },
  { 
    company: 'BigTech Inc', 
    title: 'Principal Engineer', 
    status: 'Offer', 
    statusColor: 'bg-blue-100 text-blue-700 border-blue-200',
    logo: '🟣',
    salary: '$180k-220k'
  },
];

const testimonials = [
  { name: "Sarah Chen", role: "Senior Developer", company: "Google", avatar: "👩‍💻" },
  { name: "Mike Rodriguez", role: "Tech Lead", company: "Microsoft", avatar: "👨‍💻" },
  { name: "Emily Watson", role: "Engineering Manager", company: "Amazon", avatar: "👩‍💼" },
];

export function Hero() {
  const navigate = useNavigate();

  const handleStartFreeTrial = () => {
    navigate('/register');
  };

  return (
    <section className="relative w-full py-20 lg:py-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 px-4 lg:px-8">
        {/* Left: Text Content */}
        <div className="flex-1 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 text-blue-700 font-semibold text-sm shadow-sm">
            <Star className="w-4 h-4" />
            AI-Powered Job Search Platform
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Your AI Job Search{' '}
            <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
              Companion
            </span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-slate-600 mb-8 leading-relaxed">
            Streamline your job search with intelligent tracking, interview prep, and personalized analytics. 
            Built for experienced professionals and tech industry workers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button 
              onClick={handleStartFreeTrial}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-slate-300 text-slate-700 hover:border-blue-600 hover:text-blue-600 px-8 py-4 text-lg font-semibold bg-white/80 backdrop-blur-sm"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 mb-8">
            <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
              <CheckCircle className="w-5 h-5" />
              Free 14-day trial
            </div>
            <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
              <CheckCircle className="w-5 h-5" />
              No credit card required
            </div>
            <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
              <CheckCircle className="w-5 h-5" />
              Cancel anytime
            </div>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex -space-x-2">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-lg shadow-sm">
                  {testimonial.avatar}
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">10,000+ professionals</span> trust JobStalker
            </div>
          </div>
        </div>

        {/* Right: Interactive Dashboard Preview */}
        <div className="flex-1 max-w-lg w-full">
          <div className="relative">
            {/* Main Dashboard Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-6 lg:p-8 border border-slate-200/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">JS</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Job Applications</h2>
                    <p className="text-sm text-slate-500">Track your progress</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
                  <TrendingUp className="w-3 h-3" />
                  12 Active
                </div>
              </div>
              
              <div className="space-y-4">
                {jobs.map((job, index) => (
                  <div key={job.company} className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-4 border border-slate-200/50 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{job.logo}</div>
                        <div>
                          <div className="font-semibold text-slate-900">{job.company}</div>
                          <div className="text-sm text-slate-600">{job.title}</div>
                          <div className="text-xs text-slate-500">{job.salary}</div>
                        </div>
                      </div>
                      <div className={`text-xs font-semibold px-3 py-1 rounded-full border ${job.statusColor}`}>
                        {job.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-slate-900">85%</div>
                    <div className="text-xs text-slate-500">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900">30%</div>
                    <div className="text-xs text-slate-500">Faster Placement</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900">4.9★</div>
                    <div className="text-xs text-slate-500">User Rating</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 