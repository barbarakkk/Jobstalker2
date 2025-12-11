import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        // Use getSession which is synchronous and cached - much faster
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session && !error) {
          setAuthenticated(true);
          setLoading(false);
          // Show children immediately while listening for changes in background
        } else {
          setAuthenticated(false);
          setLoading(false);
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (!mounted) return;
        setAuthenticated(false);
        setLoading(false);
        navigate('/login');
      }
    };

    // Check auth immediately
    checkAuth();

    // Listen for auth state changes in background (non-blocking)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_OUT') {
          setAuthenticated(false);
          navigate('/login');
        } else if (event === 'SIGNED_IN' && session) {
          setAuthenticated(true);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Show loading only briefly - getSession is fast
  if (loading && !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f8ff] font-sans">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-slate-600 font-semibold">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect to login
  }

  // Show children immediately once authenticated
  return <>{children}</>;
}
