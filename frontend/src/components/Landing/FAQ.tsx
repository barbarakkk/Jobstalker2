import { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

const faqs = [
  {
    question: "Is Jobstalker free to use?",
    answer: "Yes, Jobstalker offers a free plan with core features that will remain free forever. This includes our Job Tracker, Job Posting Saver, and Application Autofiller. We also have premium features like the ATS Resume Builder, which are part of a paid plan. Additionally, we charge companies a fee to post their jobs on our platform."
  },
  {
    question: "How does Jobstalker work?",
    answer: "JobStalker is your personal job-search assistant that helps you land interviews faster. Create your profile to list and assess your skills, get smart insights from our AI-powered analysis, and use our full suite of tools—Job Tracker, Application Autofiller, and Saved Postings—to organize your entire search in one place. By streamlining the process, we help you apply more effectively and get in front of hiring managers sooner. Ready to stop jobstalking and start job landing? Click the Login button to get started."
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
    <section id="faq" className="w-full py-24 lg:py-36 bg-gradient-to-b from-white via-[#4169E1]/10 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-10 w-96 h-96 bg-[#4169E1]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="relative container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20 relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#4169E1]/20 via-[#4169E1]/10 to-[#4169E1]/20 border border-[#4169E1]/30 text-[#4169E1] font-semibold text-sm shadow-sm animate-fadeInUp">
            <HelpCircle className="w-4 h-4 animate-pulse-slow" />
            Frequently Asked Questions
          </div>
          <h2 className="text-4xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight animate-fadeInUp animation-delay-100">
            Questions about{' '}
            <span className="bg-gradient-to-r from-[#4169E1] via-[#3A5BCE] to-[#2E4AB8] bg-clip-text text-transparent">
              JobStalker AI?
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium animate-fadeInUp animation-delay-200">
            Find answers to the most common questions about our platform and features.
          </p>
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`group bg-white/90 backdrop-blur-sm rounded-2xl border-2 transition-all duration-500 overflow-hidden shadow-md hover:shadow-xl hover:scale-[1.01] animate-fadeInUp ${
                openIndex === index 
                  ? 'border-[#4169E1]/50 shadow-xl scale-[1.01]' 
                  : 'border-gray-200/60 hover:border-[#4169E1]/40'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className={`w-full px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 flex items-center justify-between text-left transition-all duration-300 gap-3 min-h-[3.5rem] sm:min-h-0 ${
                  openIndex === index 
                    ? 'bg-gradient-to-r from-[#4169E1]/10 to-[#4169E1]/20' 
                    : 'hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    openIndex === index
                      ? 'bg-gradient-to-r from-[#4169E1] to-[#3A5BCE] text-white shadow-lg'
                      : 'bg-gradient-to-r from-[#4169E1]/20 to-[#4169E1]/30 text-[#4169E1] group-hover:from-[#4169E1]/30 group-hover:to-[#4169E1]/40'
                  }`}>
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h3 className={`text-base sm:text-lg lg:text-xl font-bold pr-6 sm:pr-8 transition-colors duration-300 leading-snug ${
                    openIndex === index ? 'text-[#4169E1]' : 'text-gray-900 group-hover:text-[#4169E1]'
                  }`}>
                    {faq.question}
                  </h3>
                </div>
                <ChevronDown
                  className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 transition-all duration-300 ${
                    openIndex === index 
                      ? 'transform rotate-180 text-[#4169E1]' 
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openIndex === index ? 'max-h-[70vh] sm:max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-4 pb-4 pt-1 sm:px-6 lg:px-8">
                  <div className="pl-0 sm:pl-6 lg:pl-14 border-l-0 sm:border-l-2 border-[#4169E1]/30">
                    <div className="max-h-[50vh] sm:max-h-none overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y pr-1 -mr-1 faq-answer-scroll">
                      <p className="text-gray-700 leading-relaxed text-[15px] sm:text-base lg:text-lg leading-6 sm:leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
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
            <a href="mailto:support@jobstalker-ai.com" className="text-[#4169E1] hover:text-[#3A5BCE] font-semibold underline underline-offset-2 transition-colors">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

