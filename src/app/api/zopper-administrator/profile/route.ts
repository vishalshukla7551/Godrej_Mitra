import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/zopper-administrator/profile
// Get ZOPPER_ADMINISTRATOR profile
// ✅ Returns user data for frontend auth verification
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        username: true,
        role: true,
        validation: true,
        metadata: true,
        zopperAdminProfile: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          }
        },
      }
    });

    if (!user || user.validation !== 'APPROVED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Return user data in format expected by frontend auth
    // Note: id not included - not needed in localStorage
    const userData = {
      role: user.role,
      profile: user.zopperAdminProfile,
    };

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error('Error in GET /api/zopper-administrator/profile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
