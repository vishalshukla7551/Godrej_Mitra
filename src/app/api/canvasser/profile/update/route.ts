import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * POST /api/canvasser/profile/update
 * Update Canvasser profile information
 * Body: { fullName?: string; employeeId?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'CANVASSER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phone = authUser.id;

    if (!phone) {
      return NextResponse.json(
        { error: 'Missing Canvasser identifier' },
        { status: 400 },
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    const canvasserRecord = await prisma.canvasser.update({
      where: { phone },
      data: updateData,
    });

    // Fetch the updated record with all fields
    const updatedRecord: any = await prisma.canvasser.findUnique({
      where: { phone },
    });

    // Fetch store separately if storeId exists
    let storeDetails = null;
    if (updatedRecord?.storeId) {
      storeDetails = await prisma.store.findUnique({
        where: { id: updatedRecord.storeId },
      });
    }

    if (!updatedRecord) {
      return NextResponse.json(
        { error: 'Canvasser record not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      id: updatedRecord.id,
      phone: updatedRecord.phone,
      fullName: updatedRecord.fullName,
      storeId: updatedRecord.storeId,
      store: storeDetails,
    });
  } catch (error) {
    console.error('Error in POST /api/canvasser/profile/update', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
