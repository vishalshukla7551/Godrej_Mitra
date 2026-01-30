const crypto = require('crypto');

/**
 * Test script for Benepik webhook
 * Sends a REWARD_PROCESSED webhook payload with HMAC signature verification
 * 
 * Usage:
 * node test-benepik-webhook.js
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

  // Get webhook secret from environment
  const webhookSecret = 'Yh73@8Jsk#28!dfjWm91zPqL7v6$Bnq02XakNfVp';
  if (!webhookSecret) {
    console.error('❌ BENEPIK_WEBHOOK_SECRET not set in environment');
    console.log('Make sure it is set in your .env file');
    process.exit(1);
  }

  console.log('🔐 Webhook Secret loaded:', webhookSecret.substring(0, 10) + '...');

  // Generate HMAC signature
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  console.log('\n📨 Webhook Test Payload:');
  console.log('Event Type:', payload.eventType);
  console.log('Transaction ID:', payload.rewardTransactionDetails[0].transactionId);
  console.log('Reward Amount:', payload.rewardTransactionDetails[0].rewardAmount);
  console.log('\n🔐 HMAC Signature:', signature);
  console.log('\n📤 Sending webhook to https://salesmitr.com/api/webhooks/benepik');

  try {
    // Send webhook to local server
    const response = await fetch('https://salesmitr.com/api/webhooks/benepik', {
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
      console.log('Status:', response.status);
      console.log('Error:', result.error);
      if (result.details) {
        console.log('Details:', result.details);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error sending webhook:', error.message);
    console.log('\nMake sure:');
    console.log('1. Your Next.js server is running on http://localhost:3000');
    console.log('2. BENEPIK_WEBHOOK_SECRET is set in .env');
    console.log('3. Transaction ID TXN-1769597054758 exists in database');
    process.exit(1);
  }
}

// Run the test
testBenepikWebhook();
