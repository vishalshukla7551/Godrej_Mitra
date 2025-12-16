import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { Role } from '@prisma/client';

// GET /api/zse/kyc/info
// Get KYC information for the authenticated ZSE user
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== ('ZSE' as Role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the ZSE user
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        zseProfile: true
      }
    });

    if (!user || !user.zseProfile) {
      return NextResponse.json(
        { error: 'ZSE profile not found' },
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
    console.error('Error in GET /api/zse/kyc/info', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}