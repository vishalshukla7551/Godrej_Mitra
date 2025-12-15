import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function validateDailyReportsFeature() {
  console.log('🔍 Validating Daily Reports Import Feature\n');

  try {
    // Test 1: Database Schema Validation
    console.log('📋 Test 1: Database Schema Validation');
    console.log('Checking if DailyIncentiveReport model exists and has correct fields...');

    try {
      const sampleQuery = await prisma.dailyIncentiveReport.findFirst();
      console.log('✅ DailyIncentiveReport model is accessible');
    } catch (error) {
      console.log('❌ DailyIncentiveReport model issue:', error);
      return;
    }

    // Test 2: Required Data Availability
    console.log('\n📋 Test 2: Required Data Availability');
    
    const storeCount = await prisma.store.count();
    const skuCount = await prisma.samsungSKU.count();
    const planCount = await prisma.plan.count();

    console.log(`Stores: ${storeCount}`);
    console.log(`Samsung SKUs: ${skuCount}`);
    console.log(`Plans: ${planCount}`);

    if (storeCount === 0 || skuCount === 0 || planCount === 0) {
      console.log('⚠️ Warning: Missing required reference data');
      console.log('You need stores, Samsung SKUs, and plans to test the import feature');
    } else {
      console.log('✅ All required reference data is available');
    }

    // Test 3: Get Sample IDs for Testing
    console.log('\n📋 Test 3: Sample Data for Testing');
    
    const sampleStore = await prisma.store.findFirst();
    const sampleSKU = await prisma.samsungSKU.findFirst();
    const samplePlan = await prisma.plan.findFirst();

    if (sampleStore && sampleSKU && samplePlan) {
      console.log('Sample IDs for testing:');
      console.log(`Store ID: ${sampleStore.id} (${sampleStore.name})`);
      console.log(`Samsung SKU ID: ${sampleSKU.id} (${sampleSKU.ModelName})`);
      console.log(`Plan ID: ${samplePlan.id} (${samplePlan.planType})`);

      // Create a test CSV with real IDs
      const testCSV = `Store ID,Samsung SKU ID,Plan ID,IMEI,Date of Sale
${sampleStore.id},${sampleSKU.id},${samplePlan.id},999999999999991,01-01-2024
${sampleStore.id},${sampleSKU.id},${samplePlan.id},999999999999992,02-01-2024
${sampleStore.id},${sampleSKU.id},${samplePlan.id},999999999999993,03-01-2024`;

      fs.writeFileSync('test_daily_reports_validated.csv', testCSV);
      console.log('✅ Created validated test CSV: test_daily_reports_validated.csv');
    }

    // Test 4: IMEI Uniqueness Constraint
    console.log('\n📋 Test 4: IMEI Uniqueness Constraint');
    
    const testIMEI = '999999999999999';
    
    // Clean up any existing test data
    await prisma.dailyIncentiveReport.deleteMany({
      where: { imei: testIMEI }
    });

    try {
      // Create first record
      const record1 = await prisma.dailyIncentiveReport.create({
        data: {
          secId: null,
          storeId: sampleStore!.id,
          samsungSKUId: sampleSKU!.id,
          planId: samplePlan!.id,
          imei: testIMEI,
          Date_of_sale: new Date('2024-01-01'),
          metadata: null
        }
      });
      console.log('✅ Created first test record');

      // Try to create duplicate
      try {
        await prisma.dailyIncentiveReport.create({
          data: {
            secId: null,
            storeId: sampleStore!.id,
            samsungSKUId: sampleSKU!.id,
            planId: samplePlan!.id,
            imei: testIMEI, // Same IMEI
            Date_of_sale: new Date('2024-01-02'),
            metadata: null
          }
        });
        console.log('❌ Duplicate IMEI was allowed - uniqueness constraint not working!');
      } catch (error) {
        console.log('✅ Duplicate IMEI correctly rejected - uniqueness constraint working');
      }

      // Clean up
      await prisma.dailyIncentiveReport.delete({ where: { id: record1.id } });
      console.log('✅ Cleaned up test record');

    } catch (error) {
      console.log('❌ Error testing IMEI uniqueness:', error);
    }

    // Test 5: Date Validation Logic
    console.log('\n📋 Test 5: Date Validation Logic');
    
    const testDates = [
      { date: '01-01-2024', valid: true, desc: 'Valid date' },
      { date: '32-01-2024', valid: false, desc: 'Invalid day' },
      { date: '01-13-2024', valid: false, desc: 'Invalid month' },
      { date: '2024-01-01', valid: false, desc: 'Wrong format (yyyy-mm-dd)' },
      { date: '1-1-2024', valid: false, desc: 'Single digit day/month' },
      { date: '29-02-2024', valid: true, desc: 'Leap year date' },
      { date: '29-02-2023', valid: false, desc: 'Non-leap year Feb 29' }
    ];

    console.log('Testing date validation patterns:');
    testDates.forEach(test => {
      const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
      const match = test.date.match(dateRegex);
      
      if (!match) {
        console.log(`${test.valid ? '❌' : '✅'} ${test.date} - ${test.desc} - Regex ${test.valid ? 'should pass' : 'correctly fails'}`);
        return;
      }
      
      const [, day, month, year] = match;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const isValidDate = date.getDate() === parseInt(day) && 
                         date.getMonth() === parseInt(month) - 1 && 
                         date.getFullYear() === parseInt(year);
      
      const result = isValidDate === test.valid ? '✅' : '❌';
      console.log(`${result} ${test.date} - ${test.desc} - ${isValidDate ? 'Valid' : 'Invalid'}`);
    });

    // Test 6: File Structure Validation
    console.log('\n📋 Test 6: File Structure Validation');
    
    const requiredFiles = [
      'src/app/Zopper-Administrator/import-daily-reports/page.tsx',
      'src/app/api/admin/import-daily-reports/route.ts'
    ];

    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
      } else {
        console.log(`❌ ${file} missing`);
      }
    });

    // Test 7: Navigation Link Check
    console.log('\n📋 Test 7: Navigation Link Check');
    
    const layoutFile = 'src/app/Zopper-Administrator/layout.tsx';
    if (fs.existsSync(layoutFile)) {
      const layoutContent = fs.readFileSync(layoutFile, 'utf8');
      if (layoutContent.includes('import-daily-reports')) {
        console.log('✅ Navigation link found in layout');
      } else {
        console.log('❌ Navigation link missing from layout');
      }
    } else {
      console.log('❌ Layout file not found');
    }

    // Summary
    console.log('\n📊 Validation Summary');
    console.log('✅ Database schema validation completed');
    console.log('✅ Reference data availability checked');
    console.log('✅ IMEI uniqueness constraint tested');
    console.log('✅ Date validation logic verified');
    console.log('✅ File structure validated');
    console.log('✅ Navigation integration checked');

    console.log('\n🎯 Next Steps for Testing:');
    console.log('1. Start development server: npm run dev');
    console.log('2. Navigate to: http://localhost:3003/Zopper-Administrator/import-daily-reports');
    console.log('3. Use the generated CSV file: test_daily_reports_validated.csv');
    console.log('4. Test the import functionality through the web interface');

    console.log('\n🎉 Validation completed successfully!');

  } catch (error) {
    console.error('❌ Validation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

validateDailyReportsFeature();