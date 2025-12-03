import { NextRequest, NextResponse } from 'next/server';
import { comifyService } from '@/lib/comify';

// POST /api/test/comify
// Body: { phone: string, otp?: string }
// Test endpoint to verify Comify WhatsApp integration
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = body;

    if (!phone) {
      return NextResponse.json({ error: 'phone is required' }, { status: 400 });
    }

    if (!comifyService.isConfigured()) {
      return NextResponse.json({ 
        error: 'Comify service not configured',
        configured: false 
      }, { status: 400 });
    }

    const testOtp = otp || '123456';

    try {
      const result = await comifyService.sendOtp(phone, testOtp);
      
      return NextResponse.json({
        success: true,
        message: 'Test OTP sent successfully via Comify',
        phone: phone,
        otp: testOtp,
        comifyResponse: result
      });
    } catch (error) {
      console.error('[Comify Test] Error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        phone: phone,
        otp: testOtp
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/test/comify', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/test/comify
// Check Comify configuration status
export async function GET() {
  return NextResponse.json({
    configured: comifyService.isConfigured(),
    apiUrl: process.env.COMIFY_API_URL || 'https://commify.transify.tech/v1/comm',
    templateName: process.env.COMIFY_TEMPLATE_NAME || 'zopper_oem_sec_otpverify',
    hasApiKey: !!process.env.COMIFY_API_KEY
  });
}