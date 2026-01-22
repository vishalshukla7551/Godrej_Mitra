# Project ID Security - Token Isolation Across Projects

## Problem Solved

**Before:**
```
Project A (godrej-mitra):
  Token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  
Project B (other-project):
  Same token could be used! ❌ SECURITY RISK
```

**After:**
```
Project A (godrej-mitra):
  Token = {userId, role, projectId: 'godrej-mitra', ...}
  
Project B (other-project):
  Token = {userId, role, projectId: 'other-project', ...}
  
Token from Project A ❌ REJECTED in Project B
Token from Project B ❌ REJECTED in Project A
✅ SECURE!
```

---

## Implementation Details

### 1. Token Payload Structure

**Before:**
```typescript
interface AuthTokenPayload {
  userId?: string;
  canvasserId?: string;
  role: Role;
}
```

**After:**
```typescript
interface AuthTokenPayload {
  userId?: string;
  canvasserId?: string;
  role: Role;
  projectId?: string;  // ✅ NEW - Project identifier
}
```

---

### 2. Token Signing

**Before:**
```typescript
const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: 900 });
// Token doesn't know which project it belongs to
```

**After:**
```typescript
export function signAccessToken(payload: AuthTokenPayload) {
  const payloadWithProject = {
    ...payload,
    projectId: payload.projectId || PROJECT_ID,  // ✅ Auto-add projectId
  };
  return jwt.sign(payloadWithProject, ACCESS_SECRET, { expiresIn: 900 });
}
```

---

### 3. Token Verification

**Before:**
```typescript
export function verifyAccessToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as AuthTokenPayload;
    // No projectId check
  } catch {
    return null;
  }
}
```

**After:**
```typescript
export function verifyAccessToken(token: string): AuthTokenPayload | null {
  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as AuthTokenPayload;
    
    // ✅ Verify projectId matches current project
    if (payload.projectId && payload.projectId !== PROJECT_ID) {
      console.warn(`Token projectId mismatch: ${payload.projectId} !== ${PROJECT_ID}`);
      return null;  // ❌ REJECT token from different project
    }
    
    return payload;
  } catch {
    return null;
  }
}
```

---

### 4. Environment Configuration

**.env file:**
```properties
PROJECT_ID=godrej-mitra
ACCESS_TOKEN_SECRET=eyJ4A9kLmP7qT9sK2wF3zP8dR0uV6xY2
REFRESH_TOKEN_SECRET=eyJ4A9kLmP7qT9sK2wF3zP8dR0uV6xY3
```

**src/lib/auth.ts:**
```typescript
const PROJECT_ID = process.env.PROJECT_ID || 'godrej-mitra';
```

---

## Token Lifecycle

### Login Flow

```
1. User logs in
   ↓
2. Server creates payload:
   {
     userId: '123',
     role: 'CANVASSER',
     projectId: 'godrej-mitra'  // ✅ Added automatically
   }
   ↓
3. Server signs token with payload
   ↓
4. Token stored in httpOnly cookie
   ↓
5. Browser sends token in requests
```

### Verification Flow

```
1. Browser sends request with token
   ↓
2. Server receives token
   ↓
3. Server verifies token signature
   ↓
4. Server checks projectId:
   - Token projectId: 'godrej-mitra'
   - Current PROJECT_ID: 'godrej-mitra'
   - Match? ✅ YES → Allow
   - Match? ❌ NO → Reject (401)
   ↓
5. Allow/Reject request
```

---

## Security Scenarios

### Scenario 1: Valid Token (Same Project)

```
Token: {userId: '123', projectId: 'godrej-mitra'}
Current Project: 'godrej-mitra'
Result: ✅ ACCEPTED
```

### Scenario 2: Token from Different Project

```
Token: {userId: '123', projectId: 'other-project'}
Current Project: 'godrej-mitra'
Result: ❌ REJECTED (401 Unauthorized)
```

### Scenario 3: Token Without ProjectId (Old Token)

```
Token: {userId: '123'}  // No projectId
Current Project: 'godrej-mitra'
Result: ✅ ACCEPTED (backward compatible)
```

### Scenario 4: Manipulated Token

```
Original Token: {userId: '123', projectId: 'godrej-mitra'}
Attacker changes: {userId: '456', projectId: 'other-project'}
Result: ❌ REJECTED (signature verification fails)
```

---

## Files Modified

### 1. `src/lib/auth.ts`
- ✅ Added `projectId` to `AuthTokenPayload` interface
- ✅ Added `PROJECT_ID` constant from environment
- ✅ Updated `signAccessToken()` to include projectId
- ✅ Updated `signRefreshToken()` to include projectId
- ✅ Updated `verifyAccessToken()` to check projectId
- ✅ Updated `verifyRefreshToken()` to check projectId
- ✅ Updated token rotation to include projectId

### 2. `src/app/api/auth/canvasser/verify-otp/route.ts`
- ✅ Updated comment to note projectId is auto-added

### 3. `.env`
- ✅ Already has `PROJECT_ID=godrej-mitra`

---

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Token Isolation** | ❌ No | ✅ Yes |
| **Cross-Project Reuse** | ❌ Possible | ✅ Prevented |
| **Security** | ⚠️ Medium | ✅ High |
| **Multi-Project Support** | ❌ Risky | ✅ Safe |
| **Backward Compatibility** | N/A | ✅ Yes |

---

## Testing

### Test 1: Normal Login
```
1. Login with valid OTP
2. Token created with projectId: 'godrej-mitra'
3. Navigate to dashboard
4. ✅ Should work normally
```

### Test 2: Token Inspection
```
1. Login
2. Open DevTools → Application → Cookies
3. Copy access_token
4. Decode at jwt.io
5. ✅ Should see projectId: 'godrej-mitra' in payload
```

### Test 3: Simulate Different Project
```
1. Manually change PROJECT_ID in .env to 'other-project'
2. Restart server
3. Try to use old token
4. ❌ Should get 401 Unauthorized
```

### Test 4: Token Expiry Still Works
```
1. Login
2. Wait for token to expire (15 minutes)
3. Try to use expired token
4. ❌ Should get 401 Unauthorized
5. ✅ Refresh token should work
```

---

## Multi-Project Deployment

If you deploy this to multiple projects:

**Project A (.env):**
```properties
PROJECT_ID=godrej-mitra
ACCESS_TOKEN_SECRET=secret-a
REFRESH_TOKEN_SECRET=secret-a
```

**Project B (.env):**
```properties
PROJECT_ID=other-project
ACCESS_TOKEN_SECRET=secret-b
REFRESH_TOKEN_SECRET=secret-b
```

**Result:**
- Token from Project A ❌ Won't work in Project B
- Token from Project B ❌ Won't work in Project A
- Each project is completely isolated ✅

---

## Backward Compatibility

Old tokens without `projectId` will still work:

```typescript
if (payload.projectId && payload.projectId !== PROJECT_ID) {
  // Only reject if projectId exists AND doesn't match
  return null;
}
// If no projectId, allow (backward compatible)
return payload;
```

This means:
- ✅ Old tokens still work during transition
- ✅ New tokens have projectId protection
- ✅ No breaking changes

---

## Summary

✅ **Implemented project-level token isolation**
- Tokens now include projectId in payload
- Tokens from different projects are rejected
- Prevents token reuse across projects
- Maintains backward compatibility
- Adds extra layer of security

**This is a best practice for multi-project systems!** 🔒
