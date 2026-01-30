import crypto from 'crypto';

/**
 * Test script for Benepik webhook
 * Sends a REWARD_REJECTED webhook payload with HMAC signature verification
 */

async function testBenepikWebhook() {
  // Webhook payload
  const payload = {
    success: 0,
    clientId: '872',
    entityId: '1870',
    eventType: 'REWARD_REJECTED',
    processedAt: 1765451360,
    totalRewardAmount: 100000000000,
    transactionStatus: 'FAILED',
    rewardTransactionDetails: [
      {
        rewardAmount: '12',
        transactionId: 'TXN-1769601725368',
        disbursedAmount: 0,
      },
    ],
    transactionFailureReason: 'Rewards Rejected',
  };

  // Convert payload to JSON string
  const rawBody = JSON.stringify(payload);

  // Get webhook secret from environment
  const webhookSecret = process.env.BENEPIK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('❌ BENEPIK_WEBHOOK_SECRET not set in environment');
    console.log('Set it with: export BENEPIK_WEBHOOK_SECRET="your-secret-key"');
    process.exit(1);
  }

  // Generate HMAC signature
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  console.log('📨 Webhook Test Payload:');
  console.log('Transaction ID:', payload.rewardTransactionDetails[0].transactionId);
  console.log('Event Type:', payload.eventType);
  console.log('Reward Amount:', payload.rewardTransactionDetails[0].rewardAmount);
  console.log('\n🔐 HMAC Signature:', signature);
  console.log('\n📤 Sending webhook...\n');

  try {
    // Send webhook to local server
    const response = await fetch('http://localhost:3000/api/webhooks/benepik', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Benepik-Signature': signature,
      },
      body: rawBody,
    });

    const result = await response.json();

    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Body:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Webhook test successful!');
    } else {
      console.log('\n❌ Webhook test failed!');
    }
  } catch (error) {
    console.error('❌ Error sending webhook:', error);
    console.log('\nMake sure your server is running on http://localhost:3000');
  }
}

// Run the test
testBenepikWebhook();
