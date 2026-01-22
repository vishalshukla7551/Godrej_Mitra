import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/canvasser/kyc/info
// Retrieves KYC information for the authenticated canvasser user
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'CANVASSER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phone = authUser.username;

    if (!phone) {
      return NextResponse.json(
        { error: 'Missing canvasser identifier' },
        { status: 400 }
      );
    }

    // Fetch Canvasser record with KYC info
    const canvasserRecord = await prisma.canvasser.findUnique({
      where: { phone: phone },
      select: {
        id: true,
        phone: true,
        fullName: true,
        kycInfo: true
      }
    });

    if (!canvasserRecord) {
      return NextResponse.json(
        { error: 'Canvasser record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hasKycInfo: !!canvasserRecord?.kycInfo,
      kycInfo: canvasserRecord?.kycInfo,
      canvasserUser: {
        id: canvasserRecord?.id,
        phone: canvasserRecord?.phone,
        fullName: canvasserRecord?.fullName,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/canvasser/kyc/info', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}