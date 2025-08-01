import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CallToAction() {
  const navigate = useNavigate();

  const handleStartFreeTrial = () => {
    navigate('/register');
  };

  return (
    <section className="w-full py-20 bg-gradient-to-r from-blue-600 to-blue-500 flex flex-col items-center text-center">
      <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Ready to accelerate your job search?</h2>
      <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">
        Join thousands of professionals who have streamlined their job search with JobStalker
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
        <Button 
          onClick={handleStartFreeTrial}
          className="bg-white text-blue-700 font-semibold px-8 py-3 text-lg flex items-center gap-2 shadow-md hover:bg-blue-50"
        >
          Start Free Trial <ArrowRight className="w-5 h-5" />
        </Button>
        <Button variant="outline" className="border-white text-white px-8 py-3 text-lg font-semibold hover:bg-blue-700">
          Schedule Demo
        </Button>
      </div>
      <div className="text-blue-100 text-sm mt-2">14-day free trial &middot; No credit card required &middot; Cancel anytime</div>
    </section>
  );
} 