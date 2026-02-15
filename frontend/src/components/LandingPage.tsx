import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Header } from './Layout/Header';
import { Footer } from './Layout/Footer';
import { Hero } from './Landing/Hero';
import { Features } from './Landing/Features';
import { HowItWorks } from './Landing/HowItWorks';
import { StatsSection } from './Landing/StatsSection';
import { FAQ } from './Landing/FAQ';
import { ChromeExtension } from './Landing/ChromeExtension';

export function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check if this is an OAuth callback (has hash fragment with auth data)
        const hash = window.location.hash;
        if (hash && (hash.includes('access_token') || hash.includes('refresh_token') || hash.includes('code'))) {
          // Forward to dedicated handler so it can finalize session and redirect
          navigate('/auth/callback');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('User already authenticated, redirecting to resume builder');
          navigate('/resume-builder');
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
          console.log('User signed in, redirecting to resume builder');
          navigate('/resume-builder');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <Header />
      <Hero />
      <Features />
      <ChromeExtension />
      <StatsSection />
      <FAQ />
      <Footer />
    </div>
  );
}
