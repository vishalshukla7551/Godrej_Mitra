import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/abm/profile
// Get ABM profile and associated stores
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ABM') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        abmProfile: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            storeIds: true,
            zsmId: true
          }
        }
      }
    });

    if (!user || !user.abmProfile) {
      return NextResponse.json({ error: 'ABM profile not found' }, { status: 404 });
    }

    // Get ZSM info for region
    let region = null;
    if (user.abmProfile.zsmId) {
      const zsm = await prisma.zSM.findUnique({
        where: { id: user.abmProfile.zsmId },
        select: { region: true }
      });
      region = zsm?.region || null;
    }

    // Get stores associated with this ABM
    const stores = await prisma.store.findMany({
      where: {
        id: {
          in: user.abmProfile.storeIds || []
        }
      },
      select: {
        id: true,
        name: true,
        city: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        abm: {
          id: user.abmProfile.id,
          fullName: user.abmProfile.fullName,
          phone: user.abmProfile.phone,
          region: region
        },
        stores
      }
    });
  } catch (error) {
    console.error('Error in GET /api/abm/profile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}