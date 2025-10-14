import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // First, handle PKCE/code flow if present
        const url = new URL(window.location.href);
        const hasCode = !!url.searchParams.get('code');
        const hasError = !!url.searchParams.get('error');

        if (hasError) {
          navigate('/login?error=auth_failed');
          return;
        }

        if (hasCode) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(url.href);
          if (exchangeError) {
            console.error('Auth code exchange error:', exchangeError);
            navigate('/login?error=auth_failed');
            return;
          }
        }

        // Fallback: if provider used implicit flow (hash tokens), supabase-js already picked it up
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login?error=auth_failed');
          return;
        }

        if (data.session) {
          // User is authenticated, redirect to dashboard
          navigate('/dashboard');
        } else {
          // No session found, redirect to login
          navigate('/login');
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        navigate('/login?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f8ff] font-sans">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
        <p className="text-slate-600 font-semibold">Completing sign in...</p>
      </div>
    </div>
  );
}
