const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = 'eyJ4A9kLmP7qT9sK2wF3zP8dR0uV6xY2';
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

const payload = {
  userId: null,
  canvasserId: null,
  secId: '695b8f61bca8b65e3b9b108a',
  role: 'SEC'
};

const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });

console.log('Access Token:');
console.log(token);
console.log('\nPayload:');
console.log(JSON.stringify(payload, null, 2));
