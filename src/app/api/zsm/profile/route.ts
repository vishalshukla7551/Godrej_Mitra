import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { Role } from '@prisma/client';

// GET /api/zsm/profile
// Get ZSM profile and associated information
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== ('ZSM' as Role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        zsmProfile: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            region: true
          }
        }
      }
    });

    if (!user || !user.zsmProfile) {
      return NextResponse.json({ error: 'ZSM profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        zsm: {
          id: user.zsmProfile.id,
          fullName: user.zsmProfile.fullName,
          phone: user.zsmProfile.phone,
          region: user.zsmProfile.region
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/zsm/profile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
