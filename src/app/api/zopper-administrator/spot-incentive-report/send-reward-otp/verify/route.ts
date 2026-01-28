import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/zopper-administrator/spot-incentive-report/send-reward-otp/verify
 * Verify OTP for 2FA
 * 
 * Request body:
 * {
 *   otp: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { otp } = body;

    if (!otp) {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      );
    }

    // Get admin phone from ZopperAdmin profile
    const zopperAdmin = await prisma.zopperAdmin.findUnique({
      where: { userId: authUser.id },
    });

    const adminPhone = zopperAdmin?.phone;
    
    if (!adminPhone) {
      return NextResponse.json(
        { error: 'Admin phone number not configured' },
        { status: 500 }
      );
    }

    // Find latest OTP for this phone
    const otpRecord = await prisma.otp.findFirst({
      where: {
        phone: adminPhone,
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'OTP not found. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check if OTP expired
    if (new Date() > otpRecord.expiresAt) {
      await prisma.otp.delete({ where: { id: otpRecord.id } });
      return NextResponse.json(
        { error: 'OTP expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (otpRecord.code !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    console.log(`✅ OTP verified for phone ${adminPhone}`);

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        verified: true,
      },
    });

  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
