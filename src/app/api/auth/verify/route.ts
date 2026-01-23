import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/auth/verify
 * 
 * Verifies the current user's authentication status and returns full user data.
 * 
 * Response:
 * - 200: { authenticated: true, user: { id, username, role, validation, metadata, profile } }
 * - 401: { authenticated: false, error: string }
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUserFromCookies();

    if (!user) {
      return NextResponse.json(
        { authenticated: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error('Error in GET /api/auth/verify', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
