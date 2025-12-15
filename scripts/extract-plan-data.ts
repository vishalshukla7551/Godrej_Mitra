import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function extractPlanData() {
  try {
    console.log('📊 Extracting Plan Collection Data...\n');

    // Fetch all Plan documents with related data
    const plans = await prisma.plan.findMany({
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

    console.log(`Found ${plans.length} plans in the database`);

    if (plans.length === 0) {
      console.log('❌ No plans found in database');
      return;
    }

    // Create CSV content
    const csvHeader = 'Plan ID,Plan Type,Price (INR),Samsung SKU ID,Samsung SKU Model Name,Samsung SKU Category,Samsung SKU Price (INR),Created At,Updated At';
    
    const csvRows = plans.map(plan => {
      const createdAt = plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('en-GB') : '';
      const updatedAt = plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString('en-GB') : '';
      
      return [
        plan.id,
        plan.planType,
        plan.price,
        plan.samsungSKUId || '',
        plan.samsungSKU?.ModelName || '',
        plan.samsungSKU?.Category || '',
        plan.samsungSKU?.ModelPrice || '',
        createdAt,
        updatedAt
      ].map(field => `"${field}"`).join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');

    // Write to file
    const fileName = 'plan_collection_data.csv';
    fs.writeFileSync(fileName, csvContent);
    console.log(`✅ Plan data exported to: ${fileName}`);

    // Display summary
    console.log('\n📊 Plan Data Summary:');
    
    const planTypeCount = plans.reduce((acc, plan) => {
      acc[plan.planType] = (acc[plan.planType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(planTypeCount).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} plans`);
    });

    const linkedPlans = plans.filter(p => p.samsungSKUId).length;
    const unlinkedPlans = plans.length - linkedPlans;
    
    console.log(`\n📈 Plan-SKU Relationships:`);
    console.log(`  Linked to Samsung SKU: ${linkedPlans} plans`);
    console.log(`  Not linked to Samsung SKU: ${unlinkedPlans} plans`);

    // Show sample data
    console.log('\n📋 Sample Plan Records (first 5):');
    plans.slice(0, 5).forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.planType} - ₹${plan.price}`);
      console.log(`   ID: ${plan.id}`);
      console.log(`   Samsung SKU: ${plan.samsungSKU?.ModelName || 'Not linked'}`);
      console.log('');
    });

    console.log('🎉 Plan data extraction completed!');

  } catch (error) {
    console.error('❌ Error extracting plan data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

extractPlanData();