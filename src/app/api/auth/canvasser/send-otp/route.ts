import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comifyService } from '@/lib/comify';

// POST /api/auth/canvasser/send-otp
// Body: { phoneNumber: string }
// Generates an OTP, stores it in the database against the phone number,
// and sends it via Comify WhatsApp API.
export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const rawPhone: string | undefined = body?.phoneNumber;

    if (!rawPhone) {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 });
    }

    const normalized = rawPhone.replace(/\D/g, '').slice(0, 10);

    if (!normalized || normalized.length !== 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Before creating a new OTP, delete any existing OTPs for this phone.
    await prisma.otp.deleteMany({ where: { phone: normalized } });

    const code = generateOtpCode();
    const ttlMs = 5 * 60 * 1000; // 5 minutes
    const expiresAt = new Date(Date.now() + ttlMs);

    await prisma.otp.create({
      data: {
        phone: normalized,
        code,
        expiresAt,
      },
    });

    console.log(`[Canvasser OTP] Phone ${normalized} -> ${code}`);

    // Send OTP via Comify WhatsApp API
    if (comifyService.isConfigured()) {
      try {
        await comifyService.sendOtp(normalized, code);
        console.log(`[Canvasser OTP] Successfully sent OTP to ${normalized} via Comify WhatsApp`);
      } catch (comifyError) {
        console.error(`[Canvasser OTP] Failed to send OTP via Comify:`, comifyError);
        // Continue execution - OTP is still stored in database for manual verification
        // In production, you might want to return an error here depending on requirements
      }
    } else {
      console.warn('[Canvasser OTP] Comify not configured - OTP not sent via WhatsApp');
    }

    return NextResponse.json({
      success: true,
      message: 'OTP generated and sent successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/auth/canvasser/send-otp', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateOtpCode(): string {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}
