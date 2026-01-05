/**
 * Test script for Benepik Reward API (via Vercel)
 * Run with: npx tsx scripts/test-benepik-reward.ts
 * 
 * This calls your Vercel app's API, which then calls AWS proxy, which calls Benepik
 * 
 * IMPORTANT: Before running this test:
 * 1. Ensure .env has correct credentials (see docs/BENEPIK_API_VERIFICATION.md)
 * 2. JWT clientId and adminId have been updated to 2364 and 926
 * 3. BENEPIK_API_URL is set in .env
 * 4. AWS proxy is deployed and running
 */

async function testBenepikReward() {
  // Change this to your Vercel app URL
  const VERCEL_URL = 'http://localhost:3000/api/rewards/send';
  // Or use production: https://your-app.vercel.app/api/rewards/send
  
  const payload = {
    userName: "Test User",
    mobileNumber: "9999999999",  // Use a test number
    rewardAmount: 1  // Start with ₹1 for testing
  };

  console.log('🚀 Testing Benepik Reward API via Vercel...\n');
  console.log('📤 Sending request to:', VERCEL_URL);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  console.log('\n⏳ Please wait...\n');
  console.log('Flow: Vercel → AWS Proxy → Benepik API\n');
  console.log('📋 Verification Status:');
  console.log('   ✅ JWT clientId: 2364 (updated from Excel)');
  console.log('   ✅ JWT adminId: 926 (updated from Excel)');
  console.log('   ✅ Auth Key: Kjs8df8!fj39sJf92nq#3Jasf82^@2Lncs90dkfLcm03Fjs9');
  console.log('   ✅ Secret Key: Yh73@8Jsk#28!dfjWm91zPqL7v6$Bnq02XakNfVp');
  console.log('   ✅ API URL: https://benepik.org/bpcp-client-reward-micro/api/sendRewards\n');

  try {
    const response = await fetch(VERCEL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ SUCCESS! Reward sent successfully!');
      console.log('📱 Check mobile number for SMS/WhatsApp');
      console.log('\n🎉 Full flow completed:');
      console.log('   Vercel ✓ → AWS Proxy ✓ → Benepik ✓ → User Phone ✓');
    } else {
      console.log('\n❌ FAILED:', data.error);
      console.log('\n🔍 Troubleshooting:');
      console.log('   1. Check AWS_PROXY_URL is set in Vercel env');
      console.log('   2. Verify AWS proxy is running');
      console.log('   3. Check AWS IP is whitelisted by Benepik');
      console.log('   4. Review Vercel deployment logs');
      console.log('   5. Verify BENEPIK_API_URL in AWS proxy .env');
      console.log('   6. Check if signature key should be used instead of secret key');
    }
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n🔍 Possible issues:');
    console.error('   - Vercel app is not deployed/running');
    console.error('   - Network connectivity issue');
    console.error('   - CORS issue (if calling from browser)');
    console.error('   - Check the URL is correct');
    console.error('   - Review docs/BENEPIK_API_VERIFICATION.md for setup');
  }
}

testBenepikReward();
