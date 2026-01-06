import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Template] Generating daily reports Excel template with Plan data...');

    // Fetch all Plan documents with related data
    const plans = await prisma.plan.findMany({
      include: {
        GodrejSKU: {
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

    console.log(`[Template] Found ${plans.length} plans`);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Daily Reports Template
    const templateData = [
      ['Store ID', 'Samsung SKU ID', 'Plan ID', 'IMEI', 'Date of Sale'],
      ['store_00001', '675e234567890123456789cd', '675e345678901234567890ef', '123456789012345', '01-01-2024'],
      ['store_00002', '675e234567890123456789cd', '675e345678901234567890ef', '123456789012346', '02-01-2024'],
      ['store_00003', '675e234567890123456789cd', '675e345678901234567890ef', '123456789012347', '03-01-2024']
    ];

    const templateSheet = XLSX.utils.aoa_to_sheet(templateData);
    
    // Set column widths for template sheet
    templateSheet['!cols'] = [
      { width: 15 }, // Store ID
      { width: 30 }, // Samsung SKU ID
      { width: 30 }, // Plan ID
      { width: 20 }, // IMEI
      { width: 15 }  // Date of Sale
    ];

    XLSX.utils.book_append_sheet(workbook, templateSheet, 'Daily Reports Template');

    // Sheet 2: Plan Collection Data
    const planHeaders = [
      'Plan ID',
      'Plan Type',
      'Price (INR)',
      'Samsung SKU ID',
      'Samsung SKU Model Name',
      'Samsung SKU Category',
      'Samsung SKU Price (INR)',
      'Created At',
      'Updated At'
    ];

    const planData: (string | number | null)[][] = [planHeaders];

    // Add plan data rows
    plans.forEach(plan => {
      planData.push([
        plan.id,
        plan.planType,
        plan.PlanPrice,
        plan.godrejSKUId || '',
        plan.GodrejSKU?.ModelName || '',
        plan.GodrejSKU?.Category || '',
        plan.GodrejSKU?.ModelPrice || '',
        '',
        ''
      ]);
    });

    const planSheet = XLSX.utils.aoa_to_sheet(planData);
    
    // Set column widths for plan sheet
    planSheet['!cols'] = [
      { width: 30 }, // Plan ID
      { width: 25 }, // Plan Type
      { width: 15 }, // Price
      { width: 30 }, // Samsung SKU ID
      { width: 30 }, // Samsung SKU Model Name
      { width: 20 }, // Samsung SKU Category
      { width: 20 }, // Samsung SKU Price
      { width: 15 }, // Created At
      { width: 15 }  // Updated At
    ];

    XLSX.utils.book_append_sheet(workbook, planSheet, 'Plan Collection Data');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    });

    console.log('[Template] Excel template generated successfully');

    // Return the Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="daily_reports_template_with_plans.xlsx"',
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to generate template: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}