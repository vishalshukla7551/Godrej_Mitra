import { NextResponse } from 'next/server';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { comifyService } from '@/lib/comify';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/zopper-administrator/spot-incentive-report/send-reward-otp/send
 * Send OTP via Comify WhatsApp for 2FA verification
 */
export async function POST() {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In localhost, skip Comify API and just log OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🔐 OTP VERIFICATION CODE`);
      console.log(`${'='.repeat(50)}`);
      console.log(`Phone: ${adminPhone}`);
      console.log(`OTP: ${otp}`);
      console.log(`Expires in: 5 minutes`);
      console.log(`${'='.repeat(50)}\n`);
    } else {
      // Send OTP via Comify WhatsApp in production
      console.log(`📱 Sending OTP to ${adminPhone}: ${otp}`);
      await comifyService.sendOtp(adminPhone, otp);
      console.log('✅ OTP sent via Comify');
    }

    // Store OTP in database
    await prisma.otp.create({
      data: {
        phone: adminPhone,
        code: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        verified: false,
      },
    });

    // Return success with masked phone
    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone: adminPhone.replace(/(\d)(?=(\d{2})+(?!\d))/g, '*'),
        expiresIn: 300, // 5 minutes in seconds
      },
    });

  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to send OTP',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

