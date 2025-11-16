import { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

const faqs = [
  {
    question: "What is JobStalker AI?",
    answer: "JobStalker AI is an AI-powered job search platform that helps you track job applications, save jobs from LinkedIn using our Chrome extension, build professional resumes with AI, and provides intelligent analytics to improve your job search success rate."
  },
  {
    question: "How does the Chrome extension work?",
    answer: "Our Chrome extension allows you to save job postings directly from LinkedIn with one click. When you're viewing a job on LinkedIn, click the extension icon to open the side panel, then click 'Save Job'. Our AI will extract all job details and add it to your dashboard automatically."
  },
  {
    question: "Can I track applications from multiple sources?",
    answer: "Yes! You can track applications from LinkedIn (using our Chrome extension), Indeed, company websites, and any other source. You can also manually add job applications directly from your dashboard."
  },
  {
    question: "What is the Resume Builder?",
    answer: "Our AI-powered Resume Builder helps you create professional resumes in minutes. Choose from multiple templates, fill in your information through our guided wizard, and let AI generate professional summaries and optimize your resume content. Export your resume as PDF when ready."
  },
  {
    question: "How do I get started?",
    answer: "Simply sign up for a free account with Google OAuth, complete your profile with your skills, work experience, and education. Then download our Chrome extension to start saving jobs from LinkedIn, or manually add jobs from your dashboard. You can also use our Resume Builder to create professional resumes."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="w-full py-20 lg:py-32 bg-gradient-to-br from-gray-50 via-blue-50/50 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="relative container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 text-blue-700 font-semibold text-sm shadow-sm animate-fadeInUp">
            <HelpCircle className="w-4 h-4 animate-pulse-slow" />
            Frequently Asked Questions
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight animate-fadeInUp animation-delay-100">
            Questions about{' '}
            <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              JobStalker AI?
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-fadeInUp animation-delay-200">
            Find answers to the most common questions about our platform and features.
          </p>
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`group bg-white rounded-2xl border-2 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.02] animate-fadeInUp ${
                openIndex === index 
                  ? 'border-blue-300 shadow-lg scale-[1.02]' 
                  : 'border-gray-200 hover:border-blue-200'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className={`w-full px-8 py-6 flex items-center justify-between text-left transition-all duration-300 ${
                  openIndex === index 
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100/50' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    openIndex === index
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-600 group-hover:from-blue-200 group-hover:to-blue-300'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className={`text-lg lg:text-xl font-bold pr-8 transition-colors duration-300 ${
                    openIndex === index ? 'text-blue-900' : 'text-gray-900 group-hover:text-blue-600'
                  }`}>
                    {faq.question}
                  </h3>
                </div>
                <ChevronDown
                  className={`w-6 h-6 flex-shrink-0 transition-all duration-300 ${
                    openIndex === index 
                      ? 'transform rotate-180 text-blue-600' 
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-8 pb-6 pt-2">
                  <div className="pl-14 border-l-2 border-blue-200">
                    <p className="text-gray-700 leading-relaxed text-base lg:text-lg">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Help Text */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-lg">
            Still have questions?{' '}
            <a href="mailto:support@jobstalker-ai.com" className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2 transition-colors">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

