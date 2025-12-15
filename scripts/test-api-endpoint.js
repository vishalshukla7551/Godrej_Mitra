const fs = require('fs');
const path = require('path');

async function testAPIEndpoint() {
  try {
    console.log('🧪 Testing Import Daily Reports API Endpoint\n');

    // Check if test CSV exists
    const csvPath = 'test_daily_reports.csv';
    if (!fs.existsSync(csvPath)) {
      console.log('❌ Test CSV file not found:', csvPath);
      console.log('Please create a test CSV file first');
      return;
    }

    console.log('📁 Found test CSV file:', csvPath);
    
    // Read CSV content
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    console.log('📄 CSV Content:');
    console.log(csvContent);

    // Test API endpoint
    console.log('\n🌐 Testing API endpoint...');
    
    // Create form data
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(csvPath), {
      filename: 'test_daily_reports.csv',
      contentType: 'text/csv'
    });

    // Make request
    const fetch = require('node-fetch');
    
    try {
      const response = await fetch('http://localhost:3003/api/admin/import-daily-reports', {
        method: 'POST',
        body: form,
        headers: {
          ...form.getHeaders(),
          // Note: In production, you'd need authentication cookies here
        }
      });

      console.log('📊 Response Status:', response.status);
      console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.text();
      console.log('📊 Response Body:', result);

      // Try to parse as JSON
      try {
        const jsonResult = JSON.parse(result);
        console.log('📊 Parsed JSON Response:', JSON.stringify(jsonResult, null, 2));
      } catch (e) {
        console.log('📊 Response is not valid JSON');
      }

      if (response.status === 401) {
        console.log('\n🔐 Authentication Required');
        console.log('The API requires ZOPPER_ADMINISTRATOR authentication.');
        console.log('To test with authentication:');
        console.log('1. Log in to the web interface as a ZOPPER_ADMINISTRATOR');
        console.log('2. Use the browser\'s network tab to copy the cookies');
        console.log('3. Add those cookies to this test script');
      } else if (response.status === 200) {
        console.log('\n✅ API call successful!');
      } else {
        console.log('\n⚠️ API call returned status:', response.status);
      }

    } catch (error) {
      console.log('❌ API request failed:', error.message);
      console.log('\n💡 Troubleshooting:');
      console.log('1. Make sure the development server is running: npm run dev');
      console.log('2. Check if the server is running on http://localhost:3003');
      console.log('3. Verify the API route exists: src/app/api/admin/import-daily-reports/route.ts');
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Install required dependencies if not present
try {
  require('node-fetch');
  require('form-data');
} catch (error) {
  console.log('❌ Missing dependencies. Please install:');
  console.log('npm install node-fetch form-data');
  process.exit(1);
}

testAPIEndpoint();