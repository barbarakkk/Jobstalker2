import { Header } from './Layout/Header';
import { Hero } from './Landing/Hero';
import { Features } from './Landing/Features';
import { StatsSection } from './Landing/StatsSection';
import { CallToAction } from './Landing/CallToAction';

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50">
      <Header />
      <Hero />
      <Features />
      <StatsSection />
      <CallToAction />
      {/* Footer will be handled in the AppShell/Layout */}
    </div>
  );
} 