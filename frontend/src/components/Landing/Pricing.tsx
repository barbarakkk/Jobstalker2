import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Payment system disabled for production - will be integrated later
// import { supabase } from '@/lib/supabaseClient';
// import { subscriptionApi } from '@/lib/api';
// import { useState } from 'react';
// import { Loader2 } from 'lucide-react';

export function Pricing() {
  const navigate = useNavigate();
  // Payment system disabled for production - will be integrated later
  // const [processing, setProcessing] = useState(false);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleUpgrade = () => {
    // Payment system disabled for production - redirect to login instead
    navigate('/login');
  };

  return (
    <section id="pricing" className="w-full py-24 lg:py-36 bg-gradient-to-b from-white via-[#4169E1]/10 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4169E1]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="relative container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#4169E1]/20 via-[#4169E1]/10 to-[#4169E1]/20 border border-[#4169E1]/30 text-[#4169E1] font-semibold text-sm shadow-sm">
            <Sparkles className="w-4 h-4" />
            Simple Pricing
          </div>
          <h2 className="text-4xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
            Choose the plan that{' '}
            <span className="bg-gradient-to-r from-[#4169E1] via-[#3A5BCE] to-[#2E4AB8] bg-clip-text text-transparent">
              works for you
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            Start free and upgrade when you're ready. No credit card required to get started.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto relative z-10">
          {/* Free Plan */}
          <Card className="relative bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">Free</CardTitle>
                <Badge variant="secondary" className="text-sm">Perfect for getting started</Badge>
              </div>
              <div className="mb-4">
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  $0
                  <span className="text-lg font-normal text-gray-600">/month</span>
                </div>
                <CardDescription className="text-sm text-gray-500 mt-1">
                  Forever free
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-gray-700">1 professional resume</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-gray-700">Unlimited job tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-gray-700">100 jobs from extension</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-gray-700">Unlimited jobs from web app</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-3.5 h-3.5 text-gray-400 text-xs">✕</span>
                  </div>
                  <span className="text-gray-500 line-through">AI Job Matcher</span>
                </li>
              </ul>
              <Button
                onClick={handleGetStarted}
                variant="outline"
                className="w-full border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold h-12"
              >
                Get Started Free
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative bg-white border-2 border-[#4169E1] shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
            {/* Popular Badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#4169E1] to-[#3A5BCE] text-white px-4 py-1.5 rounded-bl-lg rounded-tr-2xl text-xs font-bold">
              RECOMMENDED
            </div>
            
            <CardHeader className="pb-6 pt-8">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">Pro</CardTitle>
                <Badge className="bg-[#4169E1] text-white text-sm">Best Value</Badge>
              </div>
              <div className="mb-4">
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  $10
                  <span className="text-lg font-normal text-gray-600">/month</span>
                </div>
                <CardDescription className="text-sm text-gray-500 mt-1">
                  Billed monthly
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">20 professional resumes</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Unlimited job tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Unlimited jobs from extension</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Unlimited jobs from web app</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">AI Job Matcher included</span>
                </li>
              </ul>
              <Button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-[#4169E1] to-[#3A5BCE] hover:from-[#3A5BCE] hover:to-[#2E4AB8] text-white font-semibold h-12 shadow-lg hover:shadow-xl transition-all"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center relative z-10">
          <p className="text-gray-600 text-sm">
            All plans include our core features. Upgrade anytime, cancel anytime. No hidden fees.
          </p>
        </div>
      </div>
    </section>
  );
}

