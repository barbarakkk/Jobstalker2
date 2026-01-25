import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export const TextRevealCard = ({
  text,
  revealText,
  children,
  className,
}: {
  text: string;
  revealText: string;
  children?: React.ReactNode;
  className?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "border border-gray-200 dark:border-white/[0.2] group/canvas-card flex items-center justify-center dark:border-white/[0.2]  max-w-sm w-full mx-auto p-4 relative h-[30rem]",
        className
      )}
    >
      <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-white text-blue-600" />
      <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-white text-blue-600" />
      <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-white text-blue-600" />
      <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-white text-blue-600" />

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full absolute inset-0 dark:bg-black/[0.8] bg-white/[0.8] z-0"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative z-40"
            >
              {revealText}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-20">
        <p className="dark:text-white text-xl font-medium group-hover/canvas-card:text-white dark:group-hover/canvas-card:text-white transition duration-200">
          {text}
        </p>
      </div>
    </div>
  );
};

const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};

