import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Header } from './Layout/Header';
import { Hero } from './Landing/Hero';
import { Features } from './Landing/Features';
import { StatsSection } from './Landing/StatsSection';

export function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check if this is an OAuth callback (has hash fragment with auth data)
        const hash = window.location.hash;
        if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
          console.log('OAuth callback detected, processing...');
          // This is an OAuth callback, let the auth state change handler deal with it
          // Clear the hash to clean up the URL
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('User already authenticated, redirecting to dashboard');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      }
    };

    checkAuthAndRedirect();

    // Listen for auth state changes (handles OAuth callbacks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session ? 'session exists' : 'no session');
        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in, redirecting to dashboard');
          navigate('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header />
      <Hero />
      <Features />
      <StatsSection />
    </div>
  );
} 