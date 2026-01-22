'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clientLogout } from '@/lib/clientLogout';
import { getHomePathForRole, VALID_ROLES } from '@/lib/roleHomePath';

export type ClientAuthUser = {
  role?: string;
  [key: string]: any;
};

export function readAuthUserFromStorage(): ClientAuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem('authUser');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ClientAuthUser;
    return parsed ?? null;
  } catch {
    return null;
  }
}

// Extract role from URL path
function getRoleFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) return null;
  
  const firstSegment = segments[0].toLowerCase();
  
  const roleMap: { [key: string]: string } = {
    'canvasser': 'CANVASSER',
    'zopper-administrator': 'ZOPPER_ADMINISTRATOR',
  };
  
  return roleMap[firstSegment] || null;
}

// Auto-detect verify endpoint from role
function getVerifyEndpointForRole(role: string): string {
  const endpointMap: { [key: string]: string } = {
    'CANVASSER': '/api/canvasser/profile',
    'ZOPPER_ADMINISTRATOR': '/api/zopper-administrator/profile',
  };
  
  return endpointMap[role] || '/api/canvasser/profile';
}

export function useRequireAuth(
  requiredRoles?: string[],
  options?: { enabled?: boolean; verifyEndpoint?: string }
) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ClientAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (options?.enabled === false) {
      setLoading(false);
      return;
    }

    const authUser = readAuthUserFromStorage();

    // Auto-detect role from URL if not provided
    const roleFromUrl = getRoleFromPath(pathname);
    const finalRequiredRoles = requiredRoles || (roleFromUrl ? [roleFromUrl] : undefined);

    // Auto-detect verify endpoint
    let verifyEndpoint = options?.verifyEndpoint;
    if (!verifyEndpoint && roleFromUrl) {
      verifyEndpoint = getVerifyEndpointForRole(roleFromUrl);
    }
    if (!verifyEndpoint) {
      verifyEndpoint = '/api/canvasser/profile';
    }

    verifyTokensWithServer();

    async function verifyTokensWithServer() {
      try {
        const res = await fetch(verifyEndpoint!, {
          method: 'GET',
          credentials: 'include',
        });

        if (res.status === 401) {
          console.log('Tokens invalid - logging out');
          void clientLogout(undefined, true);
          return;
        }

        if (!res.ok) {
          console.error('Auth verification failed:', res.status);
          void clientLogout(undefined, true);
          return;
        }

        const data = await res.json();
        const freshUser = data.user || data;

        if (freshUser) {
          localStorage.setItem('authUser', JSON.stringify(freshUser));
        }

        // Check role if required
        if (finalRequiredRoles && finalRequiredRoles.length > 0) {
          if (!freshUser.role || !finalRequiredRoles.includes(freshUser.role)) {
            const userRole = freshUser.role || roleFromUrl || 'CANVASSER';
            const target = getHomePathForRole(userRole);
            if (target.startsWith('/login/')) {
              void clientLogout(undefined, true);
            } else {
              router.replace(target);
            }
            return;
          }
        }

        setUser(freshUser);
        setLoading(false);
      } catch (error) {
        console.error('Auth verification error:', error);
        void clientLogout(undefined, true);
      }
    }
  }, [router, pathname, requiredRoles?.join(','), options?.enabled, options?.verifyEndpoint]);

  return { user, loading } as const;
}
