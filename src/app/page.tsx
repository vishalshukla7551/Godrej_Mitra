'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated from localStorage
    if (typeof window !== 'undefined') {
      const authUser = localStorage.getItem('authUser');
      
      if (authUser) {
        try {
          const user = JSON.parse(authUser);
          // Redirect based on role
          if (user.role === 'SEC') {
            router.push('/SEC/home');
          } else if (user.role === 'ZOPPER_ADMINISTRATOR') {
            router.push('/Zopper-Administrator');
          } else if (user.role === 'SAMSUNG_ADMINISTRATOR') {
            router.push('/Samsung-Administrator');
          } else {
            router.push('/login/role');
          }
        } catch {
          // If parse fails, redirect to login
          setTimeout(() => router.push('/login/role'), 2000);
        }
      } else {
        // Not authenticated, redirect to login after 2 seconds
        setTimeout(() => router.push('/login/role'), 2000);
      }
    }
  }, [router]);

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
