import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🧪 Creating test Daily Incentive Report data...\n');

    // Find or create a test ASA Canvasser user
    let asaCanvasserUser = await prisma.asaCanvasser.findFirst({
      where: {
        phone: '+919999999999'
      },
      include: {
        store: true
      }
    });

    if (!asaCanvasserUser) {
      console.log('Creating test ASA Canvasser user...');
      asaCanvasserUser = await prisma.asaCanvasser.create({
        data: {
          phone: '+919999999999',
          fullName: 'Test SEC User',
          storeId: 'store_00001'
        },
        include: {
          store: true
        }
      });
    }

    console.log(`✅ SEC User: ${secUser.phone} (${secUser.id})`);
    console.log(`   Store: ${secUser.store?.name || secUser.storeId}`);

    // Find Samsung SKUs and Plans
    const samsungSKUs = await prisma.samsungSKU.findMany({
      take: 3,
      include: {
        plans: true
      }
    });

    if (samsungSKUs.length === 0) {
      console.log('❌ No Samsung SKUs found. Please run the Samsung data import first.');
      return;
    }

    console.log(`\n📱 Found ${samsungSKUs.length} Samsung SKUs`);

    // Create test daily incentive reports for December 2024
    const testDates = [
      new Date('2024-12-01'),
      new Date('2024-12-05'),
      new Date('2024-12-10'),
      new Date('2024-12-15'),
      new Date('2024-12-20'),
      new Date('2024-12-25')
    ];

    console.log('\n📊 Creating Daily Incentive Reports...');

    for (let i = 0; i < testDates.length; i++) {
      const date = testDates[i];
      const sku = samsungSKUs[i % samsungSKUs.length];
      const plan = sku.plans[0]; // Use first plan

      if (!plan) {
        console.log(`⚠️  Skipping SKU ${sku.ModelName} - no plans found`);
        continue;
      }

      const imei = `86123456789012${String(i).padStart(2, '0')}`;

      try {
        const report = await prisma.dailyIncentiveReport.create({
          data: {
            secId: secUser.id,
            storeId: secUser.storeId!,
            samsungSKUId: sku.id,
            planId: plan.id,
            imei: imei,
            Date_of_sale: date,
            metadata: {
              testData: true,
              createdBy: 'test-script'
            }
          }
        });

        console.log(`   ✅ Created report for ${date.toISOString().split('T')[0]}`);
        console.log(`      SKU: ${sku.ModelName} (₹${sku.ModelPrice})`);
        console.log(`      Plan: ${plan.planType} (₹${plan.price})`);
        console.log(`      IMEI: ${imei}`);

      } catch (error: any) {
        if (error.code === 11000 || error.message.includes('duplicate')) {
          console.log(`   ⚠️  Report already exists for IMEI ${imei}`);
        } else {
          console.error(`   ❌ Failed to create report:`, error.message);
        }
      }
    }

    console.log('\n🎉 Test data creation completed!');
    console.log('\nYou can now test the incentive calculation by:');
    console.log('1. Running: npx tsx scripts/test-incentive-calculation.ts');
    console.log('2. Or using the SEC passbook "View Your Calculation" button');

  } catch (error) {
    console.error('❌ Failed to create test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();