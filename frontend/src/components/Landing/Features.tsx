import { Card } from '@/components/ui/card';
import { Target, User, BarChart2, Search, Calendar, FileText } from 'lucide-react';

const features = [
  {
    title: 'Application Tracking',
    description: 'Keep track of all your job applications in one place with intelligent status updates and reminders.',
    icon: <Target className="w-7 h-7 text-blue-500" />,
  },
  {
    title: 'Interview Preparation',
    description: 'AI-powered interview prep with company-specific questions and personalized coaching.',
    icon: <User className="w-7 h-7 text-blue-500" />,
  },
  {
    title: 'Analytics & Insights',
    description: 'Get detailed analytics on your job search performance and personalized recommendations.',
    icon: <BarChart2 className="w-7 h-7 text-blue-500" />,
  },
  {
    title: 'Smart Job Matching',
    description: 'AI algorithms match you with relevant opportunities based on your skills and preferences.',
    icon: <Search className="w-7 h-7 text-blue-500" />,
  },
  {
    title: 'Schedule Management',
    description: 'Organize interviews, follow-ups, and deadlines with integrated calendar management.',
    icon: <Calendar className="w-7 h-7 text-blue-500" />,
  },
  {
    title: 'Resume Optimization',
    description: 'AI-powered resume analysis and optimization for better ATS compatibility and impact.',
    icon: <FileText className="w-7 h-7 text-blue-500" />,
  },
];

export function Features() {
  return (
    <section id="features" className="w-full py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900 mb-2">Everything you need to land your dream job</h2>
        <p className="text-lg text-gray-600 text-center mb-10 max-w-2xl mx-auto">
          Powerful features designed specifically for experienced professionals and tech workers
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="flex flex-col items-start p-8 border border-gray-200 rounded-2xl shadow-none hover:shadow-md transition-shadow">
              <div className="bg-blue-50 rounded-lg p-3 mb-6 flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-base">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
} 