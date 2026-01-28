import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { checkUatRestriction } from '@/lib/uatRestriction';

// GET /api/zopper-administrator/user-validate/users?status=PENDING|APPROVED|BLOCKED
// Lists users for validation (currently no users to validate as only CANVASSER and ZOPPER_ADMINISTRATOR exist)
export async function GET(req: Request) {
  try {
    const authUser = await getAuthenticatedUserFromCookies();

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Restrict UAT users from user validation
    const uatRestriction = checkUatRestriction(authUser, false);
    if (uatRestriction) {
      return uatRestriction;
    }

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || 'PENDING').toUpperCase();

    if (!['PENDING', 'APPROVED', 'BLOCKED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Use PENDING, APPROVED, or BLOCKED.' },
        { status: 400 },
      );
    }

    // No users to validate - only CANVASSER and ZOPPER_ADMINISTRATOR roles exist
    return NextResponse.json({ users: [] });
  } catch (error) {
    console.error('Error in GET /api/zopper-administrator/user-validate/users', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

