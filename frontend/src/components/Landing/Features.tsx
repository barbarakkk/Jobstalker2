import { Card, CardContent } from '@/components/ui/card';
import { FileText, Search, Check, User, Sparkles, FileSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import { HoverEffect } from '@/components/ui/aceternity/CardHoverEffect';
import ATSFriendlyResume from '@/assets/ATSfriendlyresume.png';
import JobDescription from '@/assets/Job description.png';

const featureSections = [
  {
    badge: 'AI Resume Builder',
    badgeIcon: FileText,
    title: 'Create ATS-Friendly Resumes',
    titleHighlight: 'in Minutes',
    description:
      'Our AI-powered resume builder helps you create professional, ATS-friendly resumes that get past applicant tracking systems and into the hands of recruiters.',
    features: [
      'ATS-optimized formatting that passes screening systems',
      'AI-generated professional summaries and bullet points',
      'Multiple professional templates to choose from',
      'Export as PDF ready for job applications',
    ],
    image: ATSFriendlyResume,
    imageAlt: 'ATS-Friendly Resume Example',
    layout: 'image-left', // Image on left, text on right
  },
  {
    badge: 'Job Analysis',
    badgeIcon: FileSearch,
    title: 'Detailed Job Descriptions',
    titleHighlight: 'Made Easy',
    description:
      'Our intelligent job description analyzer breaks down complex job postings into clear, actionable insights. This helps job seekers quickly understand key requirements, responsibilities, and qualifications, making it easier to tailor applications and prepare for interviews.',
    features: [
      'AI-powered job description analysis and breakdown',
      'Key requirements and qualifications extraction',
      'Clear visualization of job responsibilities',
      'Easy-to-understand format for quick review',
    ],
    image: JobDescription,
    imageAlt: 'Job Description Analysis',
    layout: 'image-left', // Image on left, text on right
  },
];

const steps = [
  {
    title: 'Fill out your profile info',
    description: 'Complete your profile with your skills, work experience, and education details to get started.',
    icon: <User className="w-8 h-8 text-blue-800" />,
  },
  {
    title: 'Paste the job descriptions',
    description: 'Provide the job description for the position you want to apply for.',
    icon: <FileText className="w-8 h-8 text-blue-800" />,
  },
  {
    title: 'Create tailored resumes',
    description: 'Generate AI-powered resumes perfectly matched to each job description.',
    icon: <Sparkles className="w-8 h-8 text-blue-800" />,
  },
];

export function Features() {
  return (
    <section id="features" className="w-full py-24 lg:py-40 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-24 max-w-4xl mx-auto"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-blue-900 mb-6 leading-tight">
            Everything You Need to{' '}
            <span className="text-blue-900">
              Land Your Dream Job
            </span>
          </h2>
          <p className="text-xl lg:text-2xl text-blue-800/90 leading-relaxed">
            Powerful features designed specifically for professionals and tech workers
          </p>
        </motion.div>

        {/* Feature Sections - Modern Alternating Layout */}
        <div className="space-y-40 max-w-[1400px] mx-auto">
          {featureSections.map((section, index) => {
            const BadgeIcon = section.badgeIcon;
            const isImageLeft = section.layout === 'image-left';
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-150px" }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className={`grid lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
                  !isImageLeft ? 'lg:grid-flow-dense' : ''
                }`}>
                  {/* Image Section - Takes 7 columns, bigger */}
                  <motion.div
                    initial={{ opacity: 0, x: isImageLeft ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`lg:col-span-7 ${!isImageLeft ? 'lg:col-start-6 lg:col-end-13' : 'lg:col-start-1 lg:col-end-8'}`}
                  >
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-3xl blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                      <Card className="relative overflow-hidden border-2 border-gray-200 shadow-2xl bg-white rounded-2xl">
                        <img 
                          src={section.image} 
                          alt={section.imageAlt} 
                          className="w-full h-auto object-cover"
                        />
                      </Card>
                    </div>
                  </motion.div>

                  {/* Content Section - Takes 5 columns */}
                  <motion.div
                    initial={{ opacity: 0, x: isImageLeft ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className={`lg:col-span-5 space-y-8 ${!isImageLeft ? 'lg:col-start-1 lg:col-end-6' : 'lg:col-start-8 lg:col-end-13'}`}
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-sm font-semibold text-blue-800">
                      <BadgeIcon className="w-4 h-4" />
                      {section.badge}
                    </div>
                    
                    <h3 className="text-4xl lg:text-5xl font-bold text-blue-900 leading-tight">
                      {section.title}{' '}
                      <span className="text-blue-600">
                        {section.titleHighlight}
                      </span>
                    </h3>
                    
                    <p className="text-xl text-blue-800/90 leading-relaxed">
                      {section.description}
                    </p>
                    
                    <div className="space-y-5 pt-4">
                      {section.features.map((feature, featureIndex) => (
                        <motion.div
                          key={featureIndex}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: featureIndex * 0.1 + 0.4 }}
                          className="flex items-start gap-4"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-lg text-blue-800/90 leading-relaxed pt-0.5">{feature}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}

          {/* How It Works Section - Centered Layout */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-150px" }}
            transition={{ duration: 0.8 }}
            className="pt-24"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-20 max-w-4xl mx-auto"
            >
              <h2 className="text-5xl lg:text-6xl font-bold text-blue-900 mb-6 leading-tight">
                How It Works
              </h2>
              <p className="text-xl lg:text-2xl text-blue-800/90 leading-relaxed">
                Create perfectly tailored resumes in three simple steps
              </p>
            </motion.div>

            {/* Steps with Hover Effect */}
            <HoverEffect items={steps} className="max-w-6xl mx-auto" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
