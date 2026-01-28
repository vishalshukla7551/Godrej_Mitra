import { NextResponse } from 'next/server';
import { AuthenticatedUser } from '@/lib/auth';

/**
 * Check if user is UAT user and restrict access to admin-only routes
 * UAT users can only access spot-incentive-report related endpoints
 * 
 * @param authUser - Authenticated user object
 * @param allowedForUat - Whether this endpoint is allowed for UAT users (default: false)
 * @returns NextResponse with 403 error if access denied, null if allowed
 */
export function checkUatRestriction(
  authUser: AuthenticatedUser | null,
  allowedForUat: boolean = false
): NextResponse | null {
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isUatUser = authUser.metadata?.isUatUser === true;

  if (isUatUser && !allowedForUat) {
    return NextResponse.json(
      { error: 'UAT users cannot access this endpoint' },
      { status: 403 }
    );
  }

  return null;
}
