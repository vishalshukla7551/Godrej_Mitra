const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Define categories with their subcategories
const categories = [
    {
        name: 'Refrigerator',
        subCategories: ['Direct Cool', 'Frost Free']
    },
    {
        name: 'Washing Machine',
        subCategories: ['Semi Automatic', 'Fully Automatic']
    },
    {
        name: 'Air Conditioner',
        subCategories: ['All']
    },
    {
        name: 'Air Cooler',
        subCategories: ['All']
    },
    {
        name: 'Dishwasher',
        subCategories: ['All']
    },
    {
        name: 'Chest Freezer',
        subCategories: ['All']
    },
    {
        name: 'Microwave Oven',
        subCategories: ['All']
    },
    {
        name: 'Qube',
        subCategories: ['All']
    }
];

// Define price ranges and plan prices based on Godrej Care+ Excel file
// Data structure: category -> price ranges -> warranty plans with prices
const categoryPricing = {
    'Refrigerator': [
        {
            range: '5000-15000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 1015 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 1382 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 2314 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 3013 }
            ]
        },
        {
            range: '15001-20000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 1382 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 1866 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 3147 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 4062 }
            ]
        },
        {
            range: '20001-30000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 1982 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 2699 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 4982 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 5961 }
            ]
        },
        {
            range: '30001-40000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 2699 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 3715 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 6296 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 8192 }
            ]
        },
        {
            range: '40001-50000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 3599 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 4799 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 7609 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 10423 }
            ]
        },
        {
            range: '50000-60000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 4800 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 7900 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 9989 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 11649 }
            ]
        },
        {
            range: '60001-70000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 4982 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 8110 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 10659 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 12319 }
            ]
        },
        {
            range: '70000+', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 5183 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 8378 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 11329 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 13659 }
            ]
        }
    ],
    'Washing Machine': [
        {
            range: '5000-15000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 1015 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 1499 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 2364 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 3246 }
            ]
        },
        {
            range: '15001-20000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 1566 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 2099 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 3246 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 4411 }
            ]
        },
        {
            range: '20001-30000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 2032 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 2999 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 4461 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 6208 }
            ]
        },
        {
            range: '30001-40000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 2999 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 4149 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 6543 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 8538 }
            ]
        },
        {
            range: '40001-50000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 3966 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 5349 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 8241 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 11203 }
            ]
        }
    ],
    // Shared pricing categories
    'Others': [
        {
            range: '5000-15000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 948 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 1181 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 2099 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 3750 }
            ]
        },
        {
            range: '15001-20000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 1248 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 1598 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 3017 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 4933 }
            ]
        },
        {
            range: '20001-30000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 1781 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 2431 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 4330 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 6966 }
            ]
        },
        {
            range: '30001-40000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 2431 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 3313 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 6036 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 8398 }
            ]
        },
        {
            range: '40001-65000', plans: [
                { type: 'EXTENDED_WARRANTY_1_YR', price: 3197 },
                { type: 'EXTENDED_WARRANTY_2_YR', price: 4263 },
                { type: 'EXTENDED_WARRANTY_3_YR', price: 7742 },
                { type: 'EXTENDED_WARRANTY_4_YR', price: 10760 }
            ]
        }
    ]
};

async function seedGodrejData() {
    try {
        console.log('🌱 Starting Godrej data seeding...\n');

        // Clear existing data
        console.log('🗑️  Clearing existing Plan and GodrejSKU data...');
        await prisma.plan.deleteMany({});
        await prisma.godrejSKU.deleteMany({});
        console.log('✅ Existing data cleared\n');

        // Create GodrejSKU records for each category
        console.log('📦 Creating GodrejSKU records...');
        const createdSKUs = [];

        for (const category of categories) {
            const sku = await prisma.godrejSKU.create({
                data: {
                    Category: category.name,
                    SubCategory: category.subCategories
                }
            });
            createdSKUs.push(sku);
            console.log(`  ✓ Created SKU: ${category.name} with subcategories: ${category.subCategories.join(', ')}`);
        }
        console.log(`✅ Created ${createdSKUs.length} GodrejSKU records\n`);

        // Create Plan records based on category pricing
        console.log('💰 Creating Plan records...');
        let totalPlansCreated = 0;

        for (const sku of createdSKUs) {
            console.log(`\n  Creating plans for ${sku.Category}:`);

            let pricingData;
            if (categoryPricing[sku.Category]) {
                pricingData = categoryPricing[sku.Category];
            } else {
                // Use 'Others' pricing for categories not explicitly listed (Air Cooler, Dishwasher, etc.)
                pricingData = categoryPricing['Others'];
            }

            for (const priceRange of pricingData) {
                for (const plan of priceRange.plans) {
                    await prisma.plan.create({
                        data: {
                            planType: plan.type,
                            priceRange: priceRange.range,
                            PlanPrice: plan.price,
                            godrejSKUId: sku.id
                        }
                    });
                    totalPlansCreated++;
                    console.log(`    ✓ ${priceRange.range} - ${plan.type}: ₹${plan.price}`);
                }
            }
        }

        console.log(`\n✅ Created ${totalPlansCreated} Plan records\n`);
        console.log('🎉 Seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Categories: ${createdSKUs.length}`);
        console.log(`   - Plans: ${totalPlansCreated}`);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed function
seedGodrejData()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
