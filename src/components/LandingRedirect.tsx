'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface LandingRedirectProps {
  redirectTo: string;
}

export default function LandingRedirect({ redirectTo }: LandingRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(redirectTo);
    }, 2000);

    return () => clearTimeout(timer);
  }, [redirectTo, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <Image 
        src="/Godrej_Enterprises_Group.svg.png" 
        alt="Godrej Enterprises Group" 
        width={400} 
        height={200}
        priority
      />
    </main>
  );
}
