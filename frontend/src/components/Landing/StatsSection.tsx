import { TrendingUp, Award, Zap, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

const stats = [
  {
    value: '80%',
    label: 'Easier Job Search',
    description: 'Users report the process is significantly easier and less stressful',
    icon: Zap,
  },
  {
    value: '30%',
    label: 'Faster Placements',
    description: 'Job placements happen 30% faster with our platform',
    icon: Award,
  },
  {
    value: '1k+',
    label: 'Active Users',
    description: 'Join thousands of professionals landing their dream jobs',
    icon: Users,
  },
  {
    value: '95%',
    label: 'Success Rate',
    description: 'High success rate in landing interviews with tailored resumes',
    icon: TrendingUp,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function StatsSection() {
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
            Trusted by Professionals
          </h2>
          <p className="text-xl text-blue-800/90 leading-relaxed">
            See why thousands of job seekers choose JobStalker AI
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="border border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg bg-white">
                  <CardContent className="p-8">
                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-6"
                    >
                      <Icon className="w-6 h-6 text-blue-800" />
                    </motion.div>
                    
                    {/* Value */}
                    <div className="text-4xl lg:text-5xl font-bold text-blue-900 mb-2">
                      {stat.value}
                    </div>
                    
                    {/* Label */}
                    <div className="text-lg font-semibold text-blue-800 mb-2">
                      {stat.label}
                    </div>
                    
                    {/* Description */}
                    <div className="text-sm text-blue-800/80 leading-relaxed">
                      {stat.description}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
