const crypto = require('crypto');

/**
 * Test script for Benepik webhook
 * Sends a REWARD_PROCESSED webhook payload with HMAC signature verification
 * 
 * Usage:
 * BENEPIK_WEBHOOK_SECRET="your-secret" node test-benepik-webhook.js
 */

async function testBenepikWebhook() {
  // Webhook payload - REWARD_PROCESSED
  const payload = {
    success: 1,
    clientId: '872',
    entityId: '1886',
    eventType: 'REWARD_PROCESSED',
    processedAt: 1765790642,
    totalRewardAmount: 1,
    transactionStatus: 'SUCCESS',
    rewardTransactionDetails: [
      {
        rewardAmount: '1',
        transactionId: 'TXN-1769597054758',
        disbursedAmount: '1',
      },
    ],
    transactionFailureReason: '',
  };

  // Convert payload to JSON string
  const rawBody = JSON.stringify(payload);

  //Get webhook secret from environment
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
  console.log('Event Type:', payload.eventType);
  console.log('Transaction ID:', payload.rewardTransactionDetails[0].transactionId);
  console.log('Reward Amount:', payload.rewardTransactionDetails[0].rewardAmount);
  console.log('Disburse Amount:', payload.rewardTransactionDetails[0].disbursedAmount);
  console.log('\n🔐 HMAC Signature:', signature);
  console.log('\n📤 Sending webhook to http://localhost:3000/api/webhooks/benepik\n');

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
      console.log('Transaction should now be marked as PAID in the database');
      process.exit(0);
    } else {
      console.log('\n❌ Webhook test failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error sending webhook:', error.message);
    console.log('\nMake sure your server is running on http://localhost:3000');
    process.exit(1);
  }
}

// Run the test
testBenepikWebhook();
