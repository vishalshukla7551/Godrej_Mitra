import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * POST /api/zse/profile/update
 * Update ZSE profile information (AgencyName, region)
 * Body: { agencyName?: string; region?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const agencyName: string | null | undefined = body?.agencyName;
    const region: string | null | undefined = body?.region;

    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZSE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user identifier' },
        { status: 400 },
      );
    }

    // Check if ZSE profile exists
    const existingProfile = await prisma.zSE.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'ZSE profile not found' },
        { status: 404 },
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update fields if provided
    if (agencyName !== undefined) {
      updateData.AgencyName = agencyName || null;
    }

    if (region !== undefined) {
      updateData.region = region || null;
    }

    // Update the ZSE profile
    const updatedProfile = await prisma.zSE.update({
      where: { userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        phone: true,
        AgencyName: true,
        region: true,
      },
    });

    // Get all ASEs under this ZSE
    const ases = await prisma.aSE.findMany({
      where: { zseId: updatedProfile.id },
      select: {
        id: true,
        fullName: true,
        storeIds: true,
      },
    });

    // Get union of all store IDs from all ASEs
    const allStoreIds = [...new Set(ases.flatMap((ase) => ase.storeIds))];

    // Fetch store details for all unique store IDs
    const stores = await prisma.store.findMany({
      where: {
        id: { in: allStoreIds },
      },
      select: {
        id: true,
        name: true,
        city: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProfile.id,
        fullName: updatedProfile.fullName,
        phone: updatedProfile.phone,
        agencyName: updatedProfile.AgencyName,
        region: updatedProfile.region,
        ases: ases.map((ase) => ({
          id: ase.id,
          fullName: ase.fullName,
          storeCount: ase.storeIds.length,
        })),
        stores: stores,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/zse/profile/update', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
