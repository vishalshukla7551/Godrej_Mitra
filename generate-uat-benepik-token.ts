import jwt from 'jsonwebtoken';

/**
 * Generate UAT Benepik Token
 * Run: npx ts-node generate-uat-benepik-token.ts
 */

const UAT_TOKEN_SECRET = process.env.UAT_TOKEN_SECRET || 'eyJ4A9kLmP7qT9sK2wF3zP8dR0uV6xY4';
const UAT_CLIENT_ID = process.env.UAT_CLIENT_ID || 'benepik-uat-client';

const payload = {
  clientId: UAT_CLIENT_ID,
};

const token = jwt.sign(payload, UAT_TOKEN_SECRET, { expiresIn: '365d' });

console.log('✅ UAT Benepik Token Generated:');
console.log('================================');
console.log(token);
console.log('================================');
console.log('\nAdd this to your .env file:');
console.log(`UAT_BENEPIK_TOKEN=${token}`);
