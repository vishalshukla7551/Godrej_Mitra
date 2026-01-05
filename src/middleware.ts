import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only handle root path
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login/role', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
