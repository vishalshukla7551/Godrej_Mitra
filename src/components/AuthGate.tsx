"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/lib/clientAuth";

// Public routes that should NOT require auth
const PUBLIC_PATHS = [
  "/", // landing page redirects by server-side auth
  "/login/role",
  "/login/canvasser",
  "/signup",
  "/terms",
  "/privacy",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p)
  );
}

// Extract role from URL path
function getRoleFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) return null;
  
  const firstSegment = segments[0].toLowerCase();
  
  // Map URL segments to roles
  const roleMap: { [key: string]: string } = {
    'canvasser': 'CANVASSER',
    'zopper-administrator': 'ZOPPER_ADMINISTRATOR',
  };
  
  return roleMap[firstSegment] || null;
}

// Map routes to their verify endpoints
function getVerifyEndpointForPath(pathname: string): string | undefined {
  if (pathname.startsWith('/canvasser')) {
    return '/api/canvasser/profile';
  }
  if (pathname.startsWith('/Zopper-Administrator')) {
    return '/api/zopper-administrator/profile';
  }
  return undefined;
}

export function AuthGate({
  children,
  requiredRoles,
}: {
  children: ReactNode;
  requiredRoles?: string[];
}) {
  const pathname = usePathname();
  const publicRoute = isPublicPath(pathname);

  // Auto-detect role from URL if not provided
  const roleFromUrl = getRoleFromPath(pathname);
  const finalRequiredRoles = requiredRoles || (roleFromUrl ? [roleFromUrl] : undefined);

  // Get verify endpoint based on current route
  const verifyEndpoint = getVerifyEndpointForPath(pathname);

  // Only enforce auth for non-public routes
  const { loading } = useRequireAuth(finalRequiredRoles, { 
    enabled: !publicRoute,
    verifyEndpoint,
  });

  if (publicRoute) {
    return <>{children}</>;
  }

  if (loading) {
    // Show loading indicator
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-4xl font-bold text-[#5E1846] mb-4">
            Sales<span className="text-[#3056FF]">mitr</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5E1846] mx-auto"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
