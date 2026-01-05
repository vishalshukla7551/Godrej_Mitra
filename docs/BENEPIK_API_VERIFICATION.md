# Benepik Reward API - Implementation Verification

## Date: December 29, 2025

## 1. Client Credentials (from Excel file)

### Extracted from "Client Details - Zopper (1).xlsx":

| Key | Value |
|-----|-------|
| **Entity ID** | BENEPIK226423 |
| **Mailer** | 1058 |
| **Client ID** | 2364 |
| **Admin ID** | 926 |
| **Client Code** | 1063;1064 |
| **Auth Key** | Kjs8df8!fj39sJf92nq#3Jasf82^@2Lncs90dkfLcm03Fjs9 |
| **Secret Key** | Yh73@8Jsk#28!dfjWm91zPqL7v6$Bnq02XakNfVp |
| **Signature Key** | UfPxgj3nlxF1NfI/Lo1+zZdxbUU770GlzoLYhZBL1HM= |
| **API URL** | https://benepik.org/bpcp-client-reward-micro/api/sendRewards |

### Current .env Configuration:
```env
BENEPIK_AUTH_KEY="Kjs8df8!fj39sJf92nq#3Jasf82^@2Lncs90dkfLcm03Fjs9" ✅
BENEPIK_SECRET_KEY="Yh73@8Jsk#28!dfjWm91zPqL7v6$Bnq02XakNfVp" ✅
BENEPIK_SIGNATURE_KEY="UfPxgj3nlxF1NfI/Lo1+zZdxbUU770GlzoLYhZBL1HM=" ✅
BENEPIK_API_URL="https://benepik.org/bpcp-client-reward-micro/api/sendRewards" ✅
AWS_PROXY_URL="https://salesdost.zopper.com/api/benepik"
```

