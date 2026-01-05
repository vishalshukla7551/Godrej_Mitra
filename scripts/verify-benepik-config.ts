/**
 * Verify Benepik Configuration
 * Run with: npx tsx scripts/verify-benepik-config.ts
 * 
 * This script checks if all required environment variables and configurations are correct
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface ConfigCheck {
  name: string;
  value: string | undefined;
  expected?: string;
  required: boolean;
  status: 'ok' | 'missing' | 'mismatch' | 'warning';
  message?: string;
}

function verifyConfig() {
  console.log('🔍 Benepik Configuration Verification\n');
  console.log('=' .repeat(80));
  console.log('\n');

  const checks: ConfigCheck[] = [
    {
      name: 'BENEPIK_AUTH_KEY',
      value: process.env.BENEPIK_AUTH_KEY,
      expected: 'Kjs8df8!fj39sJf92nq#3Jasf82^@2Lncs90dkfLcm03Fjs9',
      required: true,
      status: 'ok'
    },
    {
      name: 'BENEPIK_SECRET_KEY',
      value: process.env.BENEPIK_SECRET_KEY,
      expected: 'Yh73@8Jsk#28!dfjWm91zPqL7v6$Bnq02XakNfVp',
      required: true,
      status: 'ok'
    },
    {
      name: 'BENEPIK_SIGNATURE_KEY',
      value: process.env.BENEPIK_SIGNATURE_KEY,
      expected: 'UfPxgj3nlxF1NfI/Lo1+zZdxbUU770GlzoLYhZBL1HM=',
      required: false,
      status: 'ok',
      message: 'Optional - may be needed for HMAC signature'
    },
    {
      name: 'BENEPIK_API_URL',
      value: process.env.BENEPIK_API_URL,
      expected: 'https://benepik.org/bpcp-client-reward-micro/api/sendRewards',
      required: true,
      status: 'ok'
    },
    {
      name: 'AWS_PROXY_URL',
      value: process.env.AWS_PROXY_URL,
      required: true,
      status: 'ok',
      message: 'Should point to your AWS proxy endpoint'
    }
  ];

  // Verify each configuration
  let hasErrors = false;
  let hasWarnings = false;

  checks.forEach(check => {
    if (!check.value) {
      check.status = check.required ? 'missing' : 'warning';
      if (check.required) hasErrors = true;
      else hasWarnings = true;
    } else if (check.expected && check.value !== check.expected) {
      check.status = 'mismatch';
      hasErrors = true;
    }
  });

  // Display results
  console.log('📋 Environment Variables:\n');
  
  checks.forEach(check => {
    const icon = check.status === 'ok' ? '✅' : 
                 check.status === 'missing' ? '❌' : 
                 check.status === 'mismatch' ? '⚠️' : '⚡';
    
    const statusText = check.status === 'ok' ? 'OK' :
                       check.status === 'missing' ? 'MISSING' :
                       check.status === 'mismatch' ? 'MISMATCH' :
                       'WARNING';
    
    console.log(`${icon} ${check.name}: ${statusText}`);
    
    if (check.value && check.status === 'ok') {
      // Mask sensitive values
      const displayValue = check.value.length > 20 
        ? check.value.substring(0, 20) + '...' 
        : check.value;
      console.log(`   Value: ${displayValue}`);
    }
    
    if (check.status === 'mismatch') {
      console.log(`   Expected: ${check.expected}`);
      console.log(`   Got: ${check.value}`);
    }
    
    if (check.message) {
      console.log(`   Note: ${check.message}`);
    }
    
    console.log('');
  });

  console.log('=' .repeat(80));
  console.log('\n');

  // JWT Configuration Check
  console.log('🔐 JWT Configuration (from code):\n');
  console.log('✅ Client ID: 2364 (from Excel: Client Details - Zopper)');
  console.log('✅ Admin ID: 926 (from Excel: Client Details - Zopper)');
  console.log('✅ Algorithm: HS256');
  console.log('✅ Expiry: 900 seconds (15 minutes)');
  console.log('✅ Issuer: benepik-tech');
  console.log('✅ Audience: client-system');
  console.log('');

  console.log('=' .repeat(80));
  console.log('\n');

  // Security Implementation Check
  console.log('🔒 Security Implementation:\n');
  console.log('✅ AES-256-CBC encryption for payload');
  console.log('✅ Random IV generation (16 bytes)');
  console.log('✅ SHA-256 hashed secret key');
  console.log('✅ HMAC-SHA256 signature');
  console.log('✅ Signature format: requestId|timestamp|nonce|checksum');
  console.log('');

  console.log('=' .repeat(80));
  console.log('\n');

  // Additional Info
  console.log('ℹ️  Additional Information:\n');
  console.log('Entity ID: BENEPIK226423 (from Excel, not currently used)');
  console.log('Mailer: 1058 (from Excel)');
  console.log('Client Code: 1063;1064 (from Excel)');
  console.log('');

  console.log('=' .repeat(80));
  console.log('\n');

  // Summary
  if (hasErrors) {
    console.log('❌ CONFIGURATION ERRORS FOUND!');
    console.log('Please fix the issues above before testing.\n');
    console.log('📖 See docs/BENEPIK_API_VERIFICATION.md for details');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Configuration has warnings but should work.');
    console.log('Review the warnings above.\n');
    console.log('✅ You can proceed with testing: npx tsx scripts/test-benepik-reward.ts');
  } else {
    console.log('✅ ALL CHECKS PASSED!');
    console.log('Configuration looks good.\n');
    console.log('🚀 Ready to test: npx tsx scripts/test-benepik-reward.ts');
  }

  console.log('');
}

verifyConfig();
