'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface LandingRedirectProps {
  redirectTo: string;
}

export default function LandingRedirect({ redirectTo }: LandingRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(redirectTo);
    }, 5000); // 5 seconds - as requested

    return () => clearTimeout(timer);
  }, [redirectTo, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white flex-col">
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1],
          type: "spring",
          stiffness: 100
        }}
        className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#5E1846]"
      >
        Sales<span className="text-[#3056FF]">mitr</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="mt-8 text-center"
      >
        <div className="flex items-center justify-center text-gray-500 gap-1.5 sm:gap-2">
          <span className="text-sm sm:text-lg md:text-xl">Powered by</span>
          <Image
            src="/zopper-icon.png"
            alt="Zopper icon"
            width={32}
            height={32}
            className="inline-block w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8"
          />
          <span className="text-base sm:text-xl md:text-2xl font-bold text-gray-900">Zopper</span>
        </div>
      </motion.div>
    </main>
  );
}
