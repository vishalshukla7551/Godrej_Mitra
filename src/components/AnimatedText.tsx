'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AnimatedText() {
  const text = 'SalesDost';
  const totalChars = text.length;
  const moveDuration = 3.5; // Time for each character to move across screen
  const triggerDuration = 1.5; // Time spread for all characters to start moving
  const [screenWidth, setScreenWidth] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setScreenWidth(window.innerWidth);
    
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Navigate as soon as S starts moving off screen (very early to avoid blank screen)
    // S delay = 0.3s + 1.5s = 1.8s, then moves for 3.5s
    // Navigate 2.5s before S fully disappears (right when it starts moving)
    const initialDelay = 0.3;
    const sCharDelay = initialDelay + triggerDuration; // S starts last
    const sCharCompleteTime = sCharDelay + moveDuration - 2.5; // Navigate much earlier
    
    const navigationTimer = setTimeout(() => {
      router.push('/login/sec');
    }, sCharCompleteTime * 1000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(navigationTimer);
    };
  }, [router, moveDuration, triggerDuration]);

  return (
    <div className="flex items-center justify-center px-4 sm:px-6 md:px-8">
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white text-center">
        {text.split('').map((char, index) => {
          // Last character starts first (index 8), first character starts last (index 0)
          const reverseIndex = totalChars - 1 - index;
          const delay = 0.3 + (reverseIndex * triggerDuration / totalChars);
          
          return (
            <motion.span
              key={`${char}-${index}`}
              className="inline-block"
              initial={{ x: 0 }}
              animate={{ x: screenWidth }}
              transition={{
                type: "spring",
                stiffness: 30,
                damping: 20,
                mass: 1,
                delay: delay,
              }}
            >
              {char}
            </motion.span>
          );
        })}
      </h1>
    </div>
  );
}
