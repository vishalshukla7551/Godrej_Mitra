const fs = require('fs');
const { execSync } = require('child_process');

try {
  console.log('Removing conflicted package-lock.json...');
  if (fs.existsSync('package-lock.json')) {
    fs.unlinkSync('package-lock.json');
  }
  
  console.log('Regenerating package-lock.json...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('Package-lock.json regenerated successfully!');
} catch (error) {
  console.error('Error:', error.message);
}