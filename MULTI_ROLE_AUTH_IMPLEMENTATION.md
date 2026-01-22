# Multi-Role Token-Based Authentication Implementation Plan

## Current Status
✅ CANVASSER - Already implemented
❌ ABM, ASE, ZSM, ZSE, SAMSUNG_ADMINISTRATOR, ZOPPER_ADMINISTRATOR - Need implementation

---

## Implementation Strategy

### Step 1: Create Profile/Info Endpoints for Each Role

Each role needs a protected endpoint that:
1. Verifies tokens from cookies
2. Returns user data
3. Returns 401 if tokens invalid

**Endpoints to create:**

```
✅ /api/canvasser/profile (DONE)
❌ /api/user/profile (for ABM, ASE, ZSM, ZSE)
❌ /api/zopper-administrator/profile (for ZOPPER_ADMINISTRATOR)
❌ /api/samsung-administrator/profile (for SAMSUNG_ADMINISTRATOR)
```

---

### Step 2: Update Layouts for Each Role

Each layout needs to pass `verifyEndpoint` to `useRequireAuth()`:

```typescript
// For CANVASSER
const { loading, user } = useRequireAuth(['CANVASSER'], {
  verifyEndpoint: '/api/canvasser/profile',
});

// For ZOPPER_ADMINISTRATOR
const { loading, user } = useRequireAuth(['ZOPPER_ADMINISTRATOR'], {
  verifyEndpoint: '/api/zopper-administrator/profile',
});

// For ABM, ASE, ZSM, ZSE (shared endpoint)
const { loading, user } = useRequireAuth(['ABM'], {
  verifyEndpoint: '/api/user/profile',
});
```

---

## Implementation Details

### For ABM, ASE, ZSM, ZSE Users (Shared Endpoint)

These roles use the main User table, so they can share one endpoint.

**Create: `/api/user/profile/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        username: true,
        role: true,
        validation: true,
        metadata: true,
        abmProfile: true,
        aseProfile: true,
        zsmProfile: true,
        zseProfile: true,
      }
    });

    if (!user || user.validation !== 'APPROVED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        validation: user.validation,
        metadata: user.metadata,
        profile: user.abmProfile || user.aseProfile || user.zsmProfile || user.zseProfile,
      }
    });
  } catch (error) {
    console.error('Error in GET /api/user/profile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### For ZOPPER_ADMINISTRATOR

**Create: `/api/zopper-administrator/profile/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        username: true,
        role: true,
        validation: true,
        zopperAdminProfile: true,
      }
    });

    if (!user || user.validation !== 'APPROVED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        validation: user.validation,
        profile: user.zopperAdminProfile,
      }
    });
  } catch (error) {
    console.error('Error in GET /api/zopper-administrator/profile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### For SAMSUNG_ADMINISTRATOR

**Create: `/api/samsung-administrator/profile/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'SAMSUNG_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        username: true,
        role: true,
        validation: true,
        samsungAdminProfile: true,
      }
    });

    if (!user || user.validation !== 'APPROVED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        validation: user.validation,
        profile: user.samsungAdminProfile,
      }
    });
  } catch (error) {
    console.error('Error in GET /api/samsung-administrator/profile', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### Update Layouts

**For ABM, ASE, ZSM, ZSE (if they have layouts):**

```typescript
const { loading, user } = useRequireAuth(['ABM'], {
  verifyEndpoint: '/api/user/profile',
});
```

**For ZOPPER_ADMINISTRATOR (already has layout):**

```typescript
const { loading, user } = useRequireAuth(['ZOPPER_ADMINISTRATOR'], {
  verifyEndpoint: '/api/zopper-administrator/profile',
});
```

---

## Files to Create/Update

### Create (New Files):
- [ ] `/api/user/profile/route.ts` - For ABM, ASE, ZSM, ZSE
- [ ] `/api/zopper-administrator/profile/route.ts` - For ZOPPER_ADMINISTRATOR
- [ ] `/api/samsung-administrator/profile/route.ts` - For SAMSUNG_ADMINISTRATOR

### Update (Existing Files):
- [ ] `src/app/Zopper-Administrator/layout.tsx` - Add verifyEndpoint
- [ ] Any other role layouts if they exist

---

## Testing Checklist

For each role:
- [ ] Login with valid credentials
- [ ] Navigate to dashboard
- [ ] Verify /api/{role}/profile returns 200
- [ ] Verify user data is displayed
- [ ] Test with expired token (should redirect to login)
- [ ] Test with deleted cookies (should redirect to login)
- [ ] Test with manipulated localStorage (should still redirect to login)

---

## Security Benefits (All Roles)

✅ Tokens verified on server (not localStorage)
✅ User data fetched from server on page load
✅ localStorage used only for UI rendering
✅ User cannot manipulate authentication
✅ Token expiry handled by server
✅ CSRF protection via httpOnly cookies

---

## Summary

**Current:** Only CANVASSER uses token-based auth
**After:** All 7 roles use token-based auth

This ensures consistent, secure authentication across the entire application.
