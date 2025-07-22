import { Button } from "@/components/ui/button";

export default function CallToAction() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-500 py-16 px-4 text-white text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Ready to accelerate your job search?</h2>
        <p className="mb-8 text-lg">
          Join thousands of professionals who have streamlined their job search with JobStalker
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4">
          <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-100">
            Start Free Trial
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700">
            Schedule Demo
          </Button>
        </div>
        <div className="text-blue-100 text-sm">
          14-day free trial · No credit card required · Cancel anytime
        </div>
      </div>
    </section>
  );
}
