import Header from "@/components/ui/header";
import Hero from "@/components/ui/hero";
import Features from "@/components/ui/features";
import Stats from "@/components/ui/stats";
import CallToAction from "@/components/ui/CallToAction";

function App() {
  return (
    <div className="bg-blue-50 min-h-screen flex flex-col">
      <Header />
      <Hero />
      <Features />
      <Stats />
      <CallToAction />
    </div>
  );
}

export default App;
