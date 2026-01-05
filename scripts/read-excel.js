const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file
const filePath = path.join(__dirname, '../Excel/Godrej Care+ Price_1 January 2026.xlsx');
const workbook = XLSX.readFile(filePath);

// Get all sheet names
const sheetNames = workbook.SheetNames;
console.log('📊 Sheet Names:', sheetNames);
console.log('\n');

// Read each sheet and display its data
sheetNames.forEach((sheetName) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📄 Sheet: ${sheetName}`);
    console.log('='.repeat(80));

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Display first 20 rows
    data.slice(0, 20).forEach((row, index) => {
        console.log(`Row ${index}:`, row);
    });

    console.log(`\n... (showing first 20 rows of ${data.length} total rows)`);
});
