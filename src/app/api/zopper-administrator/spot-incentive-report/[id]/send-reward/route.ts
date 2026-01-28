import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import axios from 'axios';
import jwt from 'jsonwebtoken';

/**
 * POST /api/zopper-administrator/spot-incentive-report/[id]/send-reward
 * Send reward to canvasser via Benepik API after marking as paid
 */
export async function POST(
  _req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    // Normalize params
    const params = context.params as { id: string };

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reportId } = await params;

    // 1. Fetch the spot incentive report with canvasser details
    const report = await prisma.spotIncentiveReport.findUnique({
      where: { id: reportId },
      include: {
        canvasserUser: true,
        plan: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Check if reward already sent (race condition prevention)
    if (report.transactionId) {
      return NextResponse.json(
        {
          error: 'Reward already sent for this report',
          message: 'This report has already been processed',
          transactionId: report.transactionId,
        },
        { status: 409 } // 409 Conflict
      );
    }

    if (!report.canvasserUser) {
      return NextResponse.json(
        { error: 'Canvasser not found for this report' },
        { status: 404 }
      );
    }

    // 2. Extract required data
    const canvasser = report.canvasserUser;
    const rewardAmount = report.spotincentiveEarned.toString();
    const mobileNumber = canvasser.phone;
    const userName = canvasser.fullName || 'Canvasser';
    const emailAddress = canvasser.email || '';

    // 3. Build Benepik payload
    const rewardPayload = {
      source: '0',
      isSms: '1',
      isWhatsApp: '0',
      isEmail: '0',
      data: [
        {
          sno: '1',
          userName: userName,
          emailAddress: emailAddress,
          countryCode: '+91',
          mobileNumber: mobileNumber,
          rewardAmount: rewardAmount,
          personalMessage: '',
          messageFrom: '',
          ccEmailAddress: '',
          bccEmailAddress: '',
          reference: '',
          mailer: '1058',
          certificateId: '',
          transactionId: 'TXN-' + Date.now(),
          entityId: '1063',
          column1: '',
          column2: '',
          column3: '',
          column4: '',
          column5: '',
        },
      ],
    };

    console.log('📤 Sending reward payload to Benepik:', JSON.stringify(rewardPayload, null, 2));

    // 4. Generate UAT Benepik Token
    const uatTokenSecret = process.env.UAT_TOKEN_SECRET;
    const uatClientId = process.env.UAT_CLIENT_ID || 'benepik-uat-client';

    if (!uatTokenSecret) {
      return NextResponse.json(
        { error: 'UAT_TOKEN_SECRET not configured' },
        { status: 500 }
      );
    }

    const uatToken = jwt.sign(
      { clientId: uatClientId },
      uatTokenSecret,
      { expiresIn: '1h' }
    );

    console.log('🔐 Generated UAT Token for Benepik API');

    // 5. Call UAT Benepik API
    const benepikResponse = await axios.post(
      `https://salesdost.zopper.com/api/uat/benepik`,
      rewardPayload,
      {
        headers: {
          'Authorization': `Bearer ${uatToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Benepik API Response:', benepikResponse.data);

    // 6. Validate Benepik response - success only if code is 1000 and HTTP 200
    // Handle nested response structure
    const benepikData = benepikResponse.data?.data || benepikResponse.data;
    const isSuccessful = 
      benepikResponse.status === 200 && 
      benepikData?.code === 1000 && 
      benepikData?.success === 1;

    if (!isSuccessful) {
      console.error('❌ Benepik API returned non-success response:', {
        status: benepikResponse.status,
        code: benepikData?.code,
        success: benepikData?.success,
        message: benepikData?.message,
      });

      return NextResponse.json(
        {
          error: 'Reward processing failed',
          details: {
            code: benepikData?.code,
            message: benepikData?.message,
            batchResponse: benepikData?.batchResponse,
          },
        },
        { status: 400 }
      );
    }

    // 7. Update report with transaction ID if successful
    await prisma.spotIncentiveReport.update({
      where: { id: reportId },
      data: {
        spotincentivepaidAt: new Date(),
        transactionId: rewardPayload.data[0].transactionId,
        transactionMetadata: {
          payload: rewardPayload.data[0],
          benepikResponse: benepikResponse.data,
          sentAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Reward sent successfully',
      data: {
        reportId,
        canvasserPhone: mobileNumber,
        rewardAmount,
        benepikResponse: benepikResponse.data,
      },
    });

  } catch (error: any) {
    console.error('❌ Error sending reward:', error.message);
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      console.error('Zopper API Error:', {
        status,
        code: data?.code,
        message: data?.message,
        batchResponse: data?.batchResponse,
        rawData: typeof data === 'string' ? data.substring(0, 200) : data,
      });

      // Map Benepik error codes to user-friendly messages
      const errorMessages: Record<number, string> = {
        1001: 'Unauthorized IP Address',
        1002: 'Invalid Client Code',
        1003: 'Client Code Missing',
        1004: 'Missing/Invalid Bearer Token',
        1005: 'Authentication Failed',
        1006: 'Token Expired',
        1007: 'Checksum Required',
        1008: 'Invalid Checksum',
        1009: 'Required Parameter Missing',
        1010: 'Input Error',
        1011: 'Unauthorized Access',
        1012: 'Insufficient Balance',
        1013: 'No Rewards to Process',
        1050: 'Pending/Request Accept - Cannot Reinitiate',
        1020: 'HMAC Header Missing',
        1021: 'Request Expired',
        1022: 'Replay Request',
        1023: 'Invalid Signature or Rate Limit Exceeded',
        1024: 'IP Blocked',
        503: 'Benepik Service Temporarily Unavailable',
        502: 'Bad Gateway',
        504: 'Gateway Timeout',
      };

      const errorMessage = errorMessages[status] || 
                          errorMessages[data?.code] || 
                          data?.message || 
                          'Unknown error';

      return NextResponse.json(
        {
          error: 'Benepik API error',
          code: data?.code || status,
          message: errorMessage,
          details: data,
          httpStatus: status,
        },
        { status: status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
