import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import axios from 'axios';
import jwt from 'jsonwebtoken';

/**
 * POST /api/zopper-administrator/spot-incentive-report/send-reward
 * Send rewards to multiple canvassers via Benepik API
 * 
 * Request body:
 * {
 *   reportIds: string[]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { reportIds } = body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json(
        { error: 'reportIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate all IDs are strings
    if (!reportIds.every((id: any) => typeof id === 'string')) {
      return NextResponse.json(
        { error: 'All reportIds must be strings' },
        { status: 400 }
      );
    }

    console.log(`📤 Processing rewards for ${reportIds.length} report(s)`);

    // 1. Fetch all reports with canvasser details
    const reports = await prisma.spotIncentiveReport.findMany({
      where: {
        id: {
          in: reportIds,
        },
      },
      include: {
        canvasserUser: true,
        plan: true,
      },
    });

    if (reports.length === 0) {
      return NextResponse.json(
        { error: 'No reports found' },
        { status: 404 }
      );
    }

    // Check for already processed reports (race condition prevention)
    const alreadyProcessed = reports.filter(r => r.transactionId);
    if (alreadyProcessed.length > 0) {
      return NextResponse.json(
        {
          error: 'Some reports already processed',
          message: `${alreadyProcessed.length} report(s) have already been processed`,
          alreadyProcessedIds: alreadyProcessed.map(r => r.id),
          pendingIds: reports.filter(r => !r.transactionId).map(r => r.id),
        },
        { status: 409 } // 409 Conflict
      );
    }

    // Validate all reports have canvasser details
    const reportsWithoutCanvasser = reports.filter(r => !r.canvasserUser);
    if (reportsWithoutCanvasser.length > 0) {
      return NextResponse.json(
        {
          error: `${reportsWithoutCanvasser.length} report(s) missing canvasser details`,
          reportIds: reportsWithoutCanvasser.map(r => r.id),
        },
        { status: 400 }
      );
    }

    // 2. Build Benepik payload with all rewards
    const benepikData = reports.map((report, index) => {
      const canvasser = report.canvasserUser!;
      const rewardAmount = report.spotincentiveEarned.toString();
      const mobileNumber = canvasser.phone;
      const userName = canvasser.fullName || 'Canvasser';
      const emailAddress = canvasser.email || '';

      return {
        sno: (index + 1).toString(),
        userName: userName,
        emailAddress: emailAddress,
        countryCode: '+91',
        mobileNumber: mobileNumber,
        rewardAmount: rewardAmount,
        personalMessage: '',
        messageFrom: '',
        ccEmailAddress: '',
        bccEmailAddress: '',
        reference: report.id,
        mailer: '1058',
        certificateId: '',
        transactionId: 'TXN-' + report.id + '-' + Date.now(),
        entityId: '1063',
        column1: '',
        column2: '',
        column3: '',
        column4: '',
        column5: '',
      };
    });

    const rewardPayload = {
      source: '0',
      isSms: '1',
      isWhatsApp: '0',
      isEmail: '0',
      data: benepikData,
    };

    console.log(`📤 Sending ${benepikData.length} reward(s) to Benepik API`);

    // 3. Generate UAT Benepik Token
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

    // 4. Call UAT Benepik API
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

    // 5. Validate Benepik response - success only if code is 1000 and HTTP 200
    // Handle nested response structure
    const benepikResponseData = benepikResponse.data?.data || benepikResponse.data;
    const isSuccessful = 
      benepikResponse.status === 200 && 
      benepikResponseData?.code === 1000 && 
      benepikResponseData?.success === 1;

    if (!isSuccessful) {
      console.error('❌ Benepik API returned non-success response:', {
        status: benepikResponse.status,
        code: benepikResponseData?.code,
        success: benepikResponseData?.success,
        message: benepikResponseData?.message,
      });

      return NextResponse.json(
        {
          error: 'Reward processing failed',
          details: {
            code: benepikResponseData?.code,
            message: benepikResponseData?.message,
            batchResponse: benepikResponseData?.batchResponse,
          },
        },
        { status: 400 }
      );
    }

    // 6. Update all reports with transaction IDs
    const updatePromises = reports.map((report, index) => {
      return prisma.spotIncentiveReport.update({
        where: { id: report.id },
        data: {
          spotincentivepaidAt: new Date(),
          transactionId: benepikData[index].transactionId,
          transactionMetadata: {
            payload: benepikData[index],
            benepikResponse: benepikResponse.data,
            sentAt: new Date().toISOString(),
          },
        },
      });
    });

    await Promise.all(updatePromises);

    console.log(`✅ Successfully processed ${reports.length} reward(s)`);

    return NextResponse.json({
      success: true,
      message: `Rewards sent successfully for ${reports.length} report(s)`,
      data: {
        processed: reports.length,
        benepikResponse: benepikResponse.data,
        transactionIds: benepikData.map(d => d.transactionId),
      },
    });

  } catch (error: any) {
    console.error('❌ Error sending rewards:', error.message);
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      console.error('Benepik API Error:', {
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
