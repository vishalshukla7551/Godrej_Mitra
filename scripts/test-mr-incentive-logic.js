const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMRIncentiveCalculation() {
    try {
        console.log('🧪 Testing MR Incentive Calculation Logic\n');

        // Test Case 1: Refrigerator at ₹35,000 with 3-year warranty
        console.log('Test Case 1: Refrigerator @ ₹35,000 for 3 years');
        const test1 = await prisma.mRIncentive.findFirst({
            where: {
                category: 'Refrigerator',
                minPrice: { lte: 35000 },
                OR: [
                    { maxPrice: { gte: 35000 } },
                    { maxPrice: null }
                ]
            }
        });

        if (test1) {
            console.log(`  ✅ Found: ${test1.priceRange}`);
            console.log(`  💰 Incentive for 3Y: ₹${test1.incentive3Year}`);
            console.log(`  Expected: ₹250\n`);
        } else {
            console.log('  ❌ No matching record found\n');
        }

        // Test Case 2: Washing Machine at ₹22,000 with 2-year warranty
        console.log('Test Case 2: Washing Machine @ ₹22,000 for 2 years');
        const test2 = await prisma.mRIncentive.findFirst({
            where: {
                category: 'Washing Machine',
                minPrice: { lte: 22000 },
                OR: [
                    { maxPrice: { gte: 22000 } },
                    { maxPrice: null }
                ]
            }
        });

        if (test2) {
            console.log(`  ✅ Found: ${test2.priceRange}`);
            console.log(`  💰 Incentive for 2Y: ₹${test2.incentive2Year}`);
            console.log(`  Expected: ₹100\n`);
        } else {
            console.log('  ❌ No matching record found\n');
        }

        // Test Case 3: AC at ₹50,000 with 4-year warranty
        console.log('Test Case 3: AC @ ₹50,000 for 4 years');
        const test3 = await prisma.mRIncentive.findFirst({
            where: {
                category: 'AC',
                minPrice: { lte: 50000 },
                OR: [
                    { maxPrice: { gte: 50000 } },
                    { maxPrice: null }
                ]
            }
        });

        if (test3) {
            console.log(`  ✅ Found: ${test3.priceRange}`);
            console.log(`  💰 Incentive for 4Y: ₹${test3.incentive4Year}`);
            console.log(`  Expected: ₹525\n`);
        } else {
            console.log('  ❌ No matching record found\n');
        }

        // Test Case 4: Microwave Oven at ₹12,000 with 1-year warranty
        console.log('Test Case 4: Microwave Oven @ ₹12,000 for 1 year');
        const test4 = await prisma.mRIncentive.findFirst({
            where: {
                category: 'Microwave Oven',
                minPrice: { lte: 12000 },
                OR: [
                    { maxPrice: { gte: 12000 } },
                    { maxPrice: null }
                ]
            }
        });

        if (test4) {
            console.log(`  ✅ Found: ${test4.priceRange}`);
            console.log(`  💰 Incentive for 1Y: ₹${test4.incentive1Year}`);
            console.log(`  Expected: ₹25\n`);
        } else {
            console.log('  ❌ No matching record found\n');
        }

        // Display all available categories
        console.log('📋 Available Categories:');
        const categories = await prisma.mRIncentive.findMany({
            distinct: ['category'],
            select: { category: true }
        });
        categories.forEach(cat => {
            console.log(`  • ${cat.category}`);
        });

        console.log('\n✅ All tests completed!');

    } catch (error) {
        console.error('❌ Error during testing:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

testMRIncentiveCalculation()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
