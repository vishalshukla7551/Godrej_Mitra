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

    // 5. Validate top-level response
    // Top-level code 1000 means request was processed (not necessarily all rewards succeeded)
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

    // 6. Process batch responses - check individual reward statuses
    const batchResponses = benepikResponseData?.batchResponse || [];
    
    if (!Array.isArray(batchResponses) || batchResponses.length === 0) {
      console.error('❌ No batch responses received from Benepik');
      return NextResponse.json(
        {
          error: 'Invalid Benepik response format',
          message: 'No batch response data received',
        },
        { status: 400 }
      );
    }

    // Map batch error codes to messages
    const batchErrorMessages: Record<number, string> = {
      1012: 'Insufficient Balance - Client does not have sufficient balance',
      1013: 'No Rewards to Process - Rewards already processed or none available',
      1050: 'Pending/Request Accept - Cannot reinitiate, request already in process',
      1009: 'Required Parameter Missing - One or more mandatory fields missing',
    };

    // Separate successful and failed rewards
    const successfulRewards: Array<{ reportId: string; batchResponse: any; txnId: string }> = [];
    const pendingRewards: Array<{ reportId: string; batchResponse: any; txnId: string; error: string }> = [];
    const failedRewards: Array<{ reportId: string; batchResponse: any; error: string }> = [];

    batchResponses.forEach((batchResp: any, index: number) => {
      const report = reports[index];
      const txnId = batchResp.txns?.[0]?.transactionId || benepikData[index].transactionId;
      
      if (batchResp.code === 1000 && batchResp.success === 1) {
        successfulRewards.push({
          reportId: report.id,
          batchResponse: batchResp,
          txnId: txnId,
        });
      } else if (batchResp.code === 1012 && batchResp.success === 0) {
        // Code 1012 = Insufficient Balance - treat as pending, not failed
        pendingRewards.push({
          reportId: report.id,
          batchResponse: batchResp,
          txnId: txnId,
          error: batchResp.message,
        });
      } else {
        failedRewards.push({
          reportId: report.id,
          batchResponse: batchResp,
          error: batchErrorMessages[batchResp.code] || batchResp.message,
        });
      }
    });

    console.log(`✅ Successful: ${successfulRewards.length}, ⏳ Pending: ${pendingRewards.length}, ❌ Failed: ${failedRewards.length}`);

    // 7. Update successfully processed reports
    const successUpdatePromises = successfulRewards.map((reward) => {
      const reportIndex = reports.findIndex(r => r.id === reward.reportId);
      return prisma.spotIncentiveReport.update({
        where: { id: reward.reportId },
        data: {
          spotincentivepaidAt: new Date(),
          transactionId: reward.txnId,
          transactionMetadata: {
            payload: benepikData[reportIndex],
            benepikResponse: benepikResponse.data,
            sentAt: new Date().toISOString(),
            status: 'SUCCESS',
          },
        },
      });
    });

    // Update pending balance reports (code 1012)
    const pendingUpdatePromises = pendingRewards.map((reward) => {
      const reportIndex = reports.findIndex(r => r.id === reward.reportId);
      return prisma.spotIncentiveReport.update({
        where: { id: reward.reportId },
        data: {
          transactionId: reward.txnId,
          transactionMetadata: {
            payload: benepikData[reportIndex],
            benepikResponse: benepikResponse.data,
            sentAt: new Date().toISOString(),
            status: 'PENDING_BALANCE',
          },
        },
      });
    });

    await Promise.all([...successUpdatePromises, ...pendingUpdatePromises]);

    // 8. Return response with successes, pending, and failures
    const hasFailures = failedRewards.length > 0;
    
    return NextResponse.json({
      success: !hasFailures,
      message: 
        failedRewards.length > 0
          ? `Partial success: ${successfulRewards.length} processed, ${pendingRewards.length} pending balance, ${failedRewards.length} failed`
          : pendingRewards.length > 0
          ? `${successfulRewards.length} processed, ${pendingRewards.length} pending balance (awaiting balance)`
          : `All ${successfulRewards.length} rewards sent successfully`,
      data: {
        processed: successfulRewards.length,
        pending: pendingRewards.length,
        failed: failedRewards.length,
        successfulRewards: successfulRewards.map(r => ({
          reportId: r.reportId,
          transactionId: r.txnId,
          status: 'SUCCESS',
        })),
        pendingRewards: pendingRewards.map(r => ({
          reportId: r.reportId,
          transactionId: r.txnId,
          status: 'PENDING_BALANCE',
          reason: r.error,
        })),
        failedRewards: failedRewards.map(r => ({
          reportId: r.reportId,
          code: r.batchResponse.code,
          error: r.error,
          message: r.batchResponse.message,
        })),
        benepikResponse: benepikResponse.data,
      },
    }, { status: hasFailures ? 207 : 200 });

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
