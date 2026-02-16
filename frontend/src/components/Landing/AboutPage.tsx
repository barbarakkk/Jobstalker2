import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const ABOUT_TITLE = 'About JobStalker – AI Job Search & Resume Builder | jobstalker';
const ABOUT_DESCRIPTION = 'Learn about JobStalker (jobstalker): AI job search platform, job application tracker, and ATS resume builder. Organize your job hunt and land your dream job.';

export function AboutPage() {
  useEffect(() => {
    document.title = ABOUT_TITLE;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', ABOUT_DESCRIPTION);
    return () => {
      document.title = 'JobStalker – AI Job Search & Resume Builder | Track Applications, Land Your Dream Job';
      if (metaDesc) metaDesc.setAttribute('content', 'JobStalker (jobstalker) is the AI-powered job search platform. Track applications, build AI resumes, and get hired faster. Free job tracker with resume builder and career tools.');
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <Header />
      <main className="flex-1 w-full">
        <article className="container mx-auto px-4 lg:px-8 py-16 lg:py-24 max-w-3xl">
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            About JobStalker – AI Job Search & Resume Builder
          </h1>
          <p className="text-lg text-slate-700 leading-relaxed mb-8">
            JobStalker (jobstalker) is an AI-powered job search platform that helps you track applications, build professional resumes, and land your dream job faster. We combine a smart job application tracker with an ATS-friendly resume builder so you can organize your entire search in one place.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              What is JobStalker?
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              JobStalker is your personal job-search assistant. Whether you’re actively job hunting or just exploring opportunities, JobStalker helps you stay on top of every application. Our job tracker lets you save postings from job boards, track status, and never lose a lead. Our AI resume builder creates tailored, ATS-friendly resumes for each role so you can apply with confidence.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Thousands of job seekers use JobStalker to streamline their job search, from first application to final offer. We’re here to help you stop juggling spreadsheets and tabs—and start landing interviews.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              Why use JobStalker for job search?
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Job search can be overwhelming. JobStalker simplifies it with a single workspace: track every job you apply to, analyze job descriptions with AI, and generate resumes that match each posting. Our Chrome extension lets you save jobs from LinkedIn and other sites with one click, so nothing slips through the cracks.
            </p>
            <p className="text-slate-700 leading-relaxed">
              With JobStalker you get a free job application tracker, AI-powered resume builder, application autofiller, and saved postings—all designed to help you apply more effectively and get in front of hiring managers sooner.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              Resume builder and job tracker in one place
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Our resume builder is built for the way you actually apply: one role, one tailored resume. Paste a job description, and JobStalker’s AI helps you highlight the right skills and format for ATS. Export a clean PDF and attach it to your application—then track that application in your JobStalker dashboard.
            </p>
            <p className="text-slate-700 leading-relaxed">
              The job tracker keeps your pipeline visible: saved jobs, applied, interviewing, offered. No more lost spreadsheets or forgotten follow-ups. JobStalker keeps your job search organized so you can focus on preparing for interviews and landing the role.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">
              Get started with JobStalker
            </h2>
            <p className="text-slate-700 leading-relaxed mb-6">
              Sign up with Google in seconds. Create your profile, add your skills and experience, then start saving jobs and building resumes. JobStalker is free to get started—core job tracking and resume tools are available on our free plan. Try JobStalker today and take control of your job search.
            </p>
            <Link to="/login">
              <Button className="bg-blue-700 hover:bg-blue-800 text-white font-semibold">
                Get started with JobStalker
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
