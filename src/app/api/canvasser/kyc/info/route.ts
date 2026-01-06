import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/sec/kyc/info
// Retrieves KYC information for the authenticated SEC user
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'SEC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phone = authUser.username;

    if (!phone) {
      return NextResponse.json(
        { error: 'Missing SEC identifier' },
        { status: 400 }
      );
    }

    // Fetch SEC record with KYC info using raw MongoDB query
    const secRecords = await (prisma as any).$runCommandRaw({
      find: "SEC",
      filter: { phone: phone },
      projection: {
        _id: 1,
        phone: 1,
        fullName: 1,
        kycInfo: 1
      },
      limit: 1
    });

    const secRecord = secRecords.cursor?.firstBatch?.[0] || null;

    if (!secRecord) {
      return NextResponse.json(
        { error: 'SEC record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hasKycInfo: !!secRecord?.kycInfo,
      kycInfo: secRecord?.kycInfo,
      secUser: {
        id: secRecord?._id,
        phone: secRecord?.phone,
        fullName: secRecord?.fullName,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/sec/kyc/info', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}