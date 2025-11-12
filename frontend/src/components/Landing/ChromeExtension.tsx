import { Button } from '@/components/ui/button';
import { Chrome, Download, Zap, Bookmark, Link2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ChromeExtension() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleChromeStore = () => {
    // Replace with your actual Chrome Web Store URL when published
    window.open('https://chrome.google.com/webstore', '_blank');
  };

  const features = [
    {
      icon: <Bookmark className="w-6 h-6" />,
      title: 'One-Click Save',
      description: 'Save jobs from LinkedIn directly to your dashboard with a single click'
    },
    {
      icon: <Link2 className="w-6 h-6" />,
      title: 'Auto-Sync',
      description: 'All saved jobs automatically sync to your JobStalker AI dashboard'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Tracking',
      description: 'Start tracking applications immediately without leaving the job page'
    }
  ];

  return (
    <section className="relative w-full py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 text-blue-700 font-semibold text-sm shadow-sm">
              <Chrome className="w-4 h-4" />
              Chrome Extension Available
            </div>
            
            <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Save jobs{' '}
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                instantly
              </span>
              {' '}from anywhere
            </h2>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Download our free Chrome extension to save job postings directly from LinkedIn and other platforms. 
              Track all your applications in one place without switching tabs.
            </p>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleChromeStore}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-xl"
              >
                <Download className="w-5 h-5 mr-2" />
                Download from Chrome Store
              </Button>
              <Button
                onClick={handleGetStarted}
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 px-8 py-6 text-lg font-semibold bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-300"
              >
                Get Started Free
              </Button>
            </div>

            {/* Trust Badge */}
            <div className="mt-8 flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Free to use • No credit card required • Works with LinkedIn</span>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 transform hover:scale-105 transition-transform duration-500">
              {/* Browser Mockup */}
              <div className="bg-gray-100 rounded-t-lg p-3 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500">
                  linkedin.com/jobs/view/...
                </div>
              </div>
              
              {/* Extension Panel Mockup */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-b-lg p-6 border-t-2 border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Bookmark className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Save to JobStalker AI</div>
                    <div className="text-sm text-gray-600">Senior Developer at TechCorp</div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <div className="text-sm font-semibold text-gray-900">Bookmarked</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Excitement Level</div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-4 h-4 rounded ${i < 4 ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Zap className="w-4 h-4 mr-2" />
                  Save Job
                </Button>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl border border-gray-200 p-4 transform rotate-12">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="text-xs">
                  <div className="font-semibold text-gray-900">Saved!</div>
                  <div className="text-gray-600">Synced to dashboard</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

