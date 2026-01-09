const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

// Category mapping for different product names in Excel
const CATEGORY_MAPPING = {
    'Refrigerator': 'Refrigerator',
    'Washing Machine': 'Washing Machine',
    'AC': 'Air Conditioner',
    'Air Cooler, Dishwasher, Chest Freezer, Microwave, Oven': 'Others' // We'll handle these individually
};

function parsePriceRange(rangeStr) {
    // Handle formats like "5000-15000", "15001-20000", "70000+"
    if (rangeStr.includes('+')) {
        // e.g., "70000+"
        const min = parseInt(rangeStr.replace('+', ''));
        return { min, max: null };
    } else if (rangeStr.includes('-')) {
        // e.g., "5000-15000"
        const [min, max] = rangeStr.split('-').map(s => parseInt(s.trim()));
        return { min, max };
    }
    return null;
}

async function seedMRIncentives() {
    try {
        console.log('📊 Starting MR Incentive data seeding from Excel...\n');

        // Read Excel file
        console.log('📖 Reading MR Price List.xlsx...');
        const workbook = XLSX.readFile('MR Price List.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to array of arrays
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
        console.log(`✅ Excel file loaded with ${rawData.length} rows\n`);

        // Clear existing MR Incentive data
        console.log('🗑️  Clearing existing MRIncentive data...');
        const deleteResult = await prisma.mRIncentive.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.count} existing records\n`);

        // Parse data starting from row 2 (index 1, after header)
        const records = [];
        let currentCategory = null;

        for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];

            // Skip empty rows
            if (!row || row.every(cell => cell === null || cell === '')) {
                continue;
            }

            const [
                productCategory,
                priceRange,
                year1Price,       // Column 2: 1 Year price
                year1IncentiveOld, // Column 3: Old incentive (ignore)
                year1IncentiveNew, // Column 4: NEW incentive (YELLOW)
                year2Price,       // Column 5: 2 Years price
                year2IncentiveOld, // Column 6: Old incentive (ignore)
                year2IncentiveNew, // Column 7: NEW incentive (YELLOW)
                year3Price,       // Column 8: 3 Years price
                year3IncentiveOld, // Column 9: Old incentive (ignore)
                year3IncentiveNew, // Column 10: NEW incentive (YELLOW)
                year4Price,       // Column 11: 4 Years price
                year4IncentiveOld, // Column 12: Old incentive (ignore)
                year4IncentiveNew  // Column 13: NEW incentive (YELLOW)
            ] = row;

            // Update current category if specified
            if (productCategory !== null && productCategory !== '') {
                currentCategory = productCategory.trim();
            }

            // Skip if no price range
            if (!priceRange) {
                continue;
            }

            // Parse price range
            const parsedRange = parsePriceRange(priceRange);
            if (!parsedRange) {
                console.warn(`⚠️  Could not parse price range: ${priceRange}`);
                continue;
            }

            // Handle "Others" category - create separate records for each appliance
            const categories = [];
            if (currentCategory === 'Air Cooler, Dishwasher, Chest Freezer, Microwave, Oven') {
                categories.push('Air Cooler');
                categories.push('Dishwasher');
                categories.push('Chest Freezer');
                categories.push('Microwave Oven');
                categories.push('Qube'); // Adding Qube as it's similar
            } else {
                categories.push(currentCategory);
            }

            // Create records for each category
            for (const category of categories) {
                const record = {
                    category: category,
                    priceRange: priceRange,
                    minPrice: parsedRange.min,
                    maxPrice: parsedRange.max,
                    incentive1Year: Math.round(year1IncentiveNew || 0),
                    incentive2Year: Math.round(year2IncentiveNew || 0),
                    incentive3Year: Math.round(year3IncentiveNew || 0),
                    incentive4Year: Math.round(year4IncentiveNew || 0)
                };

                records.push(record);

                console.log(`  ✓ ${category} | ${priceRange}: 1Y=₹${record.incentive1Year}, 2Y=₹${record.incentive2Year}, 3Y=₹${record.incentive3Year}, 4Y=₹${record.incentive4Year}`);
            }
        }

        console.log(`\n📝 Parsed ${records.length} incentive records\n`);

        // Insert all records into database
        console.log('💾 Inserting records into database...');
        const insertResult = await prisma.mRIncentive.createMany({
            data: records
        });

        console.log(`✅ Inserted ${insertResult.count} MR Incentive records\n`);

        // Verification: Group by category and display summary
        console.log('📋 Summary by Category:');
        const groupedRecords = records.reduce((acc, record) => {
            if (!acc[record.category]) {
                acc[record.category] = [];
            }
            acc[record.category].push(record);
            return acc;
        }, {});

        for (const [category, categoryRecords] of Object.entries(groupedRecords)) {
            console.log(`  ${category}: ${categoryRecords.length} price slabs`);
        }

        console.log('\n🎉 MR Incentive data seeding completed successfully!');

    } catch (error) {
        console.error('❌ Error seeding MR Incentive data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed function
seedMRIncentives()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
