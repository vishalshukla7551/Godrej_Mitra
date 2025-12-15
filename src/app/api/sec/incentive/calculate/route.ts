import { NextRequest, NextResponse } from 'next/server';
import { IncentiveService } from '@/lib/services/IncentiveService';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/sec/incentive/calculate?month=<month>&year=<year>&numberOfSECs=<numberOfSECs>
// Calculate monthly incentive for a SEC user
export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');
    const numberOfSecStr = searchParams.get('numberOfSECs');

    // Validation
    if (!monthStr || !yearStr) {
      return NextResponse.json(
        { error: 'month and year are required' },
        { status: 400 }
      );
    }

    const month = parseInt(monthStr);
    const year = parseInt(yearStr);

    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month. Must be between 1 and 12' },
        { status: 400 }
      );
    }

    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: 'Invalid year' },
        { status: 400 }
      );
    }

    // Get SEC phone from auth (consistent with passbook API)
    const phone = authUser.username;
    if (!phone) {
      return NextResponse.json(
        { error: 'Missing SEC identifier' },
        { status: 400 }
      );
    }
    
    // Fetch SEC user with store information using phone number
    const secUser = await prisma.sEC.findUnique({
      where: { phone },
      include: {
        store: true
      }
    });

    if (!secUser || !secUser.storeId) {
      return NextResponse.json(
        { error: 'SEC user not found or not assigned to a store' },
        { status: 404 }
      );
    }
    
    // Use the actual SEC ObjectID for the calculation
    const secId = secUser.id;

    // Get number of SECs from query parameter (required)
    if (!numberOfSecStr) {
      return NextResponse.json(
        { error: 'numberOfSECs is required' },
        { status: 400 }
      );
    }

    const numberOfSec = parseInt(numberOfSecStr);
    if (isNaN(numberOfSec) || numberOfSec < 1) {
      return NextResponse.json(
        { error: 'Invalid numberOfSECs. Must be at least 1' },
        { status: 400 }
      );
    }

    // Calculate incentive
    const result = await IncentiveService.calculateMonthlyIncentive(
      secId,
      month,
      year,
      numberOfSec
    );

    return NextResponse.json({
      success: true,
      data: {
        secId,
        month,
        year,
        numberOfSECs: numberOfSec,
        storeId: secUser.storeId,
        storeName: secUser.store?.name ?? null,
        ...result
      }
    });

  } catch (error) {
    console.error('Error in GET /api/sec/incentive/calculate', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to calculate incentive',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}