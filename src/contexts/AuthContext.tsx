'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clientLogout } from '@/lib/clientLogout';
import { getHomePathForRole } from '@/lib/roleHomePath';

export type AuthUser = {
  id: string;
  username: string;
  role?: string;
  validation?: string;
  profile?: any;
  metadata?: any;
  [key: string]: any;
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  showAccessDenied?: boolean;
  accessDeniedError?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that should NOT require auth
const PUBLIC_PATHS = [
  '/',
  '/login/role',
  '/login/canvasser',
  '/signup',
  '/terms',
  '/privacy',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) =>
    p === '/' ? pathname === '/' : pathname.startsWith(p)
  );
}

// Extract role from URL path
function getRoleFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) return null;

  const firstSegment = segments[0].toLowerCase();

  const roleMap: { [key: string]: string } = {
    canvasser: 'CANVASSER',
    'zopper-administrator': 'ZOPPER_ADMINISTRATOR',
  };

  return roleMap[firstSegment] || null;
}





interface AuthProviderProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export function AuthProvider({ children, requiredRoles }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [accessDeniedError, setAccessDeniedError] = useState('');
  const [accessDeniedCountdown, setAccessDeniedCountdown] = useState(2);

  useEffect(() => {
    if (showAccessDenied) {
      const interval = setInterval(() => {
        setAccessDeniedCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowAccessDenied(false); // Hide modal after countdown
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showAccessDenied]);

  useEffect(() => {
    // Special handling for login pages - check if user is already logged in
    if (pathname.startsWith('/login')) {
      (async () => {
        try {
          const res = await fetch('/api/auth/verify', {
            method: 'GET',
            credentials: 'include',
          });

          if (res.ok) {
            const data = await res.json();
            const freshUser = data.user;
            
            if (freshUser) {
              setUser(freshUser);
              setIsAuthenticated(true);
              localStorage.setItem('authUser', JSON.stringify(freshUser));
              
              // Redirect to home if already logged in
              const target = getHomePathForRole(freshUser.role || 'CANVASSER');
              router.replace(target);
            }
          }
          // ❌ If verification fails, user stays null (DON'T logout)
        } catch (error) {
          console.log('[auth] Login page - no valid session');
        }
        setLoading(false);
      })();
      return;
    }

    // Other public paths - skip verification
    if (isPublicPath(pathname)) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    // Protected routes - verify auth
    verifyAuth();

    async function verifyAuth() {
      try {
        // Auto-detect role from URL if not provided
        const roleFromUrl = getRoleFromPath(pathname);
        const finalRequiredRoles = requiredRoles || (roleFromUrl ? [roleFromUrl] : undefined);
        // Use unified verify endpoint
        const res = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
          console.error('Auth verification failed:', res.status);
         // Check if user had a previous session by looking at localStorage
           const hasSession = typeof window !== 'undefined' && localStorage.getItem('authUser') !== null;
        console.log("hasCookies",hasSession)
          await clientLogout(undefined, hasSession);
          setLoading(false);
          return;
        }

        const data = await res.json();
        const freshUser = data.user;

        if (freshUser) {
          localStorage.setItem('authUser', JSON.stringify(freshUser));
          setUser(freshUser);
          setIsAuthenticated(true);

          // Check role if required
          if (finalRequiredRoles && finalRequiredRoles.length > 0) {
            if (!freshUser.role || !finalRequiredRoles.includes(freshUser.role)) {
              const userRole = freshUser.role || roleFromUrl || 'CANVASSER';
              const target = getHomePathForRole(userRole);
              
              // Show access denied modal ONLY for role mismatch
              setAccessDeniedError(`Your role (${userRole}) cannot access this page.`);
              setShowAccessDenied(true);
              setAccessDeniedCountdown(2);
              
              // Keep loading true to prevent children from rendering
              // Redirect after 2 seconds
              setTimeout(() => {
                if (target.startsWith('/login/')) {
                  clientLogout(undefined, true);
                } else {
                  router.replace(target);
                }
              }, 2000);
              
              return; // Don't set loading to false - keep modal visible
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Auth verification error:', error);
        await clientLogout(undefined, true);
        setLoading(false);
      }
    }
  }, [pathname, router, requiredRoles?.join(',')]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, showAccessDenied, accessDeniedError }}>
      {showAccessDenied ? (
        // Show black screen with modal when access denied
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md text-center">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-700 mb-4">{accessDeniedError}</p>
            <p className="text-sm text-gray-500">Redirecting in {accessDeniedCountdown} seconds...</p>
          </div>
        </div>
      ) : loading && !isPublicPath(pathname) ? (
        // Show loading spinner
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="text-center">
            <div className="text-4xl font-bold text-[#5E1846] mb-4">
              Sales<span className="text-[#3056FF]">mitr</span>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5E1846] mx-auto"></div>
          </div>
        </div>
      ) : (
        // Show content
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
