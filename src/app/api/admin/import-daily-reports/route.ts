import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type - only Excel files allowed
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, message: 'Only Excel files (.xlsx, .xls) are supported. Please use the downloaded template.' },
        { status: 400 }
      );
    }

    // Read Excel file content
    const buffer = await file.arrayBuffer();
    let data: any[][];

    try {
      // Parse Excel file
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      // Use the first sheet (Daily Reports Template)
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log(`[Import] Processing Excel file with sheet: "${sheetName}"`);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to parse Excel file. Please ensure you are using the correct template format.' },
        { status: 400 }
      );
    }

    if (data.length < 2) {
      return NextResponse.json(
        { success: false, message: 'File must contain at least a header row and one data row.' },
        { status: 400 }
      );
    }

    const headers = data[0].map((h: string) => h.toLowerCase().trim());
    const rows = data.slice(1);

    // Validate headers
    const requiredHeaders = ['store id', 'samsung sku id', 'plan id', 'imei', 'date of sale'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Missing required columns: ${missingHeaders.join(', ')}. Please check the template.` 
        },
        { status: 400 }
      );
    }

    // Helper function to validate and parse date in dd-mm-yyyy format
    const validateDate = (dateStr: string, fieldName: string, rowNum: number): Date | null => {
      const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
      const match = dateStr.match(dateRegex);
      
      if (!match) {
        errors.push(`Row ${rowNum}: ${fieldName} must be in dd-mm-yyyy format (got: "${dateStr}")`);
        return null;
      }
      
      const [, day, month, year] = match;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      // Check if the date is valid
      if (date.getDate() !== parseInt(day) || 
          date.getMonth() !== parseInt(month) - 1 || 
          date.getFullYear() !== parseInt(year)) {
        errors.push(`Row ${rowNum}: ${fieldName} is not a valid date (got: "${dateStr}")`);
        return null;
      }
      
      return date;
    };

    // Helper function to validate ObjectId format
    const isValidObjectId = (id: string): boolean => {
      return /^[0-9a-fA-F]{24}$/.test(id);
    };

    // Get column indices
    const storeIdIndex = headers.indexOf('store id');
    const samsungSKUIdIndex = headers.indexOf('samsung sku id');
    const planIdIndex = headers.indexOf('plan id');
    const imeiIndex = headers.indexOf('imei');
    const dateOfSaleIndex = headers.indexOf('date of sale');

    const errors: string[] = [];
    const processedRecords: any[] = [];
    let successCount = 0;

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because we start from row 2 (after header)

      try {
        const storeId = row[storeIdIndex]?.toString().trim();
        const samsungSKUId = row[samsungSKUIdIndex]?.toString().trim();
        const planId = row[planIdIndex]?.toString().trim();
        const imei = row[imeiIndex]?.toString().trim();
        const dateOfSaleStr = row[dateOfSaleIndex]?.toString().trim();

        // Validate required fields
        if (!storeId) {
          errors.push(`Row ${rowNum}: Store ID is required`);
          continue;
        }

        if (!samsungSKUId) {
          errors.push(`Row ${rowNum}: Samsung SKU ID is required`);
          continue;
        }

        if (!planId) {
          errors.push(`Row ${rowNum}: Plan ID is required`);
          continue;
        }

        if (!imei) {
          errors.push(`Row ${rowNum}: IMEI is required`);
          continue;
        }

        if (!dateOfSaleStr) {
          errors.push(`Row ${rowNum}: Date of Sale is required`);
          continue;
        }

        // Validate ObjectId formats
        if (!isValidObjectId(samsungSKUId)) {
          errors.push(`Row ${rowNum}: Samsung SKU ID must be a valid ObjectId (24 hex characters) (got: "${samsungSKUId}")`);
          continue;
        }

        if (!isValidObjectId(planId)) {
          errors.push(`Row ${rowNum}: Plan ID must be a valid ObjectId (24 hex characters) (got: "${planId}")`);
          continue;
        }

        // Validate date format
        const dateOfSale = validateDate(dateOfSaleStr, 'Date of Sale', rowNum);
        if (!dateOfSale) {
          continue; // Skip this row due to date validation error
        }

        // Validate IMEI format (15 digits)
        if (!/^\d{15}$/.test(imei)) {
          errors.push(`Row ${rowNum}: IMEI must be exactly 15 digits (got: "${imei}")`);
          continue;
        }

        // Check if IMEI already exists
        const existingReport = await prisma.dailyIncentiveReport.findUnique({
          where: { imei: imei }
        });

        if (existingReport) {
          errors.push(`Row ${rowNum}: IMEI "${imei}" already exists in the database`);
          continue;
        }

        // Check if store exists
        console.log(`[Import] Checking store with ID: "${storeId}"`);
        const store = await prisma.store.findUnique({
          where: { id: storeId }
        });

        if (!store) {
          console.log(`[Import] Store not found: "${storeId}"`);
          errors.push(`Row ${rowNum}: Store with ID "${storeId}" not found`);
          continue;
        }

        // Check if Samsung SKU exists
        console.log(`[Import] Checking Samsung SKU with ID: "${samsungSKUId}"`);
        const samsungSKU = await prisma.samsungSKU.findUnique({
          where: { id: samsungSKUId }
        });

        if (!samsungSKU) {
          console.log(`[Import] Samsung SKU not found: "${samsungSKUId}"`);
          errors.push(`Row ${rowNum}: Samsung SKU with ID "${samsungSKUId}" not found`);
          continue;
        }

        // Check if Plan exists
        console.log(`[Import] Checking Plan with ID: "${planId}"`);
        const plan = await prisma.plan.findUnique({
          where: { id: planId }
        });

        if (!plan) {
          console.log(`[Import] Plan not found: "${planId}"`);
          errors.push(`Row ${rowNum}: Plan with ID "${planId}" not found`);
          continue;
        }



        // Create daily incentive report
        console.log(`[Import] Creating daily report for IMEI ${imei}, store ${storeId}, date ${dateOfSale.toISOString()}`);
        const dailyReport = await prisma.dailyIncentiveReport.create({
          data: {
            secId: null, // SEC ID not provided in import
            storeId: storeId,
            samsungSKUId: samsungSKUId,
            planId: planId,
            imei: imei,
            Date_of_sale: dateOfSale,
            metadata: null // Metadata not provided in import
          }
        });

        processedRecords.push({
          id: dailyReport.id,
          storeId,
          samsungSKUId,
          planId,
          imei,
          dateOfSale: dateOfSale.toISOString()
        });

        successCount++;

      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error);
        errors.push(`Row ${rowNum}: Database error - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Return results
    const response = {
      success: successCount > 0,
      message: successCount > 0 
        ? `Successfully imported ${successCount} daily report records.`
        : 'No records were imported due to errors.',
      processed: successCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Limit to first 10 errors
    };

    if (errors.length > 10) {
      response.errors?.push(`... and ${errors.length - 10} more errors`);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in import-daily-reports API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}