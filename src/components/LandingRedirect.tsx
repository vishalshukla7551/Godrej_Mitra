'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clientLogout } from '@/lib/clientLogout';
import { VALID_ROLES } from '@/lib/roleHomePath';
import Image from 'next/image';

interface LandingRedirectProps {
  redirectTo: string;
}


export default function LandingRedirect({ redirectTo }: LandingRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    console.log('=== LandingRedirect useEffect started ===');
    console.log('redirectTo:', redirectTo);

    // Check localStorage immediately
    const authUserStr = window.localStorage.getItem('authUser');
    console.log('authUserStr from localStorage:', authUserStr);

    if (authUserStr) {
      try {
        const authUser = JSON.parse(authUserStr);
        console.log('Parsed authUser:', authUser);
        console.log('authUser.role:', authUser.role);
        console.log('Is role valid?', VALID_ROLES.includes(authUser.role));

        if (!authUser.role || !VALID_ROLES.includes(authUser.role)) {
          console.log('INVALID ROLE - calling clientLogout');
          clientLogout('/login/canvasser');
          return;
        }
      } catch (error) {
        console.error('Error parsing authUser:', error);
        clientLogout('/login/canvasser');
        return;
      }
    }

    // Check if redirectTo indicates invalid role
    if (redirectTo === '/invalid-role') {
      console.log('redirectTo is /invalid-role - calling clientLogout');
      clientLogout('/login/canvasser');
      return;
    }

    console.log('All checks passed, redirecting to:', redirectTo);
    const timer = setTimeout(() => {
      console.log('Redirecting via router.push to:', redirectTo);
      router.push(redirectTo);
    }, 2000);

    return () => clearTimeout(timer);
  }, [redirectTo, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <Image
        src="/Godrej_Enterprises_Group.svg"
        alt="Godrej Enterprises Group"
        width={400}
        height={200}
        priority
      />
    </main>
  );
}
