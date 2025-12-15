'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TestPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to manage tests by default
    router.replace('/Zopper-Administrator/test/manage');
  }, [router]);

  return null;
}
