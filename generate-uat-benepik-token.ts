import jwt from 'jsonwebtoken';

/**
 * Generate UAT Benepik Token
 * Run: npx ts-node generate-uat-benepik-token.ts
 */

const UAT_TOKEN_SECRET = process.env.UAT_TOKEN_SECRET||"Kf7A9mQ2ZrB6xD5P";
console.log
('UAT_TOKEN_SECRET', UAT_TOKEN_SECRET);
const UAT_CLIENT_ID = process.env.UAT_CLIENT_ID;

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
