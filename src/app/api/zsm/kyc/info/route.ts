import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { Role } from '@prisma/client';

// GET /api/zsm/kyc/info
// Get KYC information for the authenticated ZSM user
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== ('ZSM' as Role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the ZSM user
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        zsmProfile: true
      }
    });

    if (!user || !user.zsmProfile) {
      return NextResponse.json(
        { error: 'ZSM profile not found' },
        { status: 404 }
      );
    }

    const metadata = user.metadata as any;
    const hasKycInfo = !!(metadata?.kycInfo);
    const panVerified = !!(metadata?.panVerified);

    return NextResponse.json({
      success: true,
      hasKycInfo,
      panVerified,
      kycInfo: hasKycInfo ? metadata.kycInfo : null,
      panVerifiedAt: metadata?.panVerifiedAt || null
    });
  } catch (error) {
    console.error('Error in GET /api/zsm/kyc/info', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}