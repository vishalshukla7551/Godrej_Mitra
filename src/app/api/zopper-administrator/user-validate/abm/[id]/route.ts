import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// PATCH /api/zopper-administrator/user-validate/abm/[id]
// Update ABM profile (endpoint kept for backward compatibility but returns 404)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUserFromCookies();

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ABM role no longer exists
    return NextResponse.json({ error: 'ABM profile not found' }, { status: 404 });
  } catch (error) {
    console.error('Error in PATCH /api/zopper-administrator/user-validate/abm/[id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
