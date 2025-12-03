import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth';

// POST /api/auth/logout
// Clears auth cookies. The client should also clear any localStorage
// (e.g. `authUser`) after calling this.
export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ success: true });

  // Clear cookies by setting them with empty value and maxAge=0
  res.cookies.set(ACCESS_TOKEN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  res.cookies.set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return res;
}
