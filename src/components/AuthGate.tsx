"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/lib/clientAuth";

// Public routes that should NOT require auth
const PUBLIC_PATHS = [
  "/", // landing page redirects by server-side auth
  "/login/role",
  "/login/sec",
  "/signup",
  "/terms",
  "/privacy",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p)
  );
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

  // Only enforce auth for non-public routes
  const { loading } = useRequireAuth(requiredRoles, { enabled: !publicRoute });

  if (publicRoute) {
    return <>{children}</>;
  }

  if (loading) {
    // Optionally show a loader instead of null
    return null;
  }

  return <>{children}</>;
}
