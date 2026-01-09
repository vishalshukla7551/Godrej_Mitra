import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * POST /api/sec/profile/update
 * Update SEC profile information (AgencyName, AgentCode)
 * Body: { agencyName?: string; agentCode?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'SEC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phone = authUser.username;

    if (!phone) {
      return NextResponse.json(
        { error: 'Missing SEC identifier' },
        { status: 400 },
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    const secRecord = await prisma.sEC.update({
      where: { phone },
      data: updateData,
    });

    // Fetch the updated record with all fields
    const updatedRecord: any = await prisma.sEC.findUnique({
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
        { error: 'SEC record not found' },
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
    console.error('Error in POST /api/sec/profile/update', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
