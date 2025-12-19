'use client';

import { useRequireAuth } from '@/lib/clientAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SECLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useRequireAuth(['SEC']);
  const router = useRouter();
  const pathname = usePathname();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (loading || !user) return;

    // Skip profile check if already on the onboarding page
    if (pathname === '/SEC/onboarding') {
      setCheckingProfile(false);
      return;
    }

    // Check if fullName, store, or employeeId is missing
    const fullName = (user?.fullName || '').trim();
    const storeId = user?.storeId || user?.selectedStoreId;
    const storeName = user?.store?.name;
    const employeeId = user?.employeeId || user?.employId;

    // Redirect to onboarding if fullName, store, or employeeId is missing
    if (!fullName || (!storeId && !storeName) || !employeeId) {
      router.replace('/SEC/onboarding');
      return;
    }

    setCheckingProfile(false);
  }, [loading, user, pathname, router]);

  if (loading || checkingProfile) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
}

