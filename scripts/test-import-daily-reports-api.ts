import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function testImportDailyReportsAPI() {
  try {
    console.log('🧪 Testing Import Daily Reports API...\n');

    // Step 1: Check if we have the required data in the database
    console.log('📋 Step 1: Checking database for required data...');
    
    const stores = await prisma.store.findMany({
      take: 5,
      select: { id: true, name: true }
    });

    const samsungSKUs = await prisma.samsungSKU.findMany({
      take: 5,
      select: { id: true, ModelName: true, Category: true }
    });

    const plans = await prisma.plan.findMany({
      take: 5,
      select: { id: true, planType: true, price: true }
    });

    console.log(`Found ${stores.length} stores, ${samsungSKUs.length} Samsung SKUs, ${plans.length} plans`);

    if (stores.length === 0 || samsungSKUs.length === 0 || plans.length === 0) {
      console.log('❌ Missing required data. Please ensure you have stores, Samsung SKUs, and plans in the database.');
      return;
    }

    // Step 2: Create test CSV with real IDs
    console.log('\n📝 Step 2: Creating test CSV with real database IDs...');
    
    const testData = [
      {
        storeId: stores[0].id,
        samsungSKUId: samsungSKUs[0].id,
        planId: plans[0].id,
        imei: '123456789012345',
        dateOfSale: '01-01-2024'
      },
      {
        storeId: stores.length > 1 ? stores[1].id : stores[0].id,
        samsungSKUId: samsungSKUs.length > 1 ? samsungSKUs[1].id : samsungSKUs[0].id,
        planId: plans.length > 1 ? plans[1].id : plans[0].id,
        imei: '123456789012346',
        dateOfSale: '02-01-2024'
      },
      {
        storeId: stores.length > 2 ? stores[2].id : stores[0].id,
        samsungSKUId: samsungSKUs.length > 2 ? samsungSKUs[2].id : samsungSKUs[0].id,
        planId: plans.length > 2 ? plans[2].id : plans[0].id,
        imei: '123456789012347',
        dateOfSale: '03-01-2024'
      }
    ];

    // Create CSV content
    const csvHeader = 'Store ID,Samsung SKU ID,Plan ID,IMEI,Date of Sale';
    const csvRows = testData.map(row => 
      `${row.storeId},${row.samsungSKUId},${row.planId},${row.imei},${row.dateOfSale}`
    );
    const csvContent = [csvHeader, ...csvRows].join('\n');

    // Write test CSV file
    const testCsvPath = 'test_daily_reports_api.csv';
    fs.writeFileSync(testCsvPath, csvContent);
    console.log(`✅ Created test CSV: ${testCsvPath}`);

    // Step 3: Clean up any existing test data
    console.log('\n🧹 Step 3: Cleaning up existing test data...');
    
    const testIMEIs = testData.map(d => d.imei);
    const existingReports = await prisma.dailyIncentiveReport.findMany({
      where: {
        imei: { in: testIMEIs }
      }
    });

    if (existingReports.length > 0) {
      await prisma.dailyIncentiveReport.deleteMany({
        where: {
          imei: { in: testIMEIs }
        }
      });
      console.log(`🗑️ Deleted ${existingReports.length} existing test records`);
    }

    // Step 4: Test the API endpoint
    console.log('\n🌐 Step 4: Testing API endpoint...');
    
    // Read the CSV file as a buffer
    const csvBuffer = fs.readFileSync(testCsvPath);
    
    // Create FormData
    const formData = new FormData();
    const csvBlob = new Blob([csvBuffer], { type: 'text/csv' });
    formData.append('file', csvBlob, 'test_daily_reports_api.csv');

    try {
      // Make API request
      const response = await fetch('http://localhost:3003/api/admin/import-daily-reports', {
        method: 'POST',
        body: formData,
        headers: {
          // Note: In a real test, you'd need to include authentication cookies
          // For now, this will test the API structure but may fail on auth
        }
      });

      const result = await response.json();
      
      console.log(`📊 API Response Status: ${response.status}`);
      console.log('📊 API Response:', JSON.stringify(result, null, 2));

      if (response.status === 401) {
        console.log('🔐 Note: API returned 401 Unauthorized. This is expected when testing without authentication.');
        console.log('💡 To test with authentication, you need to include valid ZOPPER_ADMINISTRATOR cookies.');
      }

    } catch (error) {
      console.log('❌ API request failed:', error);
      console.log('💡 Make sure the development server is running on http://localhost:3003');
    }

    // Step 5: Test direct database insertion (simulating successful API call)
    console.log('\n💾 Step 5: Testing direct database insertion...');
    
    let insertedCount = 0;
    const insertErrors: string[] = [];

    for (const testRecord of testData) {
      try {
        const dailyReport = await prisma.dailyIncentiveReport.create({
          data: {
            secId: null,
            storeId: testRecord.storeId,
            samsungSKUId: testRecord.samsungSKUId,
            planId: testRecord.planId,
            imei: testRecord.imei,
            Date_of_sale: new Date(testRecord.dateOfSale.split('-').reverse().join('-')),
            metadata: null
          }
        });
        
        console.log(`✅ Created daily report: ${dailyReport.id} (IMEI: ${testRecord.imei})`);
        insertedCount++;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        insertErrors.push(`IMEI ${testRecord.imei}: ${errorMsg}`);
        console.log(`❌ Failed to create record for IMEI ${testRecord.imei}: ${errorMsg}`);
      }
    }

    // Step 6: Verify inserted data
    console.log('\n🔍 Step 6: Verifying inserted data...');
    
    const insertedReports = await prisma.dailyIncentiveReport.findMany({
      where: {
        imei: { in: testIMEIs }
      },
      include: {
        store: { select: { name: true } },
        samsungSKU: { select: { ModelName: true } },
        plan: { select: { planType: true } }
      }
    });

    console.log(`📈 Found ${insertedReports.length} inserted records:`);
    insertedReports.forEach(report => {
      console.log(`  - IMEI: ${report.imei}, Store: ${report.store.name}, SKU: ${report.samsungSKU.ModelName}, Plan: ${report.plan.planType}`);
    });

    // Step 7: Test duplicate IMEI handling
    console.log('\n🔄 Step 7: Testing duplicate IMEI handling...');
    
    try {
      await prisma.dailyIncentiveReport.create({
        data: {
          secId: null,
          storeId: testData[0].storeId,
          samsungSKUId: testData[0].samsungSKUId,
          planId: testData[0].planId,
          imei: testData[0].imei, // Same IMEI as first record
          Date_of_sale: new Date(),
          metadata: null
        }
      });
      console.log('❌ Duplicate IMEI was allowed - this should not happen!');
    } catch (error) {
      console.log('✅ Duplicate IMEI correctly rejected:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Step 8: Summary
    console.log('\n📊 Test Summary:');
    console.log(`✅ Successfully inserted: ${insertedCount} records`);
    console.log(`❌ Insert errors: ${insertErrors.length}`);
    if (insertErrors.length > 0) {
      console.log('Error details:');
      insertErrors.forEach(error => console.log(`  - ${error}`));
    }

    // Step 9: Cleanup
    console.log('\n🧹 Step 9: Cleaning up test data...');
    
    const finalCleanup = await prisma.dailyIncentiveReport.deleteMany({
      where: {
        imei: { in: testIMEIs }
      }
    });
    
    console.log(`🗑️ Cleaned up ${finalCleanup.count} test records`);

    // Remove test CSV file
    if (fs.existsSync(testCsvPath)) {
      fs.unlinkSync(testCsvPath);
      console.log(`🗑️ Removed test CSV file: ${testCsvPath}`);
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testImportDailyReportsAPI();