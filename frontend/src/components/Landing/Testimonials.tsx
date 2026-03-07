const testimonials = [
  {
    image: '/testimonials/testimonial1.png',
    quote:
      'Hired at Evex clinics all thanks to this tool. So simple. Built my resume fast with zero stress.',
    name: 'Mariam Gharibashvili',
    label: 'Customer',
  },
  {
    image: '/testimonials/testimonial2.png',
    quote: 'Great tool for my job search.',
    name: 'Mariam Chubinidze',
    label: 'Customer',
  },
  {
    image: '/testimonials/testimonial3.png',
    quote: 'Tracked every job I applied to. Never missed a deadline.',
    name: 'Aleko Kurdadze',
    label: 'Customer',
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="w-full py-20 lg:py-28 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-2">
            Our Testimonials
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 uppercase tracking-tight">
            What They&apos;re Saying
          </h2>
        </div>

        {/* Three cards in a row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-6 lg:p-8 flex flex-col"
            >
              <p className="text-gray-600 text-sm lg:text-base leading-relaxed mb-6 flex-1">
                {t.quote}
              </p>
              <div className="flex items-center gap-4">
                <img
                  src={t.image}
                  alt=""
                  className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover flex-shrink-0"
                />
                <div>
                  <p className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    {t.name}
                  </p>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-widest mt-0.5">
                    {t.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
