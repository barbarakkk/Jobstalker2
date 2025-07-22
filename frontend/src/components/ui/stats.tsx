export default function Stats() {
  return (
    <section className="bg-blue-50 py-12">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-center items-center gap-12">
        <StatItem value="10,000+" label="Professionals helped" />
        <StatItem value="85%" label="Success rate" />
        <StatItem value="30%" label="Faster job placement" />
      </div>
    </section>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl font-bold text-blue-700 mb-1">{value}</div>
      <div className="text-gray-700">{label}</div>
    </div>
  );
}
