# Benepik Reward API Integration

## Overview
This integration allows sending rewards to users via the Benepik API with proper JWT authentication, AES encryption, and HMAC signatures.

## Configuration

### 1. Environment Variables (.env)
```env
BENEPIK_AUTH_KEY=your_auth_key_from_benepik
BENEPIK_SECRET_KEY=your_secret_key_from_benepik
BENEPIK_API_URL=https://your-bpcp-client/api/sendRewards
```

**⚠️ IMPORTANT:** Never commit these keys to version control!

## File Structure

```
src/
├── lib/
│   └── benepik/
│       ├── security.ts      # JWT, Checksum, HMAC generation
│       ├── client.ts         # Benepik API client
│       └── types.ts          # TypeScript interfaces
└── app/
    └── api/
        └── rewards/
            └── send/
                └── route.ts  # API endpoint
```

## Usage

### Method 1: Simple Format (Recommended)

```typescript
// POST /api/rewards/send
const response = await fetch('/api/rewards/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userName: "Rahul Kumar",
    mobileNumber: "9999999999",
    rewardAmount: 100,
    options: {
      countryCode: "+91",
      entityId: "1886",
      sendSms: true,
      sendWhatsApp: true,
      sendEmail: true
    }
  })
});

const result = await response.json();
```

### Method 2: Full Payload Format

```typescript
// POST /api/rewards/send
const response = await fetch('/api/rewards/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    source: "0",
    isSms: "1",
    isWhatsApp: "1",
    isEmail: "1",
    data: [
      {
        sno: "1",
        userName: "Rahul Kumar",
        countryCode: "+91",
        mobileNumber: "9999999999",
        rewardAmount: "100",
        entityId: "1886",
        transactionId: "TXN-1234567890"
      }
    ]
  })
});

const result = await response.json();
```

### Method 3: Direct Client Usage (Server-side only)

```typescript
import { BenepikClient } from '@/lib/benepik/client';

const client = new BenepikClient();

// Simple way
const payload = client.createSingleRewardPayload(
  "Rahul Kumar",
  "9999999999",
  100,
  {
    countryCode: "+91",
    entityId: "1886",
    sendSms: true,
    sendWhatsApp: true,
    sendEmail: true
  }
);

const result = await client.sendReward(payload);

if (result.success) {
  console.log("Reward sent:", result.data);
} else {
  console.error("Error:", result.error);
}
```

## Security Features

### 1. JWT Token
- Algorithm: HS256
- Expiry: 15 minutes (900 seconds)
- Contains: clientId, adminId, event, timestamps

### 2. AES-256-CBC Encryption
- Encrypts the entire reward payload
- Uses SHA-256 hashed secret key
- Random IV for each request

### 3. HMAC Signature
- Signs: requestId|timestamp|nonce|checksum
- Algorithm: SHA-256
- Prevents tampering

### 4. Request Headers
```
Authorization: Bearer <JWT>
REQUESTID: <uuid>
X-TIMESTAMP: <unix-timestamp>
X-NONCE: <random-hex>
X-SIGNATURE: <base64-hmac>
Content-Type: application/json
```

## API Response

### Success Response
```json
{
  "success": true,
  "message": "Reward sent successfully",
  "data": {
    // Benepik API response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Authentication & Authorization

The API endpoint requires:
- Valid authentication (JWT cookie)
- User role must be: ADMIN, ABM, or ZSM

To modify permissions, edit `src/app/api/rewards/send/route.ts`:

```typescript
// Remove authentication check
// const user = await getAuthenticatedUserFromCookies();

// Or change allowed roles
if (!['ADMIN', 'ABM', 'ZSM', 'ASA_CANVASSER'].includes(user.role)) {
  // ...
}
```

## Testing

### Using curl
```bash
curl -X POST http://localhost:3000/api/rewards/send \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "Test User",
    "mobileNumber": "9999999999",
    "rewardAmount": 10
  }'
```

### Using Postman
1. Method: POST
2. URL: `http://localhost:3000/api/rewards/send`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "userName": "Test User",
  "mobileNumber": "9999999999",
  "rewardAmount": 10
}
```

## Error Handling

Common errors:
- `BENEPIK_AUTH_KEY is not configured` - Missing environment variable
- `BENEPIK_SECRET_KEY is not configured` - Missing environment variable
- `BENEPIK_API_URL is not configured` - Missing environment variable
- `Unauthorized` - User not logged in
- `Insufficient permissions` - User role not allowed

## Production Checklist

- [ ] Set real Benepik credentials in production .env
- [ ] Never commit .env file
- [ ] Test with small amounts first
- [ ] Set up proper error logging
- [ ] Configure rate limiting if needed
- [ ] Review and adjust role permissions
- [ ] Monitor API usage and costs

## Support

For Benepik API issues, contact Benepik support with:
- Request ID from headers
- Timestamp
- Error response
