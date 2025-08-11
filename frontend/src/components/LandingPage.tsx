import { Header } from './Layout/Header';
import { Hero } from './Landing/Hero';
import { Features } from './Landing/Features';
import { StatsSection } from './Landing/StatsSection';
import { PricingSection } from './Landing/PricingSection';
import { CallToAction } from './Landing/CallToAction';
import { Footer } from './Landing/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      <Hero />
      <Features />
      <StatsSection />
      <PricingSection />
      <CallToAction />
      <Footer />
    </div>
  );
} 