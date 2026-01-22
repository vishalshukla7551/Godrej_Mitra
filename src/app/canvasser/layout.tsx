'use client';

import { useRequireAuth } from '@/lib/clientAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CanvasserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auto-detects role from URL and calls correct endpoint
  const { loading, user } = useRequireAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (loading || !user) return;

    if (pathname === '/canvasser/onboarding' || pathname === '/canvasser/profile') {
      setCheckingProfile(false);
      return;
    }

    const fullName = (user?.fullName || '').trim();
    const storeId = user?.storeId || user?.selectedStoreId;
    const storeName = user?.store?.name;
    const employeeId = user?.employeeId || user?.employId;

    if (!fullName || (!storeId && !storeName) || !employeeId) {
      router.replace('/canvasser/onboarding');
      return;
    }

    setCheckingProfile(false);
  }, [loading, user, pathname, router]);

  if (loading || checkingProfile) {
    return null;
  }

  return <>{children}</>;
}

