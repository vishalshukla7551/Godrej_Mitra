import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * POST /api/webhooks/benepik
 * Handle Benepik webhook events for reward processing
 * 
 * Webhook Events:
 * - REWARD_PROCESSED: Reward approved and successfully processed
 * - REWARD_REJECTED: Reward rejected from admin panel
 * - INSUFFICIENT_FUNDS: Cost centre does not have sufficient balance
 * - REWARD_VALIDATION_FAILED: Reward request fails validation checks
 */
export async function POST(req: NextRequest) {
  try {
    // Get the raw body for HMAC verification
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    // Get HMAC signature from header
    const signature = req.headers.get('X-Benepik-Signature');
    if (!signature) {
      console.error('❌ Missing X-Benepik-Signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      );
    }
    // Verify HMAC signature
    const webhookSecret = process.env.BENEPIK_WEBHOOK_SECRET;
    console.log("webhookSecret full:", webhookSecret);
    console.log("webhookSecret length:", webhookSecret?.length);
    console.log("webhookSecret chars:", webhookSecret?.split('').map((c, i) => `${i}:${c}`).join(', '));
    if (!webhookSecret) {
      console.error('❌ BENEPIK_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid HMAC signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('✅ HMAC signature verified');
    console.log('📨 Webhook Event:', payload.eventType);

    const { eventType, rewardTransactionDetails } = payload;

    // Find the transaction by transactionId
    if (!rewardTransactionDetails || rewardTransactionDetails.length === 0) {
      console.error('❌ No transaction details in payload');
      return NextResponse.json(
        { error: 'No transaction details' },
        { status: 400 }
      );
    }

    const transactionId = rewardTransactionDetails[0].transactionId;
    const rewardAmount = rewardTransactionDetails[0].rewardAmount;

    console.log(`🔍 Looking for transaction: ${transactionId}`);

    // Find report by transactionId
    const report = await prisma.spotIncentiveReport.findFirst({
      where: {
        transactionId: transactionId,
      },
    });

    if (!report) {
      console.warn(`⚠️  Report not found for transaction: ${transactionId}`);
      // Still return 200 to acknowledge receipt
      return NextResponse.json({
        success: true,
        message: 'Webhook received (report not found)',
      });
    }

    console.log(`📋 Found report: ${report.id}`);

    // Check if transaction is already successfully processed
    // Same logic as send-reward API: check batchResponse code and success
    const metadata = report.transactionMetadata as any;
    const benepikResponse = metadata?.benepikResponse as any;
    const existingBatchResponse = benepikResponse?.data?.batchResponse?.[0] || benepikResponse?.batchResponse?.[0];
    
    if (existingBatchResponse?.code === 1000 && existingBatchResponse?.success === 1) {
      console.warn(`⚠️  Transaction already successfully processed for ${report.id}`);
      return NextResponse.json({
        success: true,
        message: 'Webhook received (transaction already processed)',
        transactionId: transactionId,
        reportId: report.id,
      });
    }

    // Helper to safely get metadata values
    const getMetadataValue = (key: string, defaultValue: any = null) => {
      const metadata = report.transactionMetadata as any;
      return metadata?.[key] ?? defaultValue;
    };

    // Handle different event types
    switch (eventType) {
      case 'REWARD_PROCESSED': {
        // Case 1: Reward Approved - Update with success status
        console.log(`✅ Processing REWARD_PROCESSED for ${report.id}`);
        
        const updatedMetadata = {
          payload: getMetadataValue('payload'),
          benepikResponse: {
            success: true,
            data: {
              code: 1000,
              success: 1,
              message: 'Reward processed successfully',
              batchResponse: [
                {
                  code: 1000,
                  success: 1,
                  message: 'Reward processed successfully',
                  txns: [
                    {
                      transactionId: transactionId,
                      rewardAmount: rewardAmount,
                    },
                  ],
                },
              ],
            },
          },
          sentAt: getMetadataValue('sentAt'),
          status: 'SUCCESS',
          webhookProcessedAt: new Date().toISOString(),
          webhookEventType: eventType,
        };

        await prisma.spotIncentiveReport.update({
          where: { id: report.id },
          data: {
            spotincentivepaidAt: new Date(),
            transactionMetadata: updatedMetadata,
          },
        });

        console.log(`✅ Updated report ${report.id} with SUCCESS status`);
        break;
      }

      case 'REWARD_REJECTED': {
        // Case 2: Reward Rejected - Update batchResponse with rejection
        console.log(`❌ Processing REWARD_REJECTED for ${report.id}`);
        
        await prisma.spotIncentiveReport.update({
          where: { id: report.id },
          data: {
            transactionId: null,
            transactionMetadata: null,
            spotincentivepaidAt: null
          },
        });

        console.log(`✅ Updated report ${report.id} with REJECTED status`);
        break;
      }

      case 'INSUFFICIENT_FUNDS': {
        // Case 3: Insufficient Funds - Remove transactionId and transactionMetadata
        console.log(`⚠️  Processing INSUFFICIENT_FUNDS for ${report.id}`);
        
        // await prisma.spotIncentiveReport.update({
        //   where: { id: report.id },
        //   data: {
        //     transactionId: null,
        //     transactionMetadata: null,
        //   },
        // });

        console.log(`✅ Cleared transaction data for report ${report.id}`);
        break;
      }

      case 'REWARD_VALIDATION_FAILED': {
        // Case 4: Validation Failed - Remove transactionId and transactionMetadata
        console.log(`⚠️  Processing REWARD_VALIDATION_FAILED for ${report.id}`);
        
        // await prisma.spotIncentiveReport.update({
        //   where: { id: report.id },
        //   data: {
        //     transactionId: null,
        //     transactionMetadata: null,
        //   },
        // });

        console.log(`✅ Cleared transaction data for report ${report.id}`);
        break;
      }

      default:
        console.warn(`⚠️  Unknown event type: ${eventType}`);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Webhook processed: ${eventType}`,
      transactionId: transactionId,
      reportId: report.id,
    });

  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
