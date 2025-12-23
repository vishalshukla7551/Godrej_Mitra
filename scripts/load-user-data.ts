import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🚀 Starting data load for store 00375...');

        // 1. Ensure Store 00375 exists
        const storeId = '00375';
        let store = await prisma.store.findUnique({
            where: { id: storeId }
        });

        if (!store) {
            console.log(`Creating store ${storeId}...`);
            store = await prisma.store.create({
                data: {
                    id: storeId,
                    name: 'Samsung SmartCafé - Store 00375',
                    city: 'Mumbai',
                    numberOfSec: 2
                }
            });
        }
        console.log(`✅ Store: ${store.name} (${store.id})`);

        // 2. Find or create Samsung SKU for Z Fold 7
        let sku = await prisma.samsungSKU.findFirst({
            where: {
                ModelName: {
                    contains: 'Fold 7',
                    mode: 'insensitive'
                }
            }
        });

        if (!sku) {
            console.log('Creating Samsung SKU for Z Fold 7...');
            sku = await prisma.samsungSKU.create({
                data: {
                    Category: 'SMARTPHONE',
                    ModelName: 'Galaxy Z Fold 7',
                    ModelPrice: 154999
                }
            });
        }
        console.log(`✅ SKU: ${sku.ModelName} (${sku.id})`);

        // 3. Find or create Plans (ADLD and COMBO)
        const planTypes = ['ADLD_1_YR', 'COMBO_2_YRS'] as const;
        const plans: Record<string, any> = {};

        for (const planType of planTypes) {
            let plan = await prisma.plan.findFirst({
                where: {
                    samsungSKUId: sku.id,
                    planType: planType as any
                }
            });

            if (!plan) {
                console.log(`Creating plan ${planType} for SKU ${sku.ModelName}...`);
                plan = await prisma.plan.create({
                    data: {
                        planType: planType as any,
                        price: planType === 'ADLD_1_YR' ? 9999 : 14999,
                        samsungSKUId: sku.id
                    }
                });
            }
            plans[planType] = plan;
            console.log(`✅ Plan: ${plan.planType} (₹${plan.price})`);
        }

        // 4. Create 6 Sales Reports (3 ADLD, 3 COMBO)
        console.log('📊 Creating 6 daily incentive reports...');
        const today = new Date();
        const reportsToCreate = [
            { planType: 'ADLD_1_YR', imei: 'IMEI_00375_ADLD_1' },
            { planType: 'ADLD_1_YR', imei: 'IMEI_00375_ADLD_2' },
            { planType: 'ADLD_1_YR', imei: 'IMEI_00375_ADLD_3' },
            { planType: 'COMBO_2_YRS', imei: 'IMEI_00375_COMBO_1' },
            { planType: 'COMBO_2_YRS', imei: 'IMEI_00375_COMBO_2' },
            { planType: 'COMBO_2_YRS', imei: 'IMEI_00375_COMBO_3' },
        ];

        for (let i = 0; i < reportsToCreate.length; i++) {
            const item = reportsToCreate[i];
            const saleDate = new Date(today);
            saleDate.setDate(today.getDate() - i); // Different dates to look real

            try {
                const report = await prisma.dailyIncentiveReport.upsert({
                    where: { imei: item.imei },
                    update: {
                        storeId: storeId,
                        samsungSKUId: sku.id,
                        planId: plans[item.planType].id,
                        Date_of_sale: saleDate,
                    },
                    create: {
                        storeId: storeId,
                        samsungSKUId: sku.id,
                        planId: plans[item.planType].id,
                        imei: item.imei,
                        Date_of_sale: saleDate,
                        metadata: {
                            source: 'load-user-data-script'
                        }
                    }
                });
                console.log(`   ✅ Created report ${i + 1}: IMEI ${item.imei} | Plan: ${item.planType}`);
            } catch (err: any) {
                console.error(`   ❌ Failed to create report for IMEI ${item.imei}:`, err.message);
            }
        }

        console.log('\n🎉 Data load completed successfully!');

    } catch (error) {
        console.error('💥 Fatal error during data load:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
