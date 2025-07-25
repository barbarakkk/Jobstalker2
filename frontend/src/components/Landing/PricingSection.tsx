import { Button } from '@/components/ui/button';

export function PricingSection() {
  return (
    <section id="pricing" className="w-full py-20 bg-white flex justify-center">
      <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8 md:gap-0 max-w-4xl rounded-2xl overflow-hidden shadow-lg">
        {/* Left: Free Plan */}
        <div className="flex-1 bg-white p-10 flex flex-col justify-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4">Ready to land your dream job?</h2>
          <p className="text-gray-700 mb-6">Join thousands of job seekers who have increased their interview rates by 3x with JobStalker's AI-powered tools.</p>
          <ul className="mb-8 space-y-3">
            {[
              'Smart job matching with AI',
              'Resume optimization for ATS',
              'Interview preparation and coaching',
              'Application tracking and analytics',
              'Free plan available',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-base text-gray-800">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                {feature}
              </li>
            ))}
          </ul>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 text-lg rounded-lg shadow">Sign Up</Button>
        </div>
        {/* Right: Pro Plan */}
        <div className="flex-1 bg-blue-600 p-10 flex flex-col justify-center items-center text-white">
          <div className="mb-4">
            <span className="inline-block bg-white text-blue-700 font-bold px-4 py-2 rounded-lg text-sm shadow">PRO</span>
          </div>
          <h3 className="text-xl font-bold mb-2">JobStalker Pro</h3>
          <div className="text-4xl font-extrabold mb-2">$10<span className="text-lg font-medium">/month</span></div>
          <p className="mb-8 text-blue-100 text-center">Unlock advanced AI tools, unlimited job applications, and priority support.</p>
          <Button variant="outline" className="bg-white/80 text-blue-700 font-semibold px-8 py-3 text-lg rounded-lg hover:bg-white">Upgrade to Pro</Button>
        </div>
      </div>
    </section>
  );
} 