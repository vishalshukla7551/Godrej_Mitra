/**
 * insert_samsung_prisma.ts
 * 
 * Usage:
 * 1. npm install @prisma/client xlsx
 * 2. Set DATABASE_URL env var (same as in schema.prisma)
 * 3. npx tsx scripts/insert_samsung_prisma.ts
 * 
 * The script reads the Excel file and inserts data into MongoDB via Prisma.
 */

import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx/xlsx.mjs";
import * as fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const EXCEL_PATH = process.env.EXCEL_PATH || path.join(process.cwd(), "Excel/Samsung SKU with Plan Price.xlsx");

/**
 * Map Excel column headers to PlanType enum values
 */
function mapColumnToPlanType(columnName: string): string | null {
  const normalized = columnName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  
  const mapping: Record<string, string> = {
    'screen-protect-1-yr': 'SCREEN_PROTECT_1_YR',
    'screen-protect-1-year': 'SCREEN_PROTECT_1_YR',
    'screen-protection-1-yr': 'SCREEN_PROTECT_1_YR',
    'adld-1-yr': 'ADLD_1_YR',
    'adld-1-year': 'ADLD_1_YR',
    'combo-2yrs': 'COMBO_2_YRS',
    'combo-2-yrs': 'COMBO_2_YRS',
    'combo-2-years': 'COMBO_2_YRS',
    'extended-warranty-1-yr': 'EXTENDED_WARRANTY_1_YR',
    'extended-warranty-1-year': 'EXTENDED_WARRANTY_1_YR',
    'test-plan': 'TEST_PLAN',
  };
  
  return mapping[normalized] || null;
}

interface SamsungRow {
  Category?: string;
  Model_Name?: string;
  [key: string]: any;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Samsung SKU Import Script');
  console.log('='.repeat(60));
  console.log(`Excel file path: ${EXCEL_PATH}\n`);

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`❌ Excel file not found at: ${EXCEL_PATH}`);
    console.error('\nPlease ensure the file exists at the specified location.');
    process.exit(1);
  }

  console.log('✅ Excel file found');
  console.log('📖 Reading Excel file...\\n');

  // Configure XLSX to use Node fs implementation
  XLSX.set_fs(fs);

  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  console.log(`Sheet name: ${sheetName}`);

  const rows = XLSX.utils.sheet_to_json<SamsungRow>(sheet, { defval: '' });
  
  if (!rows || rows.length === 0) {
    console.error('❌ No rows found in the Excel sheet.');
    return;
  }

  console.log(`Found ${rows.length} rows in Excel\n`);

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  const deletePlans = await prisma.plan.deleteMany({});
  const deleteSKUs = await prisma.samsungSKU.deleteMany({});
  console.log(`   Deleted ${deletePlans.count} plans and ${deleteSKUs.count} SKUs\n`);

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  console.log('📝 Processing rows...\n');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Extract Category and Model Name
    const category = (
      row.Category || 
      (row as any).category || 
      ''
    ).toString().trim();

    const modelName = (
      row.Model_Name || 
      (row as any).Model || 
      (row as any).model_name || 
      (row as any)['Model Name'] || 
      ''
    ).toString().trim();

    if (!category || !modelName) {
      console.log(`⏭️  Row ${i + 1}: Skipping - missing Category or Model Name`);
      skipped++;
      continue;
    }

    // Find or create SamsungSKU
    let samsungSKU = await prisma.samsungSKU.findFirst({
      where: {
        Category: category,
        ModelName: modelName,
      },
    });

    if (!samsungSKU) {
      samsungSKU = await prisma.samsungSKU.create({
        data: {
          Category: category,
          ModelName: modelName,
        },
      });
      console.log(`📦 Created SKU: ${category} | ${modelName}`);
    }

    // Process each column that represents a plan type
    for (const [rawKey, rawValue] of Object.entries(row)) {
      if (!rawKey) continue;
      
      // Skip the Category and Model columns
      if (rawKey === 'Category' || rawKey.toLowerCase() === 'category') continue;
      if (rawKey === 'Model_Name' || rawKey === 'Model' || rawKey.toLowerCase() === 'model_name') continue;
      if (rawKey.toLowerCase() === 'model name') continue;

      const columnLabel = rawKey.toString().trim();
      if (!columnLabel) continue;

      // Parse the price
      const priceStr = String(rawValue).replace(/[,₹\s]/g, '');
      const numeric = Number(priceStr);
      
      if (!Number.isFinite(numeric) || numeric <= 0) {
        continue; // Skip invalid or zero prices
      }

      // Map column name to PlanType enum
      const planType = mapColumnToPlanType(columnLabel);
      
      if (!planType) {
        if (!errors.includes(columnLabel)) {
          console.warn(`⚠️  Unknown plan type column: "${columnLabel}" - skipping`);
          errors.push(columnLabel);
        }
        skipped++;
        continue;
      }

      try {
        // Check if plan already exists for this SKU
        const existingPlan = await prisma.plan.findFirst({
          where: {
            samsungSKUId: samsungSKU.id,
            planType: planType as any,
          },
        });

        if (existingPlan) {
          // Update price if different
          if (existingPlan.price !== Math.trunc(numeric)) {
            await prisma.plan.update({
              where: { id: existingPlan.id },
              data: { price: Math.trunc(numeric) },
            });
            console.log(`🔄 Updated: ${category} | ${modelName} | ${planType} → ₹${numeric.toFixed(2)}`);
          }
        } else {
          // Create new plan
          await prisma.plan.create({
            data: {
              planType: planType as any,
              price: Math.trunc(numeric),
              samsungSKUId: samsungSKU.id,
            },
          });
          console.log(`✅ Created: ${category} | ${modelName} | ${planType} → ₹${numeric.toFixed(2)}`);
          inserted++;
        }
      } catch (error) {
        console.error(`❌ Row ${i + 1}: Error processing ${category} - ${modelName} - ${planType}:`, error);
        errors.push(`Row ${i + 1}: ${category} - ${modelName} - ${planType}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Import Summary');
  console.log('='.repeat(60));
  console.log(`📊 Total Excel rows: ${rows.length}`);
  console.log(`✅ Successfully inserted: ${inserted} plan prices`);
  console.log(`⏭️  Skipped: ${skipped} entries`);
  console.log(`❌ Errors: ${errors.length}`);
  console.log('='.repeat(60));

  if (errors.length > 0 && errors.length <= 10) {
    console.log('\n⚠️  Error details:');
    errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n✅ Import completed!');
}

main()
  .catch((e) => {
    console.error('\n❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
