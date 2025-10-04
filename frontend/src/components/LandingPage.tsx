import { Header } from './Layout/Header';
import { Hero } from './Landing/Hero';
import { Features } from './Landing/Features';
import { StatsSection } from './Landing/StatsSection';

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header />
      <Hero />
      <Features />
      <StatsSection />
    </div>
  );
} 