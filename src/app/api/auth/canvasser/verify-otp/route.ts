import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  signAccessToken,
  signRefreshToken,
  AuthTokenPayload,
} from '@/lib/auth';

// POST /api/auth/canvasser/verify-otp
// Body: { phoneNumber: string; otp: string }
// Verifies the OTP stored in the database for the given phone number and issues auth tokens for Canvasser.
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

    // Check if OTP code matches FIRST
    if (record.code !== otp) {
      return NextResponse.json({ error: 'Invalid OTP. Please check and try again.' }, { status: 401 });
    }

    // Only check expiration if the OTP code is correct
    const now = new Date();
    const isExpired = record.expiresAt.getTime() < now.getTime();

    if (isExpired) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new OTP.' }, { status: 401 });
    }

    // Mark OTP as verified so we keep a history, but do not delete it here.
    // Existing logic in send-otp will delete old OTPs for this phone
    // when generating a new one.
    await prisma.otp.update({
      where: { id: record.id },
      data: { verified: true },
    });

    // Log this Canvasser login in the Canvasser collection.
    // Either create a document for this phone or update its last login timestamp.
    const canvasserRecord = await prisma.canvasser.upsert({
      where: { phone: normalized },
      update: {
        lastLoginAt: new Date(),
      },
      create: {
        phone: normalized,
        lastLoginAt: new Date(),
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    // Store details are already included in the canvasserRecord
    const storeDetails = canvasserRecord.store;

    const needsName = !canvasserRecord.fullName || canvasserRecord.fullName.trim().length === 0;
    const needsStore = !canvasserRecord.storeId;
    const needsEmployeeId = !canvasserRecord.employeeId || (typeof canvasserRecord.employeeId === 'string' && canvasserRecord.employeeId.trim().length === 0);

    // For simple Canvasser OTP login the runtime identity is still just the phone number.
    // We keep it in the JWT payload without linking to the main User table.
    const payload: AuthTokenPayload = {
      canvasserId: normalized, // Use phone number as canvasserId
      role: 'CANVASSER' as Role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const res = NextResponse.json({
      success: true,
      needsName: needsName || needsStore || needsEmployeeId,
      user: {
        role: 'CANVASSER',
        phone: normalized,
        fullName: canvasserRecord.fullName ?? null,
        storeId: canvasserRecord.storeId ?? null,
        store: storeDetails,
        employeeId: canvasserRecord.employeeId ?? null,
        AgencyName: canvasserRecord.AgencyName ?? null,
        AgentCode: canvasserRecord.AgentCode ?? null,
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
    console.error('Error in POST /api/auth/canvasser/verify-otp', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
