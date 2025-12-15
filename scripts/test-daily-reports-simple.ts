import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function testDailyReportsSimple() {
  try {
    console.log('🧪 Simple Daily Reports Import Test\n');

    // Step 1: Get sample data from database
    console.log('📋 Getting sample data from database...');
    
    const stores = await prisma.store.findMany({ take: 3 });
    const samsungSKUs = await prisma.samsungSKU.findMany({ take: 3 });
    const plans = await prisma.plan.findMany({ take: 3 });

    console.log(`Found: ${stores.length} stores, ${samsungSKUs.length} SKUs, ${plans.length} plans`);

    if (stores.length === 0 || samsungSKUs.length === 0 || plans.length === 0) {
      console.log('❌ Missing required data in database');
      console.log('Please ensure you have stores, Samsung SKUs, and plans in your database');
      return;
    }

    // Step 2: Display sample data for manual testing
    console.log('\n📝 Sample data for manual CSV creation:');
    console.log('Store IDs:', stores.map(s => s.id));
    console.log('Samsung SKU IDs:', samsungSKUs.map(s => s.id));
    console.log('Plan IDs:', plans.map(p => p.id));

    // Step 3: Create a test CSV with real IDs
    const csvContent = `Store ID,Samsung SKU ID,Plan ID,IMEI,Date of Sale
${stores[0].id},${samsungSKUs[0].id},${plans[0].id},123456789012345,01-01-2024
${stores[0].id},${samsungSKUs[0].id},${plans[0].id},123456789012346,02-01-2024
${stores[0].id},${samsungSKUs[0].id},${plans[0].id},123456789012347,03-01-2024`;

    fs.writeFileSync('test_daily_reports_real_ids.csv', csvContent);
    console.log('\n✅ Created test CSV: test_daily_reports_real_ids.csv');
    console.log('You can use this file to test the import functionality in the web interface');

    // Step 4: Test database constraints
    console.log('\n🔍 Testing database constraints...');
    
    // Clean up any existing test data
    await prisma.dailyIncentiveReport.deleteMany({
      where: {
        imei: { in: ['123456789012345', '123456789012346', '123456789012347'] }
      }
    });

    // Test creating a record
    try {
      const testRecord = await prisma.dailyIncentiveReport.create({
        data: {
          secId: null,
          storeId: stores[0].id,
          samsungSKUId: samsungSKUs[0].id,
          planId: plans[0].id,
          imei: '123456789012345',
          Date_of_sale: new Date('2024-01-01'),
          metadata: null
        }
      });
      console.log('✅ Successfully created test record:', testRecord.id);

      // Test duplicate IMEI
      try {
        await prisma.dailyIncentiveReport.create({
          data: {
            secId: null,
            storeId: stores[0].id,
            samsungSKUId: samsungSKUs[0].id,
            planId: plans[0].id,
            imei: '123456789012345', // Same IMEI
            Date_of_sale: new Date('2024-01-02'),
            metadata: null
          }
        });
        console.log('❌ Duplicate IMEI was allowed - constraint not working!');
      } catch (error) {
        console.log('✅ Duplicate IMEI correctly rejected');
      }

      // Clean up
      await prisma.dailyIncentiveReport.delete({
        where: { id: testRecord.id }
      });
      console.log('✅ Cleaned up test record');

    } catch (error) {
      console.log('❌ Failed to create test record:', error);
    }

    // Step 5: Instructions for manual testing
    console.log('\n📋 Manual Testing Instructions:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Go to: http://localhost:3003/Zopper-Administrator/import-daily-reports');
    console.log('3. Upload the file: test_daily_reports_real_ids.csv');
    console.log('4. Check the results');
    console.log('\n💡 Note: You need to be logged in as a ZOPPER_ADMINISTRATOR to access the import feature');

    console.log('\n🎉 Simple test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDailyReportsSimple();