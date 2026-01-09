const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

// Map MR Price List data to plan incentives
const MR_INCENTIVES = {
    'Refrigerator': {
        '5000-15000': { 1: 40, 2: 40, 3: 75, 4: 100 },
        '15001-20000': { 1: 50, 2: 75, 3: 125, 4: 150 },
        '20001-30000': { 1: 75, 2: 100, 3: 200, 4: 225 },
        '30001-40000': { 1: 100, 2: 125, 3: 250, 4: 325 },
        '40001-50000': { 1: 125, 2: 175, 3: 300, 4: 400 },
        '50000-60000': { 1: 175, 2: 300, 3: 400, 4: 450 },
        '60001-70000': { 1: 200, 2: 300, 3: 425, 4: 500 },
        '70000+': { 1: 200, 2: 325, 3: 450, 4: 525 }
    },
    'Washing Machine': {
        '5000-15000': { 1: 40, 2: 50, 3: 75, 4: 125 },
        '15001-20000': { 1: 50, 2: 75, 3: 125, 4: 175 },
        '20001-30000': { 1: 75, 2: 100, 3: 175, 4: 225 },
        '30001-40000': { 1: 100, 2: 150, 3: 250, 4: 325 },
        '40001-50000': { 1: 150, 2: 200, 3: 325, 4: 450 }
    },
    'Air Conditioner': {
        '10000-25000': { 1: 100, 2: 125, 3: 200, 4: 300 },
        '25001-40000': { 1: 125, 2: 175, 3: 275, 4: 400 },
        '40001-65000': { 1: 150, 2: 225, 3: 350, 4: 525 }
    },
    // Others (Air Cooler, Dishwasher, Chest Freezer, Microwave Oven, Qube)
    'Others': {
        '5000-15000': { 1: 25, 2: 40, 3: 75, 4: 150 },
        '15001-20000': { 1: 50, 2: 50, 3: 125, 4: 200 }
    }
};

// Categories that use "Others" pricing
const OTHERS_CATEGORIES = ['Air Cooler', 'Dishwasher', 'Chest Freezer', 'Microwave Oven'];

function getTenureFromPlanType(planType) {
    if (planType.includes('1_YR')) return 1;
    if (planType.includes('2_YR')) return 2;
    if (planType.includes('3_YR')) return 3;
    if (planType.includes('4_YR')) return 4;
    return 1;
}

async function updatePlanIncentives() {
    try {
        console.log('🔄 Updating Plan incentiveAmount from MR Price List...\n');

        // Get all plans with their SKU category
        const plans = await prisma.plan.findMany({
            include: {
                GodrejSKU: {
                    select: {
                        Category: true
                    }
                }
            }
        });

        console.log(`Found ${plans.length} plans to update\n`);

        let updated = 0;
        let skipped = 0;

        for (const plan of plans) {
            const category = plan.GodrejSKU?.Category;
            const priceRange = plan.priceRange;
            const tenure = getTenureFromPlanType(plan.planType);

            if (!category || !priceRange) {
                console.log(`⚠️  Skipping plan ${plan.id} - missing category or priceRange`);
                skipped++;
                continue;
            }

            // Determine which incentive map to use
            let incentiveMap;
            if (OTHERS_CATEGORIES.includes(category)) {
                incentiveMap = MR_INCENTIVES['Others'];
            } else {
                incentiveMap = MR_INCENTIVES[category];
            }

            if (!incentiveMap) {
                console.log(`⚠️  No incentive data for category: ${category}`);
                skipped++;
                continue;
            }

            const incentiveData = incentiveMap[priceRange];
            if (!incentiveData) {
                console.log(`⚠️  No incentive data for ${category} - ${priceRange}`);
                skipped++;
                continue;
            }

            const incentiveAmount = incentiveData[tenure] || 0;

            // Update the plan
            await prisma.plan.update({
                where: { id: plan.id },
                data: { incentiveAmount }
            });

            console.log(`✅ Updated: ${category} | ${priceRange} | ${tenure}Y → ₹${incentiveAmount}`);
            updated++;
        }

        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Updated: ${updated} plans`);
        console.log(`   ⚠️  Skipped: ${skipped} plans`);
        console.log(`\n🎉 Plan incentives updated successfully!`);

    } catch (error) {
        console.error('❌ Error updating plan incentives:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updatePlanIncentives()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
