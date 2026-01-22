# Token Security - Before vs After

## Visual Comparison

### ❌ BEFORE (Risky)

```
┌─────────────────────────────────────────────────────────────┐
│ PROJECT A (godrej-mitra)                                    │
├─────────────────────────────────────────────────────────────┤
│ User Login                                                  │
│   ↓                                                         │
│ Token = {userId: '123', role: 'CANVASSER'}                 │
│   ↓                                                         │
│ Stored in httpOnly cookie                                  │
│   ↓                                                         │
│ ⚠️ Token doesn't know which project it belongs to!         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PROJECT B (other-project)                                   │
├─────────────────────────────────────────────────────────────┤
│ Attacker copies token from Project A                        │
│   ↓                                                         │
│ Token = {userId: '123', role: 'CANVASSER'}                 │
│   ↓                                                         │
│ ❌ SAME TOKEN WORKS IN PROJECT B!                          │
│ ❌ SECURITY BREACH!                                        │
└─────────────────────────────────────────────────────────────┘
```

### ✅ AFTER (Secure)

```
┌─────────────────────────────────────────────────────────────┐
│ PROJECT A (godrej-mitra)                                    │
├─────────────────────────────────────────────────────────────┤
│ User Login                                                  │
│   ↓                                                         │
│ Token = {                                                  │
│   userId: '123',                                           │
│   role: 'CANVASSER',                                       │
│   projectId: 'godrej-mitra'  ✅ NEW!                       │
│ }                                                          │
│   ↓                                                         │
│ Stored in httpOnly cookie                                  │
│   ↓                                                         │
│ ✅ Token knows it belongs to Project A                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PROJECT B (other-project)                                   │
├─────────────────────────────────────────────────────────────┤
│ Attacker copies token from Project A                        │
│   ↓                                                         │
│ Token = {                                                  │
│   userId: '123',                                           │
│   role: 'CANVASSER',                                       │
│   projectId: 'godrej-mitra'  ← Wrong project!              │
│ }                                                          │
│   ↓                                                         │
│ Server checks: projectId === PROJECT_ID?                   │
│ 'godrej-mitra' === 'other-project'? ❌ NO                  │
│   ↓                                                         │
│ ❌ TOKEN REJECTED (401 Unauthorized)                       │
│ ✅ SECURITY PROTECTED!                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Token Payload Comparison

### Before
```json
{
  "userId": "user123",
  "role": "CANVASSER",
  "iat": 1705000000,
  "exp": 1705000900
}
```

### After
```json
{
  "userId": "user123",
  "role": "CANVASSER",
  "projectId": "godrej-mitra",
  "iat": 1705000000,
  "exp": 1705000900
}
```

---

## Verification Flow

### Before
```
Token received
  ↓
Verify signature ✅
  ↓
Check expiry ✅
  ↓
✅ ALLOW REQUEST
(No projectId check)
```

### After
```
Token received
  ↓
Verify signature ✅
  ↓
Check expiry ✅
  ↓
Check projectId:
  Token projectId: 'godrej-mitra'
  Current PROJECT_ID: 'godrej-mitra'
  Match? ✅ YES
  ↓
✅ ALLOW REQUEST
```

---

## Attack Scenarios

### Scenario 1: Token Theft

**Before:**
```
Attacker steals token from Project A
  ↓
Uses it in Project B
  ↓
❌ WORKS! (Security breach)
```

**After:**
```
Attacker steals token from Project A
  ↓
Tries to use it in Project B
  ↓
Server checks projectId
  ↓
❌ REJECTED (401 Unauthorized)
```

### Scenario 2: Token Manipulation

**Before:**
```
Attacker modifies token payload
  ↓
Changes role to 'ADMIN'
  ↓
❌ Signature verification fails (good)
```

**After:**
```
Attacker modifies token payload
  ↓
Changes projectId to 'other-project'
  ↓
❌ Signature verification fails (good)
❌ Even if signature was valid, projectId check would fail
```

### Scenario 3: Multi-Project Deployment

**Before:**
```
Deploy same code to Project A and Project B
  ↓
Both use same ACCESS_TOKEN_SECRET
  ↓
Token from A works in B
  ↓
❌ SECURITY RISK
```

**After:**
```
Deploy same code to Project A and Project B
  ↓
Project A: PROJECT_ID='godrej-mitra'
Project B: PROJECT_ID='other-project'
  ↓
Token from A has projectId='godrej-mitra'
Token from B has projectId='other-project'
  ↓
Token from A ❌ REJECTED in B
Token from B ❌ REJECTED in A
  ↓
✅ SECURE
```

---

## Implementation Checklist

- [x] Add `projectId` to `AuthTokenPayload` interface
- [x] Add `PROJECT_ID` constant from environment
- [x] Update `signAccessToken()` to include projectId
- [x] Update `signRefreshToken()` to include projectId
- [x] Update `verifyAccessToken()` to check projectId
- [x] Update `verifyRefreshToken()` to check projectId
- [x] Update token rotation logic
- [x] Add PROJECT_ID to .env
- [ ] Test with different PROJECT_ID values
- [ ] Document for team

---

## Environment Configuration

### Development
```properties
PROJECT_ID=godrej-mitra-dev
```

### Staging
```properties
PROJECT_ID=godrej-mitra-staging
```

### Production
```properties
PROJECT_ID=godrej-mitra
```

Each environment has its own PROJECT_ID, so tokens are isolated per environment too!

---

## Summary

✅ **Token Security Enhanced**
- Tokens now include project identifier
- Prevents cross-project token reuse
- Adds extra layer of security
- Maintains backward compatibility
- Best practice for multi-project systems

**Result:** Even if token is stolen, it can only be used in the correct project! 🔒
