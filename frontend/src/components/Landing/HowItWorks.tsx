import { User, FileText, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { HoverEffect } from '@/components/ui/aceternity/CardHoverEffect';

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

export function HowItWorks() {
  return (
    <section className="w-full py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-blue-900 mb-4 leading-tight">
            How It Works
          </h2>
          <p className="text-xl text-blue-800/90 leading-relaxed">
            Create perfectly tailored resumes in three simple steps
          </p>
        </motion.div>

        {/* Steps with Hover Effect */}
        <HoverEffect items={steps} className="max-w-6xl mx-auto" />
      </div>
    </section>
  );
}
