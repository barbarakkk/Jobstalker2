import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spotlight } from "./Spotlight";
import { useNavigate } from "react-router-dom";

export function AnimatedHero() {
  const navigate = useNavigate();
  
  return (
    <div className="h-[40rem] w-full rounded-md flex md:items-center md:justify-center bg-white dark:bg-black antialiased bg-grid-white/[0.02] relative overflow-hidden">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="rgb(37, 99, 235)"
      />
      <div className="relative z-10 w-full mx-auto px-4 md:px-0">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-blue-600 to-blue-400 bg-opacity-50"
        >
          Say Goodbye to Job Search <br /> Overload
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 font-normal text-base text-blue-600/80 max-w-lg text-center mx-auto"
        >
          Prioritize, automate, and stay ahead—AI simplifies your job search so you can focus on what matters most.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center mt-8"
        >
          <Button
            onClick={() => navigate('/login')}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-6 text-lg rounded-lg"
          >
            Get started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

