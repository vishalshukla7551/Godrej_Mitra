import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createTestSpotIncentiveReports() {
  try {
    // Get phone from UAT_CANVASSER_PHONE env variable
    const phone = process.env.UAT_CANVASSER_PHONE;
    
    if (!phone) {
      console.error('❌ UAT_CANVASSER_PHONE not set in environment variables');
      process.exit(1);
    }

    const count = 4;

    console.log(`📤 Creating ${count} spot incentive report(s) for phone: ${phone}`);

    // 1. Find canvasser by phone (don't create)
    const canvasser = await prisma.canvasser.findUnique({
      where: { phone },
    });

    if (!canvasser) {
      console.error(`❌ Canvasser with phone ${phone} not found`);
      process.exit(1);
    }
    console.log(`✅ Found canvasser: ${canvasser.fullName} (${canvasser.id})`);

    // 2. Get first store (don't create)
    const store = await prisma.store.findFirst();
    if (!store) {
      console.error('❌ No store found in database');
      process.exit(1);
    }
    console.log(`✅ Using store: ${store.name} (${store.id})`);

    // 3. Get first SKU (don't create)
    const sku = await prisma.godrejSKU.findFirst();
    if (!sku) {
      console.error('❌ No GodrejSKU found in database');
      process.exit(1);
    }
    console.log(`✅ Using SKU: ${sku.Category} (${sku.id})`);

    // 4. Get first Plan (don't create)
    const plan = await prisma.plan.findFirst();
    if (!plan) {
      console.error('❌ No Plan found in database');
      process.exit(1);
    }
    console.log(`✅ Using plan: ${plan.planType} (${plan.id})`);

    // 5. Create spot incentive reports ONLY
    const reports = [];
    for (let i = 1; i <= count; i++) {
      const report = await prisma.spotIncentiveReport.create({
        data: {
          canvasserId: canvasser.id,
          storeId: store.id,
          godrejSKUId: sku.id,
          planId: plan.id,
          imei: `TEST-${phone}-${Date.now()}-${i}`,
          customerName: `Test Customer ${i}`,
          customerPhoneNumber: `${phone.slice(0, -1)}${i}`,
          spotincentiveEarned: plan.incentiveAmount,
          isCampaignActive: true,
          Date_of_sale: new Date(),
        },
      });
      reports.push(report);
      console.log(`✅ Created report ${i}: ${report.id}`);
    }

    console.log('\n📊 Summary:');
    console.log(`- Canvasser: ${canvasser.fullName} (${canvasser.phone})`);
    console.log(`- Store: ${store.name}`);
    console.log(`- SKU: ${sku.Category}`);
    console.log(`- Plan: ${plan.planType}`);
    console.log(`- Reports Created: ${reports.length}`);
    console.log('\n✨ Test data created successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestSpotIncentiveReports();
