const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function readMRIncentiveData() {
    try {
        console.log('📖 Reading MR Price List Excel...\n');

        const workbook = XLSX.readFile('MR Price List.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to array of arrays
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

        console.log(`Reading sheet: ${sheetName}\n`);
        console.log('All rows:\n');

        data.forEach((row, idx) => {
            // Only show non-empty rows
            if (row.some(cell => cell !== null && cell !== '')) {
                console.log(`Row ${idx + 1}:`, JSON.stringify(row));
            }
        });

    } catch (error) {
        console.error('❌ Error reading Excel:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

readMRIncentiveData()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
