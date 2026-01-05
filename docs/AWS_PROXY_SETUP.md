# AWS Proxy Setup for Benepik Integration

## Problem
Vercel doesn't have a static IP, so Benepik can't whitelist it.

## Solution
Use AWS server with static IP as a proxy between Vercel and Benepik.

## Architecture
```
Vercel (Dynamic IP)
    ↓
AWS Next.js (Static IP - Whitelisted)
    ↓
Benepik API
```

---

## Setup Steps

### 1. Deploy AWS Next.js API

**File to deploy:** `aws-nextjs-api/benepik/route.ts`

1. Create a new Next.js project on AWS (EC2 or Amplify)
2. Copy `aws-nextjs-api/benepik/route.ts` to `src/app/api/benepik/route.ts`
3. Install dependencies: `npm install axios`
4. Set environment variable:
   ```bash
   BENEPIK_API_URL=https://benepik.org/bpcp-client-reward-micro/api/sendRewards
   ```
5. Deploy the project

### 2. Get Static IP for AWS

**Option A: EC2 with Elastic IP**
1. Go to AWS EC2 Console
2. Allocate Elastic IP
3. Associate it with your EC2 instance
4. Note the IP address (e.g., `52.123.45.67`)

**Option B: AWS Amplify with NAT Gateway**
1. Set up VPC with NAT Gateway
2. Configure Amplify to use the VPC
3. Get NAT Gateway's Elastic IP

### 3. Whitelist AWS IP with Benepik

Contact Benepik support and provide:
- Your AWS static IP: `52.123.45.67`
- Request to whitelist this IP

### 4. Update Vercel Environment Variables

In Vercel dashboard, set:
```
BENEPIK_AUTH_KEY=Kjs8df8!fj39sJf92nq#3Jasf82^@2Lncs90dkfLcm03Fjs9
BENEPIK_SECRET_KEY=Yh73@8Jsk#28!dfjWm91zPqL7v6$Bnq02XakNfVp
BENEPIK_API_URL=https://your-aws-domain.com/api/benepik
```

Replace `your-aws-domain.com` with your actual AWS domain.

### 5. Test the Setup

Run the test script:
```bash
npx tsx scripts/test-benepik-reward.ts
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Vercel (Your Main App)                                      │
│                                                              │
│ 1. User triggers reward                                     │
│ 2. Generate JWT, checksum, signature                        │
│ 3. POST to AWS proxy                                        │
│    URL: https://your-aws-domain.com/api/benepik            │
│    Body: { checksum, requestHeaders }                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ AWS Next.js (Proxy Server - Static IP: 52.123.45.67)       │
│                                                              │
│ 1. Receive request from Vercel                              │
│ 2. Extract checksum and headers                             │
│ 3. Forward to Benepik with all headers                      │
│    URL: https://benepik.org/api/sendRewards                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ Benepik API                                                  │
│                                                              │
│ 1. Verify IP is whitelisted (52.123.45.67) ✓               │
│ 2. Verify JWT token                                         │
│ 3. Verify HMAC signature                                    │
│ 4. Decrypt checksum                                         │
│ 5. Process reward                                           │
│ 6. Send SMS/WhatsApp to user                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Code Changes Made

### 1. AWS API Route
**File:** `aws-nextjs-api/benepik/route.ts`
- Receives checksum and headers from Vercel
- Forwards to Benepik API
- Returns Benepik's response

### 2. Vercel Client Update
**File:** `src/lib/benepik/client.ts`
- Changed to send checksum + headers to AWS proxy
- AWS proxy handles the actual Benepik API call

### 3. Environment Variable
**File:** `.env`
- `BENEPIK_API_URL` now points to AWS proxy instead of Benepik directly

---

## Testing

### Test AWS Proxy Directly
```bash
curl -X POST https://your-aws-domain.com/api/benepik \
  -H "Content-Type: application/json" \
  -d '{
    "checksum": "test-checksum",
    "requestHeaders": {
      "Authorization": "Bearer test-token",
      "REQUESTID": "test-id",
      "X-TIMESTAMP": "1234567890",
      "X-NONCE": "test-nonce",
      "X-SIGNATURE": "test-signature"
    }
  }'
```

### Test Full Flow from Vercel
```bash
npx tsx scripts/test-benepik-reward.ts
```

---

## Troubleshooting

### Error: "IP not whitelisted"
- Verify AWS static IP is correct
- Confirm Benepik has whitelisted the IP
- Check if NAT Gateway IP is being used (not instance IP)

### Error: "Connection timeout"
- Check AWS security groups allow outbound HTTPS (port 443)
- Verify Benepik API URL is correct
- Check AWS proxy is running

### Error: "Invalid signature"
- Verify `BENEPIK_AUTH_KEY` and `BENEPIK_SECRET_KEY` are correct
- Check they match on both Vercel and AWS

---

## Cost Estimate

**AWS EC2 (t3.micro):**
- Instance: ~$7/month
- Elastic IP: Free (when attached)
- Data transfer: ~$0.09/GB

**Total:** ~$10-15/month

---

## Security Notes

1. **Never commit AWS credentials** to git
2. **Use environment variables** for all secrets
3. **Enable HTTPS** on AWS server
4. **Restrict AWS security groups** to only allow necessary traffic
5. **Monitor AWS CloudWatch** for suspicious activity

---

## Support

If you encounter issues:
1. Check AWS CloudWatch logs
2. Check Vercel deployment logs
3. Contact Benepik support with request ID from failed requests
