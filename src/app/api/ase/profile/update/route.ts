import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * POST /api/ase/profile/update
 * Update ASE profile information (AgencyName)
 * Body: { agencyName?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const agencyName: string | null | undefined = body?.agencyName;

    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ASE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user identifier' },
        { status: 400 },
      );
    }

    // Check if ASE profile exists
    const existingProfile = await prisma.aSE.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'ASE profile not found' },
        { status: 404 },
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update AgencyName if provided
    if (agencyName !== undefined) {
      updateData.AgencyName = agencyName || null;
    }

    // Update the ASE profile
    const updatedProfile = await prisma.aSE.update({
      where: { userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        phone: true,
        AgencyName: true,
        storeIds: true,
        zseId: true,
      },
    });

    // Get ZSE info
    let zseName = null;
    if (updatedProfile.zseId) {
      const zse = await prisma.zSE.findUnique({
        where: { id: updatedProfile.zseId },
        select: { fullName: true },
      });
      zseName = zse?.fullName || null;
    }

    // Get stores info
    let stores: { id: string; name: string; city: string | null }[] = [];
    if (updatedProfile.storeIds && updatedProfile.storeIds.length > 0) {
      stores = await prisma.store.findMany({
        where: {
          id: {
            in: updatedProfile.storeIds,
          },
        },
        select: {
          id: true,
          name: true,
          city: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProfile.id,
        fullName: updatedProfile.fullName,
        phone: updatedProfile.phone,
        agencyName: updatedProfile.AgencyName,
        zseName: zseName,
        stores: stores,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/ase/profile/update', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
