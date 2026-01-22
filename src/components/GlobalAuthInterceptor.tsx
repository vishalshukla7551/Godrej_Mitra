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
      let response: Response;
      try {
        response = await originalFetch(...args);
      } catch (error) {
        // Network error or fetch failed - rethrow to let caller handle it
        throw error;
      }

      if (response.status === 401) {
        // Get the request URL to check if it's a login endpoint
        let url = '';
        if (typeof args[0] === 'string') {
          url = args[0];
        } else if (args[0] instanceof Request) {
          url = args[0].url;
        } else if (args[0] && typeof args[0] === 'object' && 'url' in args[0]) {
          url = String(args[0].url);
        }
        
        // Exclude login/authentication endpoints from automatic logout
        // These endpoints are expected to return 401 for invalid credentials
        const isLoginEndpoint = 
          url.includes('/api/auth/login') || 
          url.includes('/api/auth/canvasser/verify-otp') ||
          url.includes('/api/auth/signup');

        // Debug log (remove after testing)
        console.log('401 Response - URL:', url, 'Is Login Endpoint:', isLoginEndpoint);

        if (!isLoginEndpoint) {
          // Tokens missing/expired or user unauthorized – force a clean logout
          // Fire-and-forget; we still return the original response to callers
          void clientLogout('/login/role', true);
        }
      }

      return response;
    };
  }, []);

  return null;
}
