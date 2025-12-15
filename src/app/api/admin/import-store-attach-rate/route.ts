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

    // Read file content
    const buffer = await file.arrayBuffer();
    let data: any[][];

    try {
      if (file.name.endsWith('.csv')) {
        // Parse CSV
        const text = new TextDecoder().decode(buffer);
        const lines = text.split('\n').filter(line => line.trim());
        data = lines.map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
      } else {
        // Parse Excel
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to parse file. Please check the file format.' },
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
    const requiredHeaders = ['store id', 'store name', 'start period', 'end period', 'attach percentage'];
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
    const validateDate = (dateStr: string, fieldName: string, rowNum: number): string | null => {
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
      
      return dateStr;
    };

    // Get column indices
    const storeIdIndex = headers.indexOf('store id');
    const storeNameIndex = headers.indexOf('store name');
    const startPeriodIndex = headers.indexOf('start period');
    const endPeriodIndex = headers.indexOf('end period');
    const attachPercentageIndex = headers.indexOf('attach percentage');

    const errors: string[] = [];
    const processedRecords: any[] = [];
    let successCount = 0;

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because we start from row 2 (after header)

      try {
        const storeId = row[storeIdIndex]?.toString().trim();
        const storeName = row[storeNameIndex]?.toString().trim();
        const startPeriod = row[startPeriodIndex]?.toString().trim();
        const endPeriod = row[endPeriodIndex]?.toString().trim();
        const attachPercentageStr = row[attachPercentageIndex]?.toString().trim();

        // Validate required fields
        if (!storeId) {
          errors.push(`Row ${rowNum}: Store ID is required`);
          continue;
        }

        if (!startPeriod) {
          errors.push(`Row ${rowNum}: Start Period is required`);
          continue;
        }

        if (!endPeriod) {
          errors.push(`Row ${rowNum}: End Period is required`);
          continue;
        }

        // Validate date formats
        const validStartPeriod = validateDate(startPeriod, 'Start Period', rowNum);
        const validEndPeriod = validateDate(endPeriod, 'End Period', rowNum);
        
        if (!validStartPeriod || !validEndPeriod) {
          continue; // Skip this row due to date validation errors
        }

        // Check if start date is before or equal to end date
        const startDate = new Date(startPeriod.split('-').reverse().join('-'));
        const endDate = new Date(endPeriod.split('-').reverse().join('-'));
        
        if (startDate > endDate) {
          errors.push(`Row ${rowNum}: Start Period (${startPeriod}) must be before or equal to End Period (${endPeriod})`);
          continue;
        }

        if (!attachPercentageStr) {
          errors.push(`Row ${rowNum}: Attach Percentage is required`);
          continue;
        }

        // Parse and validate attach percentage
        const attachPercentage = parseFloat(attachPercentageStr.replace('%', ''));
        if (isNaN(attachPercentage) || attachPercentage < 0 || attachPercentage > 100) {
          errors.push(`Row ${rowNum}: Attach Percentage must be a number between 0 and 100 (got: "${attachPercentageStr}")`);
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
        
        console.log(`[Import] Store found: ${store.name}`);

        // Convert percentage to decimal (25.5% -> 0.255)
        const attachRate = attachPercentage / 100;

        // Create or update periodic attach rate using the validated date strings
        console.log(`[Import] Creating/updating attach rate for store ${storeId}, period ${validStartPeriod} to ${validEndPeriod}, rate ${attachRate}`);
        const attachRateRecord = await prisma.periodicAttachRate.upsert({
          where: {
            storeId_start_end: {
              storeId: storeId,
              start: validStartPeriod,
              end: validEndPeriod
            }
          },
          update: {
            attachPercentage: attachRate,
            updatedAt: new Date()
          },
          create: {
            storeId: storeId,
            start: validStartPeriod,
            end: validEndPeriod,
            attachPercentage: attachRate
          }
        });

        processedRecords.push({
          storeId,
          storeName,
          startPeriod: validStartPeriod,
          endPeriod: validEndPeriod,
          attachPercentage: attachRate,
          recordId: attachRateRecord.id
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
        ? `Successfully imported ${successCount} store attach rate records.`
        : 'No records were imported due to errors.',
      processed: successCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Limit to first 10 errors
    };

    if (errors.length > 10) {
      response.errors?.push(`... and ${errors.length - 10} more errors`);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in import-store-attach-rate API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}