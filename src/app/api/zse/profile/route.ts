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

    // Get all ASEs under this ZSE
    const ases = await prisma.aSE.findMany({
      where: { zseId: user.zseProfile.id },
      select: {
        id: true,
        fullName: true,
        storeIds: true
      }
    });

    // Get union of all store IDs from all ASEs
    const allStoreIds = [...new Set(ases.flatMap(ase => ase.storeIds))];

    // Fetch store details for all unique store IDs
    const stores = await prisma.store.findMany({
      where: {
        id: { in: allStoreIds }
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
        zse: {
          id: user.zseProfile.id,
          fullName: user.zseProfile.fullName,
          phone: user.zseProfile.phone
        },
        ases: ases.map(ase => ({
          id: ase.id,
          fullName: ase.fullName,
          storeCount: ase.storeIds.length
        })),
        stores
      }
    });
  } catch (error) {
    console.error('Error in GET /api/zse/profile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}