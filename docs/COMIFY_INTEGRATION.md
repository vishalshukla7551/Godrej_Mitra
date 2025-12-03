# Comify WhatsApp API Integration

This document explains how the Comify WhatsApp API is integrated into the SEC OTP authentication system.

## Overview

The application now sends OTP codes via WhatsApp using the Comify API service. When a user requests an OTP for SEC login, the system:

1. Generates a 6-digit OTP code
2. Stores it in the database with expiration time
3. Sends the OTP via WhatsApp using Comify's API
4. Logs the operation for debugging

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Comify WhatsApp API Configuration
COMIFY_API_URL=https://commify.transify.tech/v1/comm
COMIFY_API_KEY=qkj0jMgv2wPvef4b7zsfkgOcIk7QDy
COMIFY_TEMPLATE_NAME=zopper_oem_sec_otpverify
```

### API Details

- **URL**: `https://commify.transify.tech/v1/comm`
- **Method**: POST
- **Authentication**: API Key in Authorization header
- **Template**: `zopper_oem_sec_otpverify`

## API Endpoints

### Send OTP
**POST** `/api/auth/sec/send-otp`

```json
{
  "phoneNumber": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP generated and sent successfully"
}
```

### Test Comify Integration
**POST** `/api/test/comify`

```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

**GET** `/api/test/comify`
- Returns configuration status

## Implementation Details

### Comify Service (`src/lib/comify.ts`)

The `ComifyService` class handles all WhatsApp API interactions:

- **Phone Number Formatting**: Automatically adds country code (91 for India)
- **Error Handling**: Comprehensive error logging and handling
- **Configuration Check**: Validates API key presence
- **Reusable Methods**: Can send OTP or custom messages

### Key Features

1. **Automatic Phone Formatting**: 
   - `9876543210` → `919876543210`
   - Handles various input formats

2. **Error Resilience**: 
   - OTP is always stored in database
   - WhatsApp sending failure doesn't break login flow
   - Detailed error logging

3. **Template Support**:
   - Uses configurable WhatsApp template
   - Supports custom message templates

4. **Development Mode**:
   - Works without Comify configuration
   - Falls back to console logging

## Usage Examples

### Basic OTP Sending
```typescript
import { comifyService } from '@/lib/comify';

// Send OTP
await comifyService.sendOtp('9876543210', '123456');
```

### Custom Messages
```typescript
// Send custom WhatsApp message
await comifyService.sendCustomMessage(
  'custom_template_name',
  '9876543210',
  { 
    name: 'John Doe',
    amount: 5000 
  }
);
```

### Check Configuration
```typescript
if (comifyService.isConfigured()) {
  // Send WhatsApp message
} else {
  // Handle fallback
}
```

## Testing

### Test Comify Integration
```bash
# Check configuration
curl http://localhost:3000/api/test/comify

# Send test OTP
curl -X POST http://localhost:3000/api/test/comify \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "123456"}'
```

### Test SEC OTP Flow
```bash
# Request OTP
curl -X POST http://localhost:3000/api/auth/sec/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "9876543210"}'
```

## Error Handling

The system handles various error scenarios:

1. **Missing API Key**: Service disabled, falls back to console logging
2. **Network Errors**: Logged but doesn't break OTP flow
3. **Invalid Phone**: Returns 400 error before attempting to send
4. **Comify API Errors**: Logged with full error details

## Security Considerations

1. **API Key Protection**: Stored in environment variables
2. **Phone Number Validation**: Validates format before sending
3. **Rate Limiting**: Consider implementing rate limiting for OTP requests
4. **Error Information**: Sensitive API details not exposed to client

## Monitoring

Monitor these logs for Comify integration:

- `[SEC OTP]` - OTP generation and sending status
- `[Comify]` - WhatsApp API requests and responses
- `[Comify Test]` - Test endpoint usage

## Troubleshooting

### Common Issues

1. **OTP not received**: Check Comify logs and API key
2. **Invalid phone format**: Ensure 10-digit Indian mobile number
3. **API errors**: Check network connectivity and API key validity
4. **Template errors**: Verify template name matches Comify configuration

### Debug Steps

1. Check configuration: `GET /api/test/comify`
2. Test with known number: `POST /api/test/comify`
3. Check server logs for detailed error messages
4. Verify environment variables are loaded correctly

## Future Enhancements

Potential improvements:

1. **Multiple Templates**: Support different message types
2. **Delivery Status**: Track message delivery status
3. **Retry Logic**: Automatic retry on temporary failures
4. **Rate Limiting**: Prevent abuse of OTP sending
5. **Analytics**: Track sending success rates and failures