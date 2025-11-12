import { Star, TrendingUp, Users, CheckCircle } from 'lucide-react';
import ColoredLogoHorizontal from '@/assets/ColoredLogoHorizontal.svg';
import { useEffect, useRef, useState } from 'react';

const jobs = [
  { 
    company: 'TechCorp', 
    title: 'Senior Developer', 
    status: 'Interview', 
    statusColor: 'bg-purple-100 text-purple-700 border-purple-200',
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
    statusColor: 'bg-green-100 text-green-700 border-green-200',
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY || window.pageYOffset);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouse({ x, y });
  };

  const blobParallax = (mult: number) => ({
    transform: `translate(${mouse.x * 10 * mult}px, ${mouse.y * 10 * mult}px) translateY(${scrollY * 0.05 * mult}px)`
  });

  const cardTilt = {
    transform: `perspective(1000px) rotateY(${mouse.x * 6}deg) rotateX(${mouse.y * -6}deg) translateY(${scrollY * 0.02}px)`
  } as React.CSSProperties;

  return (
    <section className="relative w-full py-20 lg:py-32 overflow-hidden" onMouseMove={onMouseMove}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100"></div>
      <div className="absolute top-0 left-0 w-full h-full" ref={containerRef}>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={blobParallax(1)}></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" style={blobParallax(-0.8)}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" style={blobParallax(0.6)}></div>
      </div>

      <div className="relative container mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 px-4 lg:px-8">
        {/* Left: Text Content */}
        <div className="flex-1 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 text-blue-700 font-semibold text-sm shadow-sm">
            <Star className="w-4 h-4" />
            AI-Powered Job Search Platform
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Your AI Job Search{' '}
            <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
              Companion
            </span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed">
            The best tool for job seekers to track job applications and fill application forms on other platforms. 
            Streamline your job search with intelligent tracking and personalized analytics.
          </p>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-8">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Join 1,000+ professionals</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Trusted by job seekers</span>
            </div>
          </div>
        </div>

        {/* Right: Interactive Demo */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            {/* Main Demo Card */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 transform transition-all duration-500 will-change-transform" style={cardTilt}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={ColoredLogoHorizontal} 
                    alt="JobStalker AI" 
                    className="h-8 w-auto"
                  />
                  <div>
                    <p className="text-sm text-gray-600">Dashboard</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">5</div>
                  <div className="text-xs text-gray-600">Active Jobs</div>
                </div>
              </div>
              
              {/* Status Cards */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                <div className="bg-white border border-gray-200 rounded-lg p-2 text-center transition-transform duration-300 hover:-translate-y-1">
                  <div className="text-lg font-bold text-gray-900">0</div>
                  <div className="text-xs text-gray-600">Bookmarked</div>
                </div>
                <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-2 text-center transition-transform duration-300 hover:-translate-y-1">
                  <div className="text-lg font-bold text-gray-900">1</div>
                  <div className="text-xs text-gray-600">Applying</div>
                </div>
                <div className="bg-blue-100 border border-blue-200 rounded-lg p-2 text-center transition-transform duration-300 hover:-translate-y-1">
                  <div className="text-lg font-bold text-gray-900">2</div>
                  <div className="text-xs text-gray-600">Applied</div>
                </div>
                <div className="bg-purple-100 border border-purple-200 rounded-lg p-2 text-center transition-transform duration-300 hover:-translate-y-1">
                  <div className="text-lg font-bold text-gray-900">1</div>
                  <div className="text-xs text-gray-600">Interviewing</div>
                </div>
                <div className="bg-green-100 border border-green-200 rounded-lg p-2 text-center transition-transform duration-300 hover:-translate-y-1">
                  <div className="text-lg font-bold text-gray-900">1</div>
                  <div className="text-xs text-gray-600">Accepted</div>
                </div>
              </div>
              
              {/* Sample Job */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Senior Developer</div>
                    <div className="text-xs text-gray-600">TechCorp</div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${jobs[0].statusColor}`}>
                    {jobs[0].status}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg border border-gray-200 p-3 transform -rotate-12 transition-transform duration-500 hover:-translate-y-1" style={blobParallax(-0.5)}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-gray-900">Interview Scheduled</div>
                  <div className="text-gray-600">Tomorrow 2:00 PM</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border border-gray-200 p-3 transform rotate-12 transition-transform duration-500 hover:-translate-y-1" style={blobParallax(0.5)}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-gray-900">New Match</div>
                  <div className="text-gray-600">Google - Senior Dev</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 