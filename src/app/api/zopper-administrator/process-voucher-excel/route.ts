import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import * as XLSX from 'xlsx';

/**
 * POST /api/zopper-administrator/process-voucher-excel
 * Upload Excel file with voucher codes and update SpotIncentiveReport records
 * 
 * Workflow:
 * 1. Admin exports Excel from /Zopper-Administrator/spot-incentive-report
 * 2. Admin fills in "Voucher Code" column in the exported Excel
 * 3. Admin uploads the same Excel file here
 * 4. System matches by "Serial Number" column and updates voucherCode + spotincentivepaidAt
 * 
 * Excel Format (from spot-incentive-report export):
 * - Serial Number (required) - Used for matching
 * - Voucher Code (required) - Value to update
 * - All other columns (optional) - Ignored, used for reference only
 * 
 * Returns: Summary of success/failed/notFound records
 */
export async function POST(req: NextRequest) {
    try {
        const cookies = await (await import('next/headers')).cookies();
        const authUser = await getAuthenticatedUserFromCookies(cookies as any);

        // Authorization check
        if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse form data
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
                { status: 400 }
            );
        }

        // Read file as buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Parse Excel file
        let workbook;
        try {
            workbook = XLSX.read(buffer, { type: 'buffer' });
        } catch (error) {
            console.error('Error parsing Excel file:', error);
            return NextResponse.json(
                { error: 'Failed to parse Excel file. Please ensure it is a valid Excel file.' },
                { status: 400 }
            );
        }

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Excel file is empty. Please add data and try again.' },
                { status: 400 }
            );
        }

        // Initialize results
        const results = {
            total: rows.length,
            updated: 0,
            notFound: 0,
            failed: 0,
            details: {
                success: [] as Array<{ imei: string; voucherCode: string; canvasserName?: string }>,
                notFound: [] as Array<{ imei: string; voucherCode: string; reason: string }>,
                failed: [] as Array<{ imei: string; voucherCode: string; reason: string }>,
            },
        };

        // Process each row
        for (const row of rows as any[]) {
            // Extract Serial Number and Voucher Code
            // Column names match the export from spot-incentive-report page
            const serialNumber = row['Serial Number']; // Exact match from export
            const voucherCode = row['Voucher Code']; // Exact match from export

            // Validation: Check if Serial Number and Voucher Code exist
            if (!serialNumber || !voucherCode) {
                results.failed++;
                results.details.failed.push({
                    imei: serialNumber || 'N/A',
                    voucherCode: voucherCode || 'N/A',
                    reason: 'Missing Serial Number or Voucher Code in Excel row',
                });
                continue;
            }

            // Convert to string and trim
            const imeiStr = String(serialNumber).trim();
            const voucherCodeStr = String(voucherCode).trim();

            // Validate voucher code is not empty
            if (!voucherCodeStr || voucherCodeStr === '') {
                results.failed++;
                results.details.failed.push({
                    imei: imeiStr,
                    voucherCode: voucherCodeStr,
                    reason: 'Voucher Code is empty',
                });
                continue;
            }

            try {
                // Find SpotIncentiveReport by IMEI
                // @ts-ignore - Prisma type generation issue with canvasserUser relation
                const report = await prisma.spotIncentiveReport.findUnique({
                    where: { imei: imeiStr },
                    include: {
                        canvasserUser: true,
                    },
                });

                if (!report) {
                    results.notFound++;
                    results.details.notFound.push({
                        imei: imeiStr,
                        voucherCode: voucherCodeStr,
                        reason: 'Serial Number not found in database',
                    });
                    continue;
                }

                // Check if voucher code already exists (duplicate check)
                const existingVoucher = await prisma.spotIncentiveReport.findFirst({
                    where: {
                        voucherCode: voucherCodeStr,
                        NOT: { id: report.id } // Exclude current record
                    },
                });

                if (existingVoucher) {
                    results.failed++;
                    results.details.failed.push({
                        imei: imeiStr,
                        voucherCode: voucherCodeStr,
                        reason: `Voucher code already assigned to another sale (IMEI: ${existingVoucher.imei})`,
                    });
                    continue;
                }

                // Update the report with voucher code and mark as paid
                await prisma.spotIncentiveReport.update({
                    where: { id: report.id },
                    data: {
                        voucherCode: voucherCodeStr,
                        spotincentivepaidAt: new Date(),
                    },
                });

                results.updated++;
                results.details.success.push({
                    imei: imeiStr,
                    voucherCode: voucherCodeStr,
                    canvasserName: (report as any).canvasserUser?.fullName || 'Unknown',
                });

            } catch (error) {
                console.error(`Error processing IMEI ${imeiStr}:`, error);
                results.failed++;
                results.details.failed.push({
                    imei: imeiStr,
                    voucherCode: voucherCodeStr,
                    reason: 'Database error while processing',
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${results.total} rows: ${results.updated} updated, ${results.notFound} not found, ${results.failed} failed`,
            summary: {
                total: results.total,
                updated: results.updated,
                notFound: results.notFound,
                failed: results.failed,
            },
            details: results.details,
        });

    } catch (error) {
        console.error('Error in POST /api/zopper-administrator/process-voucher-excel:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
