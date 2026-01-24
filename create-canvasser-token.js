const jwt = require('jsonwebtoken');

// Get from environment or use defaults
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'eyJ4A9kLmP7qT9sK2wF3zP8dR0uV6xY2';
const PROJECT_ID = process.env.PROJECT_ID || 'godrej-mitra';
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Get phone number from command line argument or use default
const phoneNumber = '7408108617';

if (!phoneNumber || phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
  console.error('❌ Invalid phone number. Please provide a 10-digit phone number.');
  console.error('Usage: node create-canvasser-token.js <10-digit-phone>');
  process.exit(1);
}

const accessPayload = {
  canvasserId: phoneNumber,
  role: 'CANVASSER',
  projectId: PROJECT_ID,
};

const refreshPayload = {
  canvasserId: phoneNumber,
  role: 'CANVASSER',
  projectId: PROJECT_ID,
};

const accessToken = jwt.sign(accessPayload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
const refreshToken = jwt.sign(refreshPayload, ACCESS_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_TTL_SECONDS });

console.log('\n✅ Canvasser Token Created Successfully\n');
console.log('Phone Number:', phoneNumber);
console.log('\n📋 Access Token (15 minutes):');
console.log(accessToken);
console.log('\n📋 Refresh Token (7 days):');
console.log(refreshToken);
console.log('\n📦 Payload:');
console.log(JSON.stringify(accessPayload, null, 2));
console.log('\n💡 To use in browser console:');
console.log(`localStorage.setItem('access_token', '${accessToken}');`);
console.log(`localStorage.setItem('refresh_token', '${refreshToken}');`);
console.log('\n');
