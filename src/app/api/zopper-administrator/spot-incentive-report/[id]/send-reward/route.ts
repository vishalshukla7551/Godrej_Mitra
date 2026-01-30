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

    // 6. Validate top-level response
    // Top-level code 1000 means request was processed (not necessarily reward succeeded)
    const benepikResponseData = benepikResponse.data?.data || benepikResponse.data;
    
    if (benepikResponse.status !== 200 || benepikResponseData?.code !== 1000) {
      console.error('❌ Benepik API returned error response:', {
        status: benepikResponse.status,
        code: benepikResponseData?.code,
        message: benepikResponseData?.message,
      });

      return NextResponse.json(
        {
          error: 'Benepik API request failed',
          details: {
            code: benepikResponseData?.code,
            message: benepikResponseData?.message,
            batchResponse: benepikResponseData?.batchResponse,
          },
        },
        { status: 400 }
      );
    }

    // 7. Check individual batch response for this reward
    const batchResponse = benepikResponseData?.batchResponse?.[0];
    
    if (!batchResponse) {
      console.error('❌ No batch response received from Benepik');
      return NextResponse.json(
        {
          error: 'Invalid Benepik response format',
          message: 'No batch response data received',
        },
        { status: 400 }
      );
    }

    // Check individual reward processing status
    const rewardProcessed = batchResponse.code === 1000 && batchResponse.success === 1;
    const isInsufficientBalance = batchResponse.code === 1012 && batchResponse.success === 0;
    
    if (!rewardProcessed && !isInsufficientBalance) {
      console.error('❌ Individual reward processing failed:', {
        code: batchResponse.code,
        success: batchResponse.success,
        message: batchResponse.message,
      });

      return NextResponse.json(
        {
          error: 'Reward processing failed',
          code: batchResponse.code,
          message: batchResponse.message,
          details: {
            batchResponse: batchResponse,
            benepikResponse: benepikResponse.data,
          },
        },
        { status: 400 }
      );
    }

    // 8. Update report with transaction ID
    const txnId = batchResponse.txns?.[0]?.transactionId || rewardPayload.data[0].transactionId;
    
    // For code 1012 (insufficient balance), mark as pending - will retry when balance is added
    const updateData: any = {
      transactionId: txnId,
      transactionMetadata: {
        payload: rewardPayload.data[0],
        benepikResponse: benepikResponse.data,
        sentAt: new Date().toISOString(),
        status: rewardProcessed ? 'SUCCESS' : 'PENDING_BALANCE', // PENDING_BALANCE for code 1012
      },
    };

    // Only set spotincentivepaidAt if reward was actually processed
    if (rewardProcessed) {
      updateData.spotincentivepaidAt = new Date();
    }
    
    await prisma.spotIncentiveReport.update({
      where: { id: reportId },
      data: updateData,
    });

    // Return appropriate response based on status
    if (isInsufficientBalance) {
      return NextResponse.json({
        success: false,
        message: 'Reward processing pending - Insufficient balance',
        code: 1012,
        data: {
          transactionId: txnId,
          canvasserPhone: mobileNumber,
          rewardAmount,
          status: 'PENDING_BALANCE',
          reason: batchResponse.message,
        },
      }, { status: 202 }); // 202 Accepted - processing pending
    }

    return NextResponse.json({
      success: true,
      message: 'Reward sent successfully',
      data: {
        transactionId: txnId,
        canvasserPhone: mobileNumber,
        rewardAmount,
        status: 'SUCCESS',
      },
    });

  } catch (error: any) {
    console.error('❌ Error sending reward:', error.message);
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

      return NextResponse.json(
        {
          error: 'Benepik API error',
          code: data?.code || status,
          message: data?.message || 'Unknown error',
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
