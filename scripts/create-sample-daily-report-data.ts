import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleData() {
  try {
    console.log('Creating sample data for daily reports...');

    // First, let's check if we have the required data
    const stores = await prisma.store.findMany({
      take: 3,
      select: { id: true, name: true }
    });

    const samsungSKUs = await prisma.samsungSKU.findMany({
      take: 3,
      select: { id: true, ModelName: true }
    });

    const plans = await prisma.plan.findMany({
      take: 3,
      select: { id: true, planType: true }
    });

    const canvassers = await prisma.canvasser.findMany({
      take: 3,
      select: { id: true, fullName: true }
    });

    console.log('Available data:');
    console.log('Stores:', stores);
    console.log('Samsung SKUs:', samsungSKUs);
    console.log('Plans:', plans);
    console.log('SECs:', secs);

    if (stores.length === 0) {
      console.log('No stores found. Please create some stores first.');
      return;
    }

    if (samsungSKUs.length === 0) {
      console.log('No Samsung SKUs found. Please create some Samsung SKUs first.');
      return;
    }

    if (plans.length === 0) {
      console.log('No plans found. Please create some plans first.');
      return;
    }

    // Create a sample CSV content with real IDs
    const csvContent = `Store ID,Samsung SKU ID,Plan ID,IMEI,Date of Sale
${stores[0].id},${samsungSKUs[0].id},${plans[0].id},123456789012345,01-01-2024
${stores.length > 1 ? stores[1].id : stores[0].id},${samsungSKUs.length > 1 ? samsungSKUs[1].id : samsungSKUs[0].id},${plans.length > 1 ? plans[1].id : plans[0].id},123456789012346,02-01-2024
${stores.length > 2 ? stores[2].id : stores[0].id},${samsungSKUs.length > 2 ? samsungSKUs[2].id : samsungSKUs[0].id},${plans.length > 2 ? plans[2].id : plans[0].id},123456789012347,03-01-2024`;

    // Write to file
    const fs = require('fs');
    fs.writeFileSync('test_daily_reports_with_real_ids.csv', csvContent);
    
    console.log('✅ Sample CSV file created: test_daily_reports_with_real_ids.csv');
    console.log('You can use this file to test the import functionality.');

  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();