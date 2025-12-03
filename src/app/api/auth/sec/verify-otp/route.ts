import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  signAccessToken,
  signRefreshToken,
  AuthTokenPayload,
} from '@/lib/auth';

// POST /api/auth/sec/verify-otp
// Body: { phoneNumber: string; otp: string }
// Verifies the OTP stored in the database for the given phone number and issues auth tokens for SEC.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone: string | undefined = body?.phoneNumber;
    const otp: string | undefined = body?.otp;

    if (!rawPhone || !otp) {
      return NextResponse.json({ error: 'phoneNumber and otp are required' }, { status: 400 });
    }

    const normalized = rawPhone.replace(/\D/g, '').slice(0, 10);

    if (!normalized || normalized.length !== 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const record = await prisma.otp.findFirst({
      where: { phone: normalized },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    const now = new Date();
    if (record.expiresAt < now || record.code !== otp) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    // Mark as verified and/or delete so it cannot be reused.
    await prisma.otp.delete({ where: { id: record.id } });

    // For simple SEC OTP login we do not require a pre-existing SEC profile.
    // The SEC identity is the phone number itself.
    const payload: AuthTokenPayload = {
      secId: normalized,
      role: 'SEC' as any,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const res = NextResponse.json({
      success: true,
      user: {
        role: 'SEC',
        phone: normalized,
      },
    });

    const isSecure = process.env.NODE_ENV === 'production';

    res.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
    });

    res.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Error in POST /api/auth/sec/verify-otp', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
