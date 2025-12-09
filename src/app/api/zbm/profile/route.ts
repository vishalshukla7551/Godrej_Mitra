import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { Role } from '@prisma/client';

// GET /api/zbm/profile
// Get ZBM profile and associated information
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== ('ZBM' as Role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        zbmProfile: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            region: true
          }
        }
      }
    });

    if (!user || !user.zbmProfile) {
      return NextResponse.json({ error: 'ZBM profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        zbm: {
          id: user.zbmProfile.id,
          fullName: user.zbmProfile.fullName,
          phone: user.zbmProfile.phone,
          region: user.zbmProfile.region
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/zbm/profile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}