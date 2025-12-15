import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function generateCSVTemplate() {
  try {
    console.log('📋 Generating CSV Template with Plan Data...\n');

    // Fetch all Plan documents with related data
    const plans = await prisma.plan.findMany({
      include: {
        samsungSKU: {
          select: {
            id: true,
            ModelName: true,
            Category: true,
            ModelPrice: true
          }
        }
      },
      orderBy: {
        planType: 'asc'
      }
    });

    console.log(`Found ${plans.length} plans in the database`);

    // Create the main template CSV
    const templateContent = `Store ID,Samsung SKU ID,Plan ID,IMEI,Date of Sale
store_00001,675e234567890123456789cd,675e345678901234567890ef,123456789012345,01-01-2024
store_00002,675e234567890123456789cd,675e345678901234567890ef,123456789012346,02-01-2024
store_00003,675e234567890123456789cd,675e345678901234567890ef,123456789012347,03-01-2024`;

    fs.writeFileSync('daily_reports_template.csv', templateContent);
    console.log('✅ Created: daily_reports_template.csv');

    // Create Plan reference CSV
    const planHeaders = 'Plan ID,Plan Type,Price (INR),Samsung SKU ID,Samsung SKU Model Name,Samsung SKU Category,Samsung SKU Price (INR)';
    
    const planRows = plans.map(plan => {
      return [
        plan.id,
        plan.planType,
        plan.price,
        plan.samsungSKUId || '',
        `"${plan.samsungSKU?.ModelName || ''}"`,
        `"${plan.samsungSKU?.Category || ''}"`,
        plan.samsungSKU?.ModelPrice || ''
      ].join(',');
    });

    const planContent = [planHeaders, ...planRows].join('\n');
    fs.writeFileSync('plan_reference_data.csv', planContent);
    console.log('✅ Created: plan_reference_data.csv');

    // Create combined template with instructions
    const combinedContent = `# DAILY REPORTS IMPORT TEMPLATE
# 
# INSTRUCTIONS:
# 1. Use the format below for your import data
# 2. Refer to the Plan IDs in the reference section
# 3. Remove all comment lines (starting with #) before uploading
# 4. Save as CSV format
#
# TEMPLATE FORMAT (copy this structure):
${templateContent}

#
# PLAN REFERENCE DATA (for Plan ID lookup):
${planContent}`;

    fs.writeFileSync('daily_reports_template_with_plans.csv', combinedContent);
    console.log('✅ Created: daily_reports_template_with_plans.csv');

    // Display summary
    console.log('\n📊 Generated Files:');
    console.log('1. daily_reports_template.csv - Clean template for import');
    console.log('2. plan_reference_data.csv - Plan data for reference');
    console.log('3. daily_reports_template_with_plans.csv - Combined template with instructions');

    console.log('\n📋 Plan Summary:');
    const planTypeCount = plans.reduce((acc, plan) => {
      acc[plan.planType] = (acc[plan.planType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(planTypeCount).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} plans`);
    });

    console.log('\n🎉 CSV template generation completed!');

  } catch (error) {
    console.error('❌ Error generating CSV template:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateCSVTemplate();