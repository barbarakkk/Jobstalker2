import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="bg-blue-50 py-16 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
        {/* Left: Headline and CTA */}
        <div className="flex-1">
          <span className="inline-block mb-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            AI-Powered Job Search
          </span>
          <h1 className="text-5xl font-extrabold mb-4 text-gray-900 leading-tight">
            Your AI Job Search <span className="text-blue-600">Companion</span>
          </h1>
          <p className="mb-8 text-lg text-gray-700 max-w-xl">
            Streamline your job search with intelligent tracking, interview prep, and personalized analytics. Built for experienced professionals and tech industry workers.
          </p>
          <div className="flex gap-4 mb-4">
            <Button size="lg">Start Free Trial</Button>
            <Button variant="outline" size="lg">Watch Demo</Button>
          </div>
          <div className="flex gap-8 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✔</span> Free 14-day trial
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✔</span> No credit card required
            </div>
          </div>
        </div>
        {/* Right: Job Applications Card */}
        <div className="flex-1 flex justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-80">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-gray-800">Job Applications</span>
              <span className="text-green-500 text-xs font-bold bg-green-100 px-2 py-1 rounded-full">12 Active</span>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">TechCorp</div>
                  <div className="text-xs text-gray-500">Senior Developer</div>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">Interview</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">StartupXYZ</div>
                  <div className="text-xs text-gray-500">Tech Lead</div>
                </div>
                <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">Applied</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">BigTech Inc</div>
                  <div className="text-xs text-gray-500">Principal Engineer</div>
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">Offer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
