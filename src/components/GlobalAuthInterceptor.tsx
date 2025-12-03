'use client';

import { useEffect } from 'react';
import { clientLogout } from '@/lib/clientLogout';

let isPatched = false;

// Mounted once near the root (in RootLayout) to watch for 401 responses
// from client-side fetch calls and trigger a global logout.
export function GlobalAuthInterceptor() {
  useEffect(() => {
    if (typeof window === 'undefined' || isPatched) return;
    isPatched = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401) {
        // Tokens missing/expired or user unauthorized – force a clean logout
        // Fire-and-forget; we still return the original response to callers
        void clientLogout();
      }

      return response;
    };
  }, []);

  return null;
}
