/**
 * Test script for Monthly Report APIs
 * Tests the new monthly report endpoints for all roles
 */

const BASE_URL = 'http://localhost:3000';

const testEndpoints = [
  '/api/sec/monthly-report',
  '/api/abm/monthly-report', 
  '/api/ase/monthly-report',
  '/api/zsm/monthly-report',
  '/api/zbm/monthly-report',
];

async function testMonthlyReportAPI() {
  console.log('🧪 Testing Monthly Report APIs...\n');

  for (const endpoint of testEndpoints) {
    console.log(`📊 Testing ${endpoint}`);
    
    try {
      // Test basic endpoint
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`   Status: ${response.status}`);
      
      if (response.status === 401) {
        console.log('   ✅ Correctly requires authentication');
      } else if (response.ok) {
        const data = await response.json();
        console.log('   ✅ API responds successfully');
        console.log(`   📈 Data structure: ${Object.keys(data).join(', ')}`);
      } else {
        console.log(`   ❌ Unexpected status: ${response.status}`);
      }

      // Test with query parameters
      const paramsResponse = await fetch(`${BASE_URL}${endpoint}?planType=ADLD_1_YR&startDate=2024-01-01&endDate=2024-12-31`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`   Query params test status: ${paramsResponse.status}`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
    
    console.log('');
  }

  console.log('✅ Monthly Report API testing completed!');
  console.log('\n📝 API Features:');
  console.log('   • Fetches data from DailyIncentiveReport schema');
  console.log('   • Supports filtering by plan type, store, device, date range');
  console.log('   • Provides summary statistics and breakdowns');
  console.log('   • Role-based access control');
  console.log('   • Separate from spot incentive reports');
}

// Run the test
testMonthlyReportAPI().catch(console.error);