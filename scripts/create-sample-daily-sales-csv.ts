import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function createSampleDailySalesCSV() {
  try {
    console.log('📋 Creating Sample Daily Sales CSV with Real Data...\n');

    // Step 1: Get real data from database
    console.log('🔍 Fetching real data from database...');
    
    const stores = await prisma.store.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        city: true,
      },
      orderBy: { name: 'asc' }
    });

    const samsungSKUs = await prisma.samsungSKU.findMany({
      take: 15,
      select: {
        id: true,
        ModelName: true,
        Category: true,
        ModelPrice: true
      },
      orderBy: { ModelName: 'asc' }
    });

    const plans = await prisma.plan.findMany({
      take: 10,
      select: {
        id: true,
        planType: true,
        price: true
      },
      orderBy: { planType: 'asc' }
    });

    console.log(`Found: ${stores.length} stores, ${samsungSKUs.length} Samsung SKUs, ${plans.length} plans`);

    if (stores.length === 0 || samsungSKUs.length === 0 || plans.length === 0) {
      console.log('❌ Insufficient data in database to create sample CSV');
      console.log('Please ensure you have stores, Samsung SKUs, and plans in your database');
      return;
    }

    // Step 2: Display available data
    console.log('\n📊 Available Data Summary:');
    console.log('\nStores:');
    stores.forEach((store, index) => {
      console.log(`  ${index + 1}. ${store.id} - ${store.name} (${store.city || 'N/A'})`);
    });

    console.log('\nSamsung SKUs:');
    samsungSKUs.slice(0, 5).forEach((sku, index) => {
      console.log(`  ${index + 1}. ${sku.id} - ${sku.ModelName} (${sku.Category}) - ₹${sku.ModelPrice || 'N/A'}`);
    });
    if (samsungSKUs.length > 5) {
      console.log(`  ... and ${samsungSKUs.length - 5} more SKUs`);
    }

    console.log('\nPlans:');
    plans.forEach((plan, index) => {
      console.log(`  ${index + 1}. ${plan.id} - ${plan.planType} - ₹${plan.price}`);
    });

    // Step 3: Generate realistic sample data
    console.log('\n📝 Generating sample daily sales data...');
    
    const sampleData = [];
    const usedIMEIs = new Set();

    // Generate 50 sample records with realistic data
    for (let i = 0; i < 50; i++) {
      // Random selections
      const randomStore = stores[Math.floor(Math.random() * stores.length)];
      const randomSKU = samsungSKUs[Math.floor(Math.random() * samsungSKUs.length)];
      const randomPlan = plans[Math.floor(Math.random() * plans.length)];
      
      // Generate unique IMEI (15 digits)
      let imei;
      do {
        imei = '8' + Math.floor(Math.random() * 10000000000000).toString().padStart(14, '0');
      } while (usedIMEIs.has(imei));
      usedIMEIs.add(imei);

      // Generate random date in the last 30 days
      const today = new Date();
      const daysAgo = Math.floor(Math.random() * 30);
      const saleDate = new Date(today);
      saleDate.setDate(today.getDate() - daysAgo);
      
      const formattedDate = saleDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      sampleData.push({
        storeId: randomStore.id,
        storeName: randomStore.name,
        samsungSKUId: randomSKU.id,
        skuName: randomSKU.ModelName,
        planId: randomPlan.id,
        planType: randomPlan.planType,
        imei: imei,
        dateOfSale: formattedDate
      });
    }

    // Step 4: Create CSV content
    console.log('📄 Creating CSV content...');
    
    const csvHeader = 'Store ID,Samsung SKU ID,Plan ID,IMEI,Date of Sale';
    const csvRows = sampleData.map(row => 
      `${row.storeId},${row.samsungSKUId},${row.planId},${row.imei},${row.dateOfSale}`
    );
    const csvContent = [csvHeader, ...csvRows].join('\n');

    // Step 5: Write CSV file
    const csvFileName = 'sample_daily_sales_real_data.csv';
    fs.writeFileSync(csvFileName, csvContent);
    console.log(`✅ Created sample CSV: ${csvFileName}`);

    // Step 6: Create a detailed CSV with comments for reference
    const detailedCsvHeader = 'Store ID,Store Name,Samsung SKU ID,SKU Model,Plan ID,Plan Type,IMEI,Date of Sale';
    const detailedCsvRows = sampleData.map(row => 
      `${row.storeId},"${row.storeName}",${row.samsungSKUId},"${row.skuName}",${row.planId},${row.planType},${row.imei},${row.dateOfSale}`
    );
    const detailedCsvContent = [detailedCsvHeader, ...detailedCsvRows].join('\n');

    const detailedCsvFileName = 'sample_daily_sales_detailed.csv';
    fs.writeFileSync(detailedCsvFileName, detailedCsvContent);
    console.log(`✅ Created detailed CSV: ${detailedCsvFileName}`);

    // Step 7: Create a smaller test CSV (10 records)
    const testCsvRows = csvRows.slice(0, 10);
    const testCsvContent = [csvHeader, ...testCsvRows].join('\n');
    const testCsvFileName = 'test_daily_sales_10_records.csv';
    fs.writeFileSync(testCsvFileName, testCsvContent);
    console.log(`✅ Created test CSV (10 records): ${testCsvFileName}`);

    // Step 8: Display statistics
    console.log('\n📊 Generated Data Statistics:');
    console.log(`Total records: ${sampleData.length}`);
    console.log(`Unique stores used: ${new Set(sampleData.map(d => d.storeId)).size}`);
    console.log(`Unique SKUs used: ${new Set(sampleData.map(d => d.samsungSKUId)).size}`);
    console.log(`Unique plans used: ${new Set(sampleData.map(d => d.planId)).size}`);
    console.log(`Date range: ${Math.min(...sampleData.map(d => new Date(d.dateOfSale.split('-').reverse().join('-')).getTime()))} to ${Math.max(...sampleData.map(d => new Date(d.dateOfSale.split('-').reverse().join('-')).getTime()))}`);

    // Step 9: Show sample records
    console.log('\n📋 Sample Records (first 5):');
    sampleData.slice(0, 5).forEach((record, index) => {
      console.log(`${index + 1}. Store: ${record.storeName}`);
      console.log(`   SKU: ${record.skuName}`);
      console.log(`   Plan: ${record.planType}`);
      console.log(`   IMEI: ${record.imei}`);
      console.log(`   Date: ${record.dateOfSale}`);
      console.log('');
    });

    // Step 10: Usage instructions
    console.log('📋 Usage Instructions:');
    console.log('1. Use "sample_daily_sales_real_data.csv" for the import feature');
    console.log('2. Use "test_daily_sales_10_records.csv" for quick testing');
    console.log('3. Use "sample_daily_sales_detailed.csv" for reference (has readable names)');
    console.log('');
    console.log('🌐 To test the import:');
    console.log('1. Start your server: npm run dev');
    console.log('2. Go to: http://localhost:3003/Zopper-Administrator/import-daily-reports');
    console.log('3. Upload one of the generated CSV files');
    console.log('4. Verify the import results');

    console.log('\n🎉 Sample CSV files created successfully!');

  } catch (error) {
    console.error('❌ Error creating sample CSV:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleDailySalesCSV();