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
          // Check if profile is complete
          try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
              (import.meta.env.DEV ? 'http://localhost:8000' : 'https://jobstalker2-production.up.railway.app');
            const response = await fetch(`${API_BASE_URL}/api/profile`, {
              headers: {
                'Authorization': `Bearer ${data.session.access_token}`
              }
            });
            
            if (response.ok) {
              const profile = await response.json();
              // Only consider profile complete if explicitly marked as completed
              // Don't check for fields - user must complete the full wizard
              const isProfileComplete = profile.profile_completed === true;
              
              if (!isProfileComplete) {
                navigate('/register/complete');
                return;
              }
            }
          } catch (err) {
            console.error('Error checking profile:', err);
            // If profile check fails, still allow user to proceed (they can complete profile later)
          }
          
          // User is authenticated and profile is complete, redirect to resume builder
          navigate('/resume-builder');
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
