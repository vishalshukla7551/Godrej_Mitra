import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { Role, Validation } from '@prisma/client';
import { cookies as nextCookies } from 'next/headers';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

// ✅ Project identifier - prevents token reuse across projects
const PROJECT_ID = process.env.PROJECT_ID || 'godrej-mitra';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
  // In Next.js route handlers this will only log on the server side
  console.warn(
    '[auth] ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be set in environment variables.',
  );
}

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || ''
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || ''

export interface AuthTokenPayload {
  userId?: string;
  canvasserId?: string;
  role: Role;
  projectId?: string; // ✅ Project identifier for multi-project security
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: Role;
  validation: Validation;
  metadata: any;
  profile: any | null;
}

export function signAccessToken(payload: AuthTokenPayload) {
  // ✅ Add projectId to payload
  const payloadWithProject = {
    ...payload,
    projectId: payload.projectId || PROJECT_ID,
  };
  return jwt.sign(payloadWithProject, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
}

export function signRefreshToken(payload: AuthTokenPayload) {
  // ✅ Add projectId to payload
  const payloadWithProject = {
    ...payload,
    projectId: payload.projectId || PROJECT_ID,
  };
  return jwt.sign(payloadWithProject, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL_SECONDS });
}

export function verifyAccessToken(token: string): AuthTokenPayload | null {
  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as AuthTokenPayload;
    // ✅ Verify projectId matches - MUST be present and correct
    if (!payload.projectId || payload.projectId !== PROJECT_ID) {
      console.warn(`[auth] Token projectId invalid: ${payload.projectId} !== ${PROJECT_ID}`);
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): AuthTokenPayload | null {
  try {
    const payload = jwt.verify(token, REFRESH_SECRET) as AuthTokenPayload;
    // ✅ Verify projectId matches - MUST be present and correct
    if (!payload.projectId || payload.projectId !== PROJECT_ID) {
      console.warn(`[auth] Token projectId invalid: ${payload.projectId} !== ${PROJECT_ID}`);
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

// Utility used inside API routes to resolve the logged-in user.
// Flow:
// 1) Try access token.
// 2) If missing/invalid, try refresh token.
// 3) If refresh is valid, re-issue fresh access & refresh tokens and set cookies.
// 4) Load the user from DB and ensure validation=APPROVED.
// 5) If anything fails, clear auth cookies and return null.
export async function getAuthenticatedUserFromCookies(
  cookiesParam?: CookieReader,
  options?: { mutateCookies?: boolean },
): Promise<AuthenticatedUser | null> {
  const allowCookieMutation = options?.mutateCookies ?? true;
  // Prefer the explicit reader passed from route handlers; otherwise fall back to next/headers.
  // In Next.js 16, `cookies()` is async and returns a Promise, so we must await it
  // before accessing `.get`, `.set`, `.delete`, etc.
  const cookieStore =
    !cookiesParam && typeof nextCookies === 'function'
      ? await nextCookies()
      : undefined;

  const reader: CookieReader = cookiesParam
    ? cookiesParam
    : cookieStore
    ? {
        get: (name: string) => {
          const c = cookieStore.get(name);
          return c ? { value: c.value } : undefined;
        },
      }
    : {
        get: () => undefined,
      };

  const accessToken = reader.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = reader.get(REFRESH_TOKEN_COOKIE)?.value;

  let payload: AuthTokenPayload | null = null;
  let authenticatedViaRefresh = false;

  if (accessToken) {
    payload = verifyAccessToken(accessToken);
  }

  if (!payload && refreshToken) {
    payload = verifyRefreshToken(refreshToken);
    authenticatedViaRefresh = !!payload;
  }

  // No valid tokens at all – clear cookies if we can and bail out
  if (!payload) {
    if (cookieStore && allowCookieMutation) {
      clearAuthCookies(cookieStore);
    }
    return null;
  }

  // Special handling for Canvasser users.
  // For simple OTP-based Canvasser login we treat the Canvasser identity as the phone number
  // carried in `canvasserId` inside the JWT payload, and we do not depend on a
  // dedicated Canvasser collection record.
  if (payload.role === 'CANVASSER') {
    const canvasserId = payload.canvasserId;
    if (!canvasserId) {
      if (cookieStore && allowCookieMutation) {
        clearAuthCookies(cookieStore);
      }
      return null;
    }

    // If we authenticated using the refresh token, rotate Canvasser tokens as well so
    // a missing/expired access token gets recreated from a valid refresh token.
    if (authenticatedViaRefresh && cookieStore && allowCookieMutation) {
      const newPayload: AuthTokenPayload = {
        canvasserId,
        role: 'CANVASSER' as Role,
        // ✅ projectId automatically added by signAccessToken
      };

      // Rotate ONLY the access token. Refresh token keeps its original
      // lifetime from login (fixed maximum session window).
      const newAccessToken = signAccessToken(newPayload);
      const isSecure = process.env.NODE_ENV === 'production';

      cookieStore.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecure,
        path: '/',
        maxAge: ACCESS_TOKEN_TTL_SECONDS,
      });
    }

    // Fetch full Canvasser profile from DB
    const canvasserProfile = await prisma.canvasser.findUnique({
      where: { phone: canvasserId },
      include: { store: true },
    });

    if (!canvasserProfile) {
      if (cookieStore && allowCookieMutation) {
        clearAuthCookies(cookieStore);
      }
      return null;
    }

    const authUser: AuthenticatedUser = {
      id: canvasserProfile.id,
      username: canvasserProfile.phone,
      role: 'CANVASSER' as Role,
      validation: 'APPROVED',
      phone: canvasserProfile.phone,
      fullName: canvasserProfile.fullName,
      employeeId: canvasserProfile.employeeId,
      email: canvasserProfile.email,
      storeId: canvasserProfile.storeId,
      storeName: canvasserProfile.store?.name,
      city: canvasserProfile.city,
      agencyName: canvasserProfile.AgencyName,
      agentCode: canvasserProfile.AgentCode,
      metadata: {},
      profile: null,
    } as any;

    return authUser;
  }

  // Only query User table if userId exists (not for CANVASSER role)
  if (!payload.userId) {
    if (cookieStore && allowCookieMutation) {
      clearAuthCookies(cookieStore);
    }
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      abmProfile: true,
      aseProfile: true,
      zsmProfile: true,
      zseProfile: true,
      samsungAdminProfile: true,
      zopperAdminProfile: true,
    },
  } as any);

  if (!user || user.validation !== 'APPROVED') {
    if (cookieStore && allowCookieMutation) {
      clearAuthCookies(cookieStore);
    }
    return null;
  }

  // If we authenticated using the refresh token, rotate tokens so the client
  // gets a fresh access token (and optionally a new refresh token).
  if (authenticatedViaRefresh && cookieStore && allowCookieMutation) {
    const newPayload: AuthTokenPayload = {
      userId: user.id,
      role: user.role,
      // ✅ projectId automatically added by signAccessToken
    };

    // Rotate ONLY the access token. Refresh token keeps its original
    // lifetime from login (fixed maximum session window).
    const newAccessToken = signAccessToken(newPayload);
    const isSecure = process.env.NODE_ENV === 'production';

    cookieStore.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
    });
  }

  const anyUser = user as any;
  const { password: _pw, ...rest } = anyUser;

  const profile =
    anyUser.abmProfile ||
    anyUser.aseProfile ||
    anyUser.zsmProfile ||
    anyUser.zseProfile ||
    anyUser.samsungAdminProfile ||
    anyUser.zopperAdminProfile ||
    null;

  const authUser: AuthenticatedUser = {
    id: rest.id,
    username: rest.username,
    role: rest.role,
    validation: rest.validation,
    metadata: rest.metadata ?? {},
    profile,
  };

  return authUser;
}

// Clear auth cookies from a NextResponse or cookie store
export function clearAuthCookies(
  cookieStore: any,
  options?: { httpOnly?: boolean; sameSite?: string; secure?: boolean; path?: string }
) {
  const defaultOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };

  const cookieOptions = { ...defaultOptions, ...options };

  // Check if this is a NextResponse cookies object (has .set method) or a cookie store (has .delete method)
  if (cookieStore.set) {
    // NextResponse.cookies
    cookieStore.set(ACCESS_TOKEN_COOKIE, '', {
      ...cookieOptions,
      maxAge: 0,
    });

    cookieStore.set(REFRESH_TOKEN_COOKIE, '', {
      ...cookieOptions,
      maxAge: 0,
    });
  } else if (cookieStore.delete) {
    // Cookie store from next/headers
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
  }
}

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS, PROJECT_ID };
