import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ase/passbook
 * 
 * Returns historical incentive transaction data for an ASE
 * Calculates incentives for each month based on DailyIncentiveReport data
 * 
 * Query Parameters:
 * - limit: Number of months to return (default: 12)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     ase: { id, name, phone, storeCount },
 *     transactions: [
 *       {
 *         month: "Dec 24",
 *         monthNum: 12,
 *         year: 2024,
 *         totalUnits: 45,
 *         incentive: 1293.75,
 *         qualified: true,
 *         incentiveRate: 28.75,
 *         status: "Paid" | "Accumulated",
 *         paymentDate: "15-12-2024" | null
 *       }
 *     ]
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

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');

    // Fetch ASE profile
    const aseProfile = await prisma.aSE.findUnique({
      where: { userId: authUser.id },
      include: {
        user: true,
      },
    });

    if (!aseProfile) {
      return NextResponse.json(
        { success: false, error: 'ASE profile not found' },
        { status: 404 }
      );
    }

    // Get all sales data for this ASE to find the date range
    const allSales = await prisma.dailyIncentiveReport.findMany({
      where: {
        storeId: { in: aseProfile.storeIds },
      },
      select: {
        Date_of_sale: true,
      },
      orderBy: {
        Date_of_sale: 'asc',
      },
    });

    if (allSales.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          ase: {
            id: aseProfile.id,
            name: aseProfile.fullName,
            phone: aseProfile.phone,
            storeCount: aseProfile.storeIds.length,
          },
          transactions: [],
        },
      });
    }

    const currentDate = new Date();

    // Group sales by month-year
    const salesByMonth: Record<string, number> = {};
    
    allSales.forEach((sale) => {
      const date = new Date(sale.Date_of_sale);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + 1;
    });

    // Generate transactions for all months with data, sorted newest first
    const transactions = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Sort month keys in descending order (newest first)
    const sortedMonthKeys = Object.keys(salesByMonth).sort((a, b) => b.localeCompare(a));
    
    // Apply limit if specified
    const monthsToShow = limit > 0 ? sortedMonthKeys.slice(0, limit) : sortedMonthKeys;

    for (const monthKey of monthsToShow) {
      const [yearStr, monthStr] = monthKey.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      const totalUnits = salesByMonth[monthKey];

      // ASE Incentive Logic:
      // Qualification Gate: 35 units minimum
      // If units < 35: No incentive (₹0)
      // If units >= 35 and <= 100: All units × ₹18.75
      // If units > 100: All units × ₹28.75
      const qualificationGate = 35;
      let qualified = false;
      let incentiveRate = 0;
      let totalIncentive = 0;

      if (totalUnits >= qualificationGate) {
        qualified = true;
        if (totalUnits <= 100) {
          incentiveRate = 18.75;
        } else {
          incentiveRate = 28.75;
        }
        totalIncentive = totalUnits * incentiveRate;
      }

      // Determine status and payment date
      // Current month is "Accumulated", previous months are "Paid"
      const isCurrentMonth = year === currentDate.getFullYear() && month === currentDate.getMonth() + 1;
      const status = isCurrentMonth ? 'Accumulated' : 'Paid';
      
      // For paid months, set payment date to 15th of the following month
      let paymentDate = null;
      if (status === 'Paid') {
        const paymentMonth = month === 12 ? 1 : month + 1;
        const paymentYear = month === 12 ? year + 1 : year;
        paymentDate = `15-${paymentMonth.toString().padStart(2, '0')}-${paymentYear}`;
      }

      const monthName = `${monthNames[month - 1]} ${year.toString().slice(-2)}`;

      transactions.push({
        month: monthName,
        monthNum: month,
        year: year,
        totalUnits,
        incentive: totalIncentive,
        qualified,
        incentiveRate,
        status,
        paymentDate,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ase: {
          id: aseProfile.id,
          name: aseProfile.fullName,
          phone: aseProfile.phone,
          storeCount: aseProfile.storeIds.length,
        },
        transactions,
      },
    });
  } catch (error) {
    console.error('Error fetching ASE passbook:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
