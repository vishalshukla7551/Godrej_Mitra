import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ase/wallet/balance
 * 
 * Returns the total available balance for an ASE
 * Calculates accumulated incentives that haven't been paid yet
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     totalBalance: 12450,
 *     accumulatedMonths: 1,
 *     lastPaymentDate: "15-11-2024",
 *     lastPaymentAmount: 5200
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserFromCookies();

    if (!authUser || authUser.role !== 'ASE') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch ASE profile
    const aseProfile = await prisma.aSE.findUnique({
      where: { userId: authUser.id },
    });

    if (!aseProfile) {
      return NextResponse.json(
        { success: false, error: 'ASE profile not found' },
        { status: 404 }
      );
    }

    // Calculate current month incentive (accumulated)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const currentMonthSales = await prisma.dailyIncentiveReport.findMany({
      where: {
        storeId: { in: aseProfile.storeIds },
        Date_of_sale: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
      },
    });

    const totalUnits = currentMonthSales.length;
    const qualificationGate = 35;
    let totalBalance = 0;

    if (totalUnits >= qualificationGate) {
      const incentiveRate = totalUnits <= 100 ? 18.75 : 28.75;
      totalBalance = totalUnits * incentiveRate;
    }

    // Calculate last month's payment (for display purposes)
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    const lastMonthStart = new Date(lastMonthYear, lastMonth - 1, 1);
    const lastMonthEnd = new Date(lastMonthYear, lastMonth, 0, 23, 59, 59, 999);

    const lastMonthSales = await prisma.dailyIncentiveReport.findMany({
      where: {
        storeId: { in: aseProfile.storeIds },
        Date_of_sale: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      select: {
        id: true,
      },
    });

    const lastMonthUnits = lastMonthSales.length;
    let lastPaymentAmount = 0;

    if (lastMonthUnits >= qualificationGate) {
      const lastMonthRate = lastMonthUnits <= 100 ? 18.75 : 28.75;
      lastPaymentAmount = lastMonthUnits * lastMonthRate;
    }

    // Last payment date would be 15th of current month
    const lastPaymentDate = `15-${currentMonth.toString().padStart(2, '0')}-${currentYear}`;

    return NextResponse.json({
      success: true,
      data: {
        totalBalance: Math.round(totalBalance * 100) / 100, // Round to 2 decimal places
        accumulatedMonths: totalBalance > 0 ? 1 : 0,
        lastPaymentDate: lastPaymentAmount > 0 ? lastPaymentDate : null,
        lastPaymentAmount: Math.round(lastPaymentAmount * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error fetching ASE wallet balance:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
