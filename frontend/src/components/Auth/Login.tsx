import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ColoredLogoHorizontal from '@/assets/ColoredLogoHorizontal.svg';

export function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUri = searchParams.get('redirect_uri');

  // Check if user is already authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/dashboard');
      }
    };
    checkUser();
  }, [navigate]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          if (redirectUri) {
            const token = session.access_token;
            window.location.href = `${redirectUri}#access_token=${token}`;
            return;
          }
          navigate('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, redirectUri]);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const redirectUrl = redirectUri || `${window.location.origin}/auth/callback`;
      console.log('Google OAuth redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        setError('Google login failed. Please try again.');
      }
    } catch (err) {
      console.error('Google OAuth exception:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setError(null);
    setGithubLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'github',
        options: {
          redirectTo: redirectUri || `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        setError('GitHub login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setGithubLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    setError(null);
    setLinkedinLoading(true);
    
    try {
      // Supabase uses LinkedIn OIDC. If your project is older and still uses
      // the legacy LinkedIn provider, switch 'linkedin_oidc' to 'linkedin'.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc' as any,
        options: {
          redirectTo: redirectUri || `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        setError('LinkedIn login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLinkedinLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f8ff] px-2 font-sans">
      <Card className="w-full max-w-md mx-auto p-8 shadow-lg border-none">
        <div className="flex flex-col items-center mb-6">
          <img src={ColoredLogoHorizontal} alt="JobStalker AI" className="h-8 mb-4" />
          <h2 className="text-2xl font-bold mb-1 text-center">Sign In</h2>
        </div>
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        
        <div className="space-y-3">
          <Button 
            onClick={handleGoogleLogin}
            disabled={loading || githubLoading || linkedinLoading}
            className="w-full flex items-center justify-center"
            variant="outline"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                Signing in...
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.484 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.148s2.75-6.148 6.125-6.148c1.922 0 3.211.82 3.953 1.523l2.703-2.625c-1.727-1.617-3.953-2.617-6.656-2.617-5.523 0-10 4.477-10 10s4.477 10 10 10c5.75 0 9.547-4.016 9.547-9.648 0-.648-.07-1.148-.156-1.66z"/>
                  <path fill="none" d="M0 0h24v24H0z"/>
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          {/* GitHub login temporarily disabled - enable in Supabase first */}
          {/*
          <Button 
            onClick={handleGitHubLogin}
            disabled={loading || githubLoading || linkedinLoading}
            className="w-full flex items-center justify-center bg-gray-900 text-white"
            variant="outline"
          >
            {githubLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </>
            )}
          </Button>
          */}

          <Button 
            onClick={handleLinkedInLogin}
            disabled={loading || githubLoading || linkedinLoading}
            className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
            variant="outline"
          >
            {linkedinLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Login with LinkedIn
              </>
            )}
          </Button>
          
        </div>
      </Card>
    </div>
  );
} 