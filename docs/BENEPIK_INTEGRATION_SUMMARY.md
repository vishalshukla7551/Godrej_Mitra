# Benepik Reward API - Integration Summary

## ✅ What Was Created

### 1. Core Library Files
- `src/lib/benepik/security.ts` - JWT, AES encryption, HMAC signature generation
- `src/lib/benepik/client.ts` - Benepik API client with helper methods
- `src/lib/benepik/types.ts` - TypeScript interfaces
- `src/lib/benepik/index.ts` - Barrel export for easy imports

### 2. API Routes
- `src/app/api/rewards/send/route.ts` - Main endpoint to send rewards
- `src/app/api/rewards/test/route.ts` - Configuration test endpoint

### 3. Documentation
- `docs/BENEPIK_REWARD_API.md` - Complete usage guide
- `docs/BENEPIK_INTEGRATION_SUMMARY.md` - This file

### 4. Configuration
- Updated `.env` with Benepik configuration variables
- Installed `axios` package

## 🚀 Quick Start

### Step 1: Configure Environment Variables
Edit `.env` and replace with your actual Benepik credentials:
```env
BENEPIK_AUTH_KEY=your_actual_auth_key
BENEPIK_SECRET_KEY=your_actual_secret_key
BENEPIK_API_URL=https://your-actual-bpcp-client/api/sendRewards
```

### Step 2: Test Configuration
```bash
curl http://localhost:3000/api/rewards/test
```

Should return:
```json
{
  "configured": true,
  "details": {
    "authKey": "✓ Set",
    "secretKey": "✓ Set",
    "apiUrl": "✓ Set"
  },
  "message": "Benepik API is properly configured"
}
```

### Step 3: Send a Test Reward
```bash
curl -X POST http://localhost:3000/api/rewards/send \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "Test User",
    "mobileNumber": "9999999999",
    "rewardAmount": 1
  }'
```

## 📝 Usage Examples

### From Frontend (React/Next.js)
```typescript
const sendReward = async () => {
  const response = await fetch('/api/rewards/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: "Rahul Kumar",
      mobileNumber: "9999999999",
      rewardAmount: 100
    })
  });
  
  const result = await response.json();
  if (result.success) {
    alert('Reward sent successfully!');
  } else {
    alert('Error: ' + result.error);
  }
};
```

### From Server-Side Code
```typescript
import { BenepikClient } from '@/lib/benepik';

const client = new BenepikClient();
const payload = client.createSingleRewardPayload(
  "Rahul Kumar",
  "9999999999",
  100
);

const result = await client.sendReward(payload);
```

## 🔒 Security Features

1. **JWT Authentication** - HS256 signed tokens with 15-minute expiry
2. **AES-256-CBC Encryption** - Full payload encryption
3. **HMAC Signature** - Request tampering prevention
4. **Role-Based Access** - Only ADMIN, ABM, ZSM can send rewards
5. **HttpOnly Cookies** - Session tokens protected from XSS

## 🎯 Integration Points

You can integrate this with:
- **Incentive Approval Flow** - Auto-send rewards when incentives are approved
- **Manual Reward Page** - Admin interface to send rewards
- **Bulk Rewards** - Process multiple rewards from CSV/Excel
- **Automated Campaigns** - Scheduled reward distribution

## 📊 Current Permissions

The API endpoint requires:
- User must be authenticated (has valid JWT cookie)
- User role must be: `ADMIN`, `ABM`, or `ZSM`

To change permissions, edit `src/app/api/rewards/send/route.ts`

## 🔧 Customization

### Add More Roles
```typescript
if (!['ADMIN', 'ABM', 'ZSM', 'ASA_CANVASSER'].includes(user.role)) {
  // ...
}
```

### Remove Authentication
```typescript
// Comment out these lines in route.ts
// const user = await getAuthenticatedUserFromCookies();
// if (!user) { ... }
```

### Bulk Rewards
```typescript
const payload: RewardPayload = {
  source: "0",
  isSms: "1",
  isWhatsApp: "1",
  isEmail: "1",
  data: [
    { sno: "1", userName: "User 1", ... },
    { sno: "2", userName: "User 2", ... },
    { sno: "3", userName: "User 3", ... },
  ]
};

const result = await client.sendReward(payload);
```

## 📦 Dependencies Added

- `axios` - HTTP client for API requests

## ⚠️ Important Notes

1. **Never commit .env file** - Contains sensitive API keys
2. **Test with small amounts first** - Verify integration before production
3. **Monitor API usage** - Track costs and rate limits
4. **Error logging** - Set up proper logging for production
5. **Rate limiting** - Consider adding rate limits to prevent abuse

## 🐛 Troubleshooting

### "BENEPIK_AUTH_KEY is not configured"
- Check `.env` file exists
- Verify variable names match exactly
- Restart dev server after changing .env

### "Unauthorized" error
- User not logged in
- Check authentication cookies

### "Insufficient permissions"
- User role not in allowed list
- Check user.role value

### Benepik API errors
- Verify credentials are correct
- Check API URL is correct
- Review Benepik API documentation
- Contact Benepik support with request ID

## 📚 Next Steps

1. Get actual credentials from Benepik
2. Update `.env` with real values
3. Test with small reward amounts
4. Integrate with your incentive approval flow
5. Add error logging and monitoring
6. Create admin UI for manual rewards (optional)

## 🆘 Support

For questions or issues:
- Check `docs/BENEPIK_REWARD_API.md` for detailed documentation
- Review code comments in `src/lib/benepik/` files
- Contact Benepik support for API-specific issues
