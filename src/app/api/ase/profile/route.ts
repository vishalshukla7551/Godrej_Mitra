import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/ase/profile
// Returns ASE profile for the authenticated ASE user along with mapped stores.
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ASE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const aseProfile = await prisma.aSE.findUnique({
      where: { userId: authUser.id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        storeIds: true,
      },
    });

    if (!aseProfile) {
      return NextResponse.json(
        { error: 'ASE profile not found' },
        { status: 404 },
      );
    }

    let stores: { id: string; name: string; city: string | null; state: string | null }[] = [];

    if (aseProfile.storeIds && aseProfile.storeIds.length > 0) {
      stores = await prisma.store.findMany({
        where: {
          id: {
            in: aseProfile.storeIds,
          },
        },
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ase: {
          id: aseProfile.id,
          fullName: aseProfile.fullName,
          phone: aseProfile.phone,
        },
        stores,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/ase/profile', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
