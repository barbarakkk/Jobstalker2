import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
          navigate('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        setError('Google login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f8ff] px-2">
      <Card className="w-full max-w-md mx-auto p-8 shadow-lg border-none">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="JobStalker" className="h-8 mb-4" />
          <h2 className="text-2xl font-bold mb-1 text-center">Sign In to JobStalker</h2>
        </div>
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        <Button 
          onClick={handleGoogleLogin}
          disabled={loading}
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
      </Card>
    </div>
  );
} 