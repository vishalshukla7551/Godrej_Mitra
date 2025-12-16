import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/zse/profile
// Get ZSE profile and associated stores
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZSE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        zseProfile: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            region: true
          }
        }
      }
    });

    if (!user || !user.zseProfile) {
      return NextResponse.json({ error: 'ZSE profile not found' }, { status: 404 });
    }

    // Get stores associated with this ZSE (no state filter available in schema)
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        city: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        zse: {
          id: user.zseProfile.id,
          fullName: user.zseProfile.fullName,
          phone: user.zseProfile.phone
        },
        stores
      }
    });
  } catch (error) {
    console.error('Error in GET /api/zse/profile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}