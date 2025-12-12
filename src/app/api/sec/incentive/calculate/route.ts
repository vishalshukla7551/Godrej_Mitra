import { NextRequest, NextResponse } from 'next/server';
import { IncentiveService } from '@/lib/services/IncentiveService';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/sec/incentive/calculate?secId=<secId>&month=<month>&year=<year>
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
    const secId = searchParams.get('secId');
    const monthStr = searchParams.get('month');
    const yearStr = searchParams.get('year');

    // Validation
    if (!secId) {
      return NextResponse.json(
        { error: 'secId is required' },
        { status: 400 }
      );
    }

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

    // Authorization check - SEC users can only view their own incentives
    // `getAuthenticatedUserFromCookies` sets `id` to the SEC identifier for SEC users,
    // so compare `authUser.id` here instead of a non-existent `secId` property.
    if (authUser.role === 'SEC' && authUser.id !== secId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only view your own incentives' },
        { status: 403 }
      );
    }

    // Calculate incentive
    const result = await IncentiveService.calculateMonthlyIncentive(
      secId,
      month,
      year
    );

    return NextResponse.json({
      success: true,
      data: {
        secId,
        month,
        year,
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
