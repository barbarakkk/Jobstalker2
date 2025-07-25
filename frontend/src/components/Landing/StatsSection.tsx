export function StatsSection() {
  return (
    <section className="w-full bg-blue-50 py-14">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-12">
        <div className="flex flex-col items-center">
          <span className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-1">10,000+</span>
          <span className="text-gray-600 text-lg">Professionals helped</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-1">85%</span>
          <span className="text-gray-600 text-lg">Success rate</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-1">30%</span>
          <span className="text-gray-600 text-lg">Faster job placement</span>
        </div>
      </div>
    </section>
  );
} 