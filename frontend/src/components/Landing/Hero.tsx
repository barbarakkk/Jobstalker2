import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
// Import images
import jobDashboardImg from '@/assets/JobDashboard.png';
import kanbanViewImg from '@/assets/KanbanView.png';

const images = [
  { src: jobDashboardImg, alt: 'Job Dashboard' },
  { src: kanbanViewImg, alt: 'Kanban View' },
];

export function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <section className="relative w-full py-20 lg:py-28 bg-gradient-to-br from-[#4169E1]/10 via-sky-50 to-[#4169E1]/20 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#4169E1]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>
      
      <div className="relative container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div className="space-y-7 relative z-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Your Job{' '}
              <span className="bg-gradient-to-r from-[#4169E1] via-[#3A5BCE] to-[#2E4AB8] bg-clip-text text-transparent">Search Tool</span>
            </h1>
            
            <div className="space-y-5">
              <p className="text-lg lg:text-xl text-slate-700 leading-relaxed font-medium">
                Transform your job search with advanced AI that tracks and organizes every application.
              </p>
              <p className="text-lg lg:text-xl text-slate-600 leading-relaxed">
                Get faster results and tailored analytics—spend 60% less time job hunting. Land interviews and offers seamlessly, with intelligent automation.
              </p>
            </div>
          </div>

          {/* Right: Browser Frame with Image Carousel */}
          <div className="relative z-10">
            {/* Browser Frame */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200/80 shadow-2xl overflow-hidden backdrop-blur-sm">
              {/* Browser Chrome */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3.5 flex items-center gap-3 border-b border-gray-200/80">
                {/* Traffic Light Buttons (macOS style) */}
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex gap-2 ml-2">
                  <button className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                {/* Address Bar */}
                <div className="flex-1 mx-4 bg-white rounded-lg px-4 py-2 border border-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-sm text-gray-500 flex-1">jobstalker.ai/dashboard</span>
                </div>
              </div>

              {/* Image Container */}
              <div className="relative overflow-hidden bg-white">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {images.map((image, index) => (
                    <div key={index} className="min-w-full">
                      <img 
                        src={image.src} 
                        alt={image.alt} 
                        className="w-full h-auto"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Arrows for Carousel */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md rounded-full p-3.5 shadow-lg hover:bg-white hover:shadow-xl hover:scale-110 transition-all duration-300 z-20 border border-gray-200/60 group"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 group-hover:text-[#4169E1] transition-colors" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md rounded-full p-3.5 shadow-lg hover:bg-white hover:shadow-xl hover:scale-110 transition-all duration-300 z-20 border border-gray-200/60 group"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-[#4169E1] transition-colors" />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-4">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`rounded-full transition-all duration-200 ${
                    index === currentIndex 
                      ? 'bg-[#4169E1] w-8 h-2' 
                      : 'bg-slate-300 hover:bg-slate-400 w-2 h-2'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
