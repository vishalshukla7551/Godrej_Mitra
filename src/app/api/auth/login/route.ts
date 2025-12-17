import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  signAccessToken,
  signRefreshToken,
  AuthTokenPayload,
} from '@/lib/auth';

// POST /api/auth/login
// Body: { username: string; password: string }
// Sets httpOnly cookies for access & refresh tokens and returns a userInfo object
// that the client can store in localStorage.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body ?? {};

    if (!username || !password) {
      return NextResponse.json(
        { error: 'username and password are required' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        abmProfile: true,
        aseProfile: true,
        zsmProfile: true,
        zseProfile: true,
        samsungAdminProfile: true,
        zopperAdminProfile: true,
      },
    } as any);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify the hashed password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.validation !== 'APPROVED') {
      return NextResponse.json(
        { error: 'User is not approved yet. Please contact administrator.' },
        { status: 403 },
      );
    }

    const anyUser = user as any;
    const { password: _pw, ...rest } = anyUser;

    const rawProfile =
      anyUser.abmProfile ||
      anyUser.aseProfile ||
      anyUser.zsmProfile ||
      anyUser.zseProfile ||
      anyUser.samsungAdminProfile ||
      anyUser.zopperAdminProfile ||
      null;

    // Remove userId from the role-specific profile before sending it to the client
    const { userId: _profileUserId, ...safeProfile } = (rawProfile || {}) as any;

    const payload: AuthTokenPayload = {
      userId: rest.id,
      role: rest.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Expose role and selected role-specific fields (flattened) to the client;
    // do not expose raw User model fields like id, username, metadata, etc.
    const res = NextResponse.json({
      user: {
        role: rest.role,
        ...(rawProfile ? safeProfile : {}),
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
    console.error('Error in POST /api/auth/login', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
