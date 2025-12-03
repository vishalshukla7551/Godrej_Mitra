'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientLogout } from '@/lib/clientLogout';
import { getHomePathForRole } from '@/lib/roleHomePath';

export type ClientAuthUser = {
  role?: string;
  // allow any extra fields from backend (profile, phone, etc.)
  [key: string]: any;
};

/**
 * Read authUser from localStorage (client only). Returns null if missing or invalid.
 */
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

/**
 * useRequireAuth
 *
 * Frontend guard for protected pages.
 * - If authUser is missing -> redirect to /login/role (via clientLogout, which also clears cookies).
 * - If requiredRoles is provided and role is not allowed -> redirect to that role's home (or login if unknown).
 *
 * Usage:
 *   const { user, loading } = useRequireAuth(['ZOPPER_ADMINISTRATOR']);
 */
export function useRequireAuth(
  requiredRoles?: string[],
  options?: { enabled?: boolean }
) {
  const router = useRouter();
  const [user, setUser] = useState<ClientAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If explicitly disabled (e.g. public routes), skip auth checks
    if (options?.enabled === false) {
      setLoading(false);
      return;
    }

    const authUser = readAuthUserFromStorage();

    if (!authUser || !authUser.role) {
      // No client auth – trigger global logout flow (clears cookies+storage, redirects to login)
      void clientLogout('/login/role');
      return;
    }

    // If specific roles are required, enforce them on the client as well
    if (
      requiredRoles &&
      requiredRoles.length > 0 &&
      !requiredRoles.includes(authUser.role!)
    ) {
      const target = getHomePathForRole(authUser.role!);
      router.replace(target);
      return;
    }

    setUser(authUser);
    setLoading(false);
  }, [router, requiredRoles?.join(','), options?.enabled]);

  return { user, loading } as const;
}
