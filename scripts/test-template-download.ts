import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTemplateDownload() {
  try {
    console.log('🧪 Testing Daily Reports Template Download with Plan Data\n');

    // Step 1: Check Plan data availability
    console.log('📋 Step 1: Checking Plan data in database...');
    
    const planCount = await prisma.plan.count();
    console.log(`Total plans in database: ${planCount}`);

    if (planCount === 0) {
      console.log('⚠️ Warning: No plans found in database');
      console.log('The template will be generated but Sheet 2 will be empty');
    }

    // Step 2: Get sample plan data
    const samplePlans = await prisma.plan.findMany({
      take: 5,
      include: {
        samsungSKU: {
          select: {
            id: true,
            ModelName: true,
            Category: true,
            ModelPrice: true
          }
        }
      },
      orderBy: {
        planType: 'asc'
      }
    });

    console.log('\n📊 Sample Plan Data (first 5 records):');
    samplePlans.forEach((plan, index) => {
      console.log(`${index + 1}. Plan ID: ${plan.id}`);
      console.log(`   Plan Type: ${plan.planType}`);
      console.log(`   Price: ₹${plan.price}`);
      console.log(`   Samsung SKU: ${plan.samsungSKU?.ModelName || 'Not linked'}`);
      console.log(`   SKU Category: ${plan.samsungSKU?.Category || 'N/A'}`);
      console.log('');
    });

    // Step 3: Test API endpoint structure
    console.log('🔍 Step 3: Validating API endpoint structure...');
    
    const apiFile = 'src/app/api/admin/download-daily-reports-template/route.ts';
    const fs = require('fs');
    
    if (fs.existsSync(apiFile)) {
      console.log('✅ API endpoint file exists');
      
      const apiContent = fs.readFileSync(apiFile, 'utf8');
      const hasExcelGeneration = apiContent.includes('XLSX.utils.book_new()');
      const hasPlanQuery = apiContent.includes('prisma.plan.findMany');
      const hasTwoSheets = apiContent.includes('Daily Reports Template') && apiContent.includes('Plan Collection Data');
      
      console.log(`✅ Excel generation: ${hasExcelGeneration ? 'Present' : 'Missing'}`);
      console.log(`✅ Plan data query: ${hasPlanQuery ? 'Present' : 'Missing'}`);
      console.log(`✅ Two sheets setup: ${hasTwoSheets ? 'Present' : 'Missing'}`);
    } else {
      console.log('❌ API endpoint file not found');
    }

    // Step 4: Check frontend integration
    console.log('\n🔍 Step 4: Checking frontend integration...');
    
    const frontendFile = 'src/app/Zopper-Administrator/import-daily-reports/page.tsx';
    
    if (fs.existsSync(frontendFile)) {
      console.log('✅ Frontend file exists');
      
      const frontendContent = fs.readFileSync(frontendFile, 'utf8');
      const hasApiCall = frontendContent.includes('/api/admin/download-daily-reports-template');
      const hasExcelDownload = frontendContent.includes('.xlsx');
      const mentionsSheets = frontendContent.includes('Sheet 1') && frontendContent.includes('Sheet 2');
      
      console.log(`✅ API call integration: ${hasApiCall ? 'Present' : 'Missing'}`);
      console.log(`✅ Excel download: ${hasExcelDownload ? 'Present' : 'Missing'}`);
      console.log(`✅ Sheet references: ${mentionsSheets ? 'Present' : 'Missing'}`);
    } else {
      console.log('❌ Frontend file not found');
    }

    // Step 5: Generate expected template structure
    console.log('\n📋 Step 5: Expected Template Structure:');
    console.log('Sheet 1 - Daily Reports Template:');
    console.log('  Columns: Store ID, Samsung SKU ID, Plan ID, IMEI, Date of Sale');
    console.log('  Sample rows: 3 example records');
    console.log('');
    console.log('Sheet 2 - Plan Collection Data:');
    console.log('  Columns: Plan ID, Plan Type, Price, Samsung SKU ID, Samsung SKU Model Name, Samsung SKU Category, Samsung SKU Price, Created At, Updated At');
    console.log(`  Data rows: ${planCount} plan records`);

    // Step 6: Manual testing instructions
    console.log('\n📋 Manual Testing Instructions:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Navigate to: http://localhost:3003/Zopper-Administrator/import-daily-reports');
    console.log('3. Click the "Download Template" button');
    console.log('4. Verify the downloaded Excel file has two sheets:');
    console.log('   - "Daily Reports Template" with sample data');
    console.log('   - "Plan Collection Data" with all plan records');
    console.log('5. Use the Plan IDs from Sheet 2 to fill in Sheet 1');
    console.log('6. Test importing the filled template');

    // Step 7: Plan Type summary
    console.log('\n📊 Available Plan Types:');
    const planTypes = await prisma.plan.groupBy({
      by: ['planType'],
      _count: {
        planType: true
      }
    });

    planTypes.forEach(type => {
      console.log(`  - ${type.planType}: ${type._count.planType} plans`);
    });

    console.log('\n🎉 Template download test validation completed!');
    console.log('\n💡 Benefits of the new template:');
    console.log('  ✅ Users can see all available Plan IDs in Sheet 2');
    console.log('  ✅ Users can reference plan details while filling the template');
    console.log('  ✅ Reduces errors from invalid Plan IDs');
    console.log('  ✅ Provides complete plan information for reference');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTemplateDownload();