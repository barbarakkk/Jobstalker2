import { useNavigate } from 'react-router-dom';
import { startTransition } from 'react';
import { Button } from '@/components/ui/button';
import ColoredLogoHorizontal from '@/assets/ColoredLogoHorizontal.svg';
import { supabase } from '@/lib/supabaseClient';

type ActiveTab = 'jobs' | 'resume' | 'profile';

interface AppHeaderProps {
  active?: ActiveTab;
}

export function AppHeader({ active = 'jobs' }: AppHeaderProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Prefetch components on hover/focus for instant navigation
  const prefetchComponent = (path: string) => {
    if (path === '/dashboard') {
      import('@/components/Dashboard').catch(() => {});
    } else if (path === '/profile') {
      import('@/components/Profile/ProfilePage').catch(() => {});
    } else if (path === '/resume-builder') {
      import('@/components/ResumeBuilder/ResumeBuilderHome').catch(() => {});
    }
  };

  const handleNavigate = (path: string) => {
    startTransition(() => {
      navigate(path);
    });
  };

  const linkClass = (id: ActiveTab) => (
    id === active
      ? 'text-blue-600 font-semibold px-4 py-2 rounded-full bg-blue-50'
      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium px-4 py-2 rounded-full'
  );

  return (
    <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-lg sticky top-0 z-50">
      <div className="w-full py-6">
        <div className="flex items-center px-4 relative">
          <div className="flex items-center">
            <img src={ColoredLogoHorizontal} alt="JobStalker AI" className="h-8 w-auto" />
          </div>
          <nav className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center space-x-4">
            <a 
              href="#" 
              className={linkClass('jobs')} 
              onMouseEnter={() => prefetchComponent('/dashboard')}
              onFocus={() => prefetchComponent('/dashboard')}
              onClick={(e) => { e.preventDefault(); handleNavigate('/dashboard'); }}
            >
              JobTracker
            </a>
            <a 
              href="#" 
              className={linkClass('resume')} 
              onMouseEnter={() => prefetchComponent('/resume-builder')}
              onFocus={() => prefetchComponent('/resume-builder')}
              onClick={(e) => { e.preventDefault(); handleNavigate('/resume-builder'); }}
            >
              Resume Builder
            </a>
            <a 
              href="#" 
              className={linkClass('profile')} 
              onMouseEnter={() => prefetchComponent('/profile')}
              onFocus={() => prefetchComponent('/profile')}
              onClick={(e) => { e.preventDefault(); handleNavigate('/profile'); }}
            >
              Profile
            </a>
          </nav>
          <div className="ml-auto pr-2">
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden px-4 pb-4 -mt-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button 
            className={active==='jobs' ? 'px-3 py-1.5 text-sm rounded-full bg-blue-50 text-blue-600 font-semibold whitespace-nowrap' : 'px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700 whitespace-nowrap'} 
            onMouseEnter={() => prefetchComponent('/dashboard')}
            onFocus={() => prefetchComponent('/dashboard')}
            onClick={() => handleNavigate('/dashboard')}
          >
            JobTracker
          </button>
          <button 
            className={active==='resume' ? 'px-3 py-1.5 text-sm rounded-full bg-blue-50 text-blue-600 font-semibold whitespace-nowrap' : 'px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700 whitespace-nowrap'} 
            onMouseEnter={() => prefetchComponent('/resume-builder')}
            onFocus={() => prefetchComponent('/resume-builder')}
            onClick={() => handleNavigate('/resume-builder')}
          >
            Resume Builder
          </button>
          <button 
            className={active==='profile' ? 'px-3 py-1.5 text-sm rounded-full bg-blue-50 text-blue-600 font-semibold whitespace-nowrap' : 'px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-700 whitespace-nowrap'} 
            onMouseEnter={() => prefetchComponent('/profile')}
            onFocus={() => prefetchComponent('/profile')}
            onClick={() => handleNavigate('/profile')}
          >
            Profile
          </button>
        </div>
      </div>
    </header>
  );
}


