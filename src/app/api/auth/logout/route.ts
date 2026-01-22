import { NextRequest, NextResponse } from 'next/server';
import {
  clearAuthCookies,
} from '@/lib/auth';

// POST /api/auth/logout
// Clears auth cookies. The client should also clear any localStorage
// (e.g. `authUser`) after calling this.
export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ success: true });

  // Clear cookies using the centralized function
  clearAuthCookies(res.cookies);

  return res;
}
