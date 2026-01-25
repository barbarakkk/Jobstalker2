import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import jobDashboardImg from '@/assets/JobDashboard.png';

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
      {/* Soft background shapes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-16 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute top-40 right-0 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] items-center">
          {/* Left: Copy & primary CTA */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="space-y-4 max-w-xl"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-[3.1rem] font-semibold tracking-tight text-slate-900 leading-tight">
                Organize your job search in one smart workspace
              </h1>
              <p className="text-lg sm:text-xl text-slate-700 max-w-xl">
                Track roles, tailor your resume to each posting, and stay on top of every
                application—without spreadsheets and tab overload.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Button
                  onClick={() => navigate('/login')}
                  size="lg"
                  className="h-12 rounded-full bg-blue-700 px-6 text-base font-semibold text-white shadow-md hover:bg-blue-800 hover:shadow-lg w-full sm:w-auto"
                >
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>

            {/* Spacer to balance layout on larger screens */}
            <div className="hidden lg:block h-4" />
          </div>

          {/* Right: Product preview card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="relative"
          >
            <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-blue-200/50 via-transparent to-indigo-200/60 blur-2xl" />

            <Card className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-2xl backdrop-blur">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="ml-2 flex-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
                  jobstalker.ai/dashboard
                </div>
              </div>

              <div className="relative bg-white">
                <img
                  src={jobDashboardImg}
                  alt="JobStalker AI job search workspace"
                  className="h-auto w-full"
                />
              </div>
            </Card>

            {/* Floating insight chip */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="absolute -bottom-4 left-6 rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-lg"
            >
              <p className="text-xs font-medium text-slate-900">
                “I finally know which applications to focus on each week.”
              </p>
              <p className="mt-1 text-[11px] text-slate-500">— JobStalker early user</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
