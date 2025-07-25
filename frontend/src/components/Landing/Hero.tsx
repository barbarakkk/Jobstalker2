import { Button } from '@/components/ui/button';

const jobs = [
  { company: 'TechCorp', title: 'Senior Developer', status: 'Interview', statusColor: 'bg-blue-100 text-blue-700' },
  { company: 'StartupXYZ', title: 'Tech Lead', status: 'Applied', statusColor: 'bg-yellow-100 text-yellow-700' },
  { company: 'BigTech Inc', title: 'Principal Engineer', status: 'Offer', statusColor: 'bg-green-100 text-green-700' },
];

export function Hero() {
  return (
    <section className="w-full py-16 bg-gradient-to-br from-blue-100 to-blue-50">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-12 px-4">
        {/* Left: Text */}
        <div className="flex-1 max-w-xl">
          <span className="inline-block mb-4 px-4 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm shadow-sm">AI-Powered Job Search</span>
          <h1 className="text-4xl md:text-6xl font-bold text-blue-900 mb-4">
            Your AI Job Search <span className="text-blue-600">Companion</span>
          </h1>
          <p className="text-lg md:text-2xl text-blue-700 mb-8">
            Streamline your job search with intelligent tracking, interview prep, and personalized analytics. Built for experienced professionals and tech industry workers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg">Start Free Trial</Button>
            <Button variant="outline" className="border-blue-600 text-blue-600 px-8 py-3 text-lg font-semibold">Watch Demo</Button>
          </div>
          <div className="flex gap-6 mb-2">
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Free 14-day trial
            </div>
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              No credit card required
            </div>
          </div>
        </div>
        {/* Right: Job Applications Card */}
        <div className="flex-1 max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Job Applications</h2>
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">12 Active</span>
            </div>
            <div className="flex flex-col gap-3">
              {jobs.map((job) => (
                <div key={job.company} className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{job.company}</div>
                    <div className="text-xs text-gray-500">{job.title}</div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${job.statusColor}`}>{job.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 