**Note**: Values are quoted to handle special characters (#, $, !, etc.)

**Status**: All keys match Excel file ✅

---

## 2. Current Implementation Analysis

### 2.1 JWT Token Generation (`src/lib/benepik/security.ts`)

**Current Implementation**:
```typescript
{
  iat: issuedAt,
  exp: issuedAt + 900,  // 15 minutes
  iss: "benepik-tech",
  aud: "client-system",
  jti: crypto.randomBytes(16).toString("base64"),
  clientId: 1200,  // ⚠️ HARDCODED
  adminId: 23,     // ⚠️ HARDCODED
  event: "reward"
}
```

**Expected from Excel**:
- Client ID: **2364** (not 1200)
- Admin ID: **926** (not 23)

**Issue**: JWT payload contains incorrect hardcoded values ❌

---

### 2.2 AES-256-CBC Encryption

**Current Implementation**:
```typescript
const iv = crypto.randomBytes(16);
const key = crypto.createHash("sha256").update(secretKey).digest();
const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
let encrypted = cipher.update(JSON.stringify(payload), "utf8", "base64");
encrypted += cipher.final("base64");
const combined = Buffer.concat([iv, Buffer.from(encrypted, "base64")]);
return combined.toString("base64");
```

**Analysis**:
- Uses AES-256-CBC ✅
- Random IV generation ✅
- SHA-256 hashed secret key ✅
- IV prepended to encrypted data ✅
- Base64 encoded output ✅

**Status**: Encryption implementation looks correct ✅

---

### 2.3 HMAC Signature

**Current Implementation**:
```typescript
const signatureString = `${requestId}|${timestamp}|${nonce}|${checksum}`;
return crypto.createHmac("sha256", secretKey).update(signatureString).digest("base64");
```

**Analysis**:
- Uses HMAC-SHA256 ✅
- Signature format: `requestId|timestamp|nonce|checksum` ✅
- Base64 encoded ✅

**Note**: Excel file mentions a separate "signatureKey" (`UfPxgj3nlxF1NfI/Lo1+zZdxbUU770GlzoLYhZBL1HM=`), but current implementation uses `secretKey`. Need to verify if this is correct. ⚠️

---

### 2.4 Request Headers

**Current Implementation**:
```typescript
{
  Authorization: `Bearer ${jwtToken}`,
  REQUESTID: requestId,
  "X-TIMESTAMP": timestamp.toString(),
  "X-NONCE": nonce,
  "X-SIGNATURE": signature,
}
```

**Status**: Headers format looks standard ✅

---

### 2.5 Request Body

**Current Implementation**:
```typescript
{
  checksum: "<encrypted-payload>"
}
```

**Status**: Body contains only encrypted checksum ✅

---

### 2.6 API Endpoint

**Excel Documentation**: `https://benepik.org/bpcp-client-reward-micro/api/sendRewards`

**Current Implementation**: Uses AWS proxy at `https://salesdost.zopper.com/api/benepik`

**AWS Proxy** (`aws-nextjs-api/benepik/route.ts`):
- Forwards request to `process.env.BENEPIK_API_URL`
- Missing environment variable in .env file ❌

---

## 3. Issues Found

### 🔴 Critical Issues:

1. **Incorrect JWT Client ID and Admin ID**
   - Current: clientId=1200, adminId=23
   - Expected: clientId=2364, adminId=926
   - **Impact**: API will reject requests with invalid client credentials

2. **Missing BENEPIK_API_URL in .env**
   - AWS proxy expects this variable
   - Should be: `https://benepik.org/bpcp-client-reward-micro/api/sendRewards`

### ⚠️ Warnings:

3. **Signature Key Discrepancy**
   - Excel provides separate "signatureKey": `UfPxgj3nlxF1NfI/Lo1+zZdxbUU770GlzoLYhZBL1HM=`
   - Current implementation uses `secretKey` for HMAC
   - Need to verify which key should be used

4. **Entity ID Not Used**
   - Excel provides Entity ID: `BENEPIK226423`
   - Not used in current implementation
   - May need to be included in payload or headers

5. **Authentication Disabled**
   - `src/app/api/rewards/send/route.ts` has auth checks commented out
   - Should be re-enabled for production

---

## 4. Recommended Fixes

### Fix 1: Update JWT Payload
```typescript
// src/lib/benepik/security.ts
const payload = {
  iat: issuedAt,
  exp: issuedAt + 900,
  iss: "benepik-tech",
  aud: "client-system",
  jti: crypto.randomBytes(16).toString("base64"),
  clientId: 2364,  // ✅ Updated from Excel
  adminId: 926,    // ✅ Updated from Excel
  event: "reward"
};
```

### Fix 2: Add BENEPIK_API_URL to .env
```env
BENEPIK_API_URL=https://benepik.org/bpcp-client-reward-micro/api/sendRewards
```

### Fix 3: Verify Signature Key Usage
Need to check if HMAC should use `signatureKey` instead of `secretKey`:
```typescript
// Option A: Use separate signature key
const signatureKey = process.env.BENEPIK_SIGNATURE_KEY;
return crypto.createHmac("sha256", signatureKey).update(signatureString).digest("base64");

// Option B: Keep using secretKey (current)
return crypto.createHmac("sha256", secretKey).update(signatureString).digest("base64");
```

### Fix 4: Re-enable Authentication
Uncomment auth checks in `src/app/api/rewards/send/route.ts`

---

## 5. Testing Checklist

- [ ] Update JWT clientId and adminId
- [ ] Add BENEPIK_API_URL to .env
- [ ] Test with small reward amount (₹1-10)
- [ ] Verify API response format
- [ ] Check if signatureKey should be used
- [ ] Confirm Entity ID usage
- [ ] Re-enable authentication
- [ ] Test end-to-end flow

---

## 6. Next Steps

1. **Immediate**: Fix JWT payload with correct clientId and adminId
2. **Immediate**: Add BENEPIK_API_URL to environment variables
3. **Verify**: Contact Benepik support or check PDF documentation for:
   - Whether to use `signatureKey` or `secretKey` for HMAC
   - Whether Entity ID should be in headers or payload
   - Exact request/response format
4. **Test**: Run test script with small amount
5. **Production**: Re-enable authentication after successful testing

---

## 7. Files to Update

1. `src/lib/benepik/security.ts` - Fix JWT payload
2. `.env` - Add BENEPIK_API_URL
3. `src/app/api/rewards/send/route.ts` - Re-enable auth (after testing)
4. Possibly add `BENEPIK_SIGNATURE_KEY` if needed

