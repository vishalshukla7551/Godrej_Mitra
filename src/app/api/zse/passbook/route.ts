import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/zse/passbook
 * 
 * Returns historical incentive transaction data for a ZSE
 * Calculates incentives for each month based on DailyIncentiveReport data from all stores under ZSE's ASEs
 * 
 * ZSE Incentive Logic:
 * - Qualification Gate: 300 units minimum
 * - If units < 300: No incentive (₹0)
 * - If units >= 300 and <= 800: All units × ₹8.75
 * - If units > 800: All units × ₹12.5
 * 
 * Query Parameters:
 * - limit: Number of months to return (default: 12)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     zse: { id, name, phone, aseCount, storeCount },
 *     transactions: [
 *       {
 *         month: "Dec 24",
 *         monthNum: 12,
 *         year: 2024,
 *         totalUnits: 350,
 *         incentive: 3062.5,
 *         qualified: true,
 *         incentiveRate: 8.75,
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

    if (!authUser || authUser.role !== 'ZSE') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');

    // Fetch ZSE profile
    const zseProfile = await prisma.zSE.findUnique({
      where: { userId: authUser.id },
      include: {
        user: true,
      },
    });

    if (!zseProfile) {
      return NextResponse.json(
        { success: false, error: 'ZSE profile not found' },
        { status: 404 }
      );
    }

    // Get all ASEs under this ZSE
    const ases = await prisma.aSE.findMany({
      where: { zseId: zseProfile.id },
      select: {
        id: true,
        storeIds: true,
      },
    });

    // Get union of all store IDs from all ASEs
    const allStoreIds = [...new Set(ases.flatMap(ase => ase.storeIds))];

    if (allStoreIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          zse: {
            id: zseProfile.id,
            name: zseProfile.fullName,
            phone: zseProfile.phone,
            aseCount: ases.length,
            storeCount: 0,
          },
          transactions: [],
        },
      });
    }

    // Get all sales data for stores under this ZSE
    const allSales = await prisma.dailyIncentiveReport.findMany({
      where: {
        storeId: { in: allStoreIds },
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
          zse: {
            id: zseProfile.id,
            name: zseProfile.fullName,
            phone: zseProfile.phone,
            aseCount: ases.length,
            storeCount: allStoreIds.length,
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

      // ZSE Incentive Logic:
      // Qualification Gate: 300 units minimum
      // If units < 300: No incentive (₹0)
      // If units >= 300 and <= 800: All units × ₹8.75
      // If units > 800: All units × ₹12.5
      const qualificationGate = 300;
      let qualified = false;
      let incentiveRate = 0;
      let totalIncentive = 0;

      if (totalUnits >= qualificationGate) {
        qualified = true;
        if (totalUnits <= 800) {
          incentiveRate = 8.75;
        } else {
          incentiveRate = 12.5;
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
        zse: {
          id: zseProfile.id,
          name: zseProfile.fullName,
          phone: zseProfile.phone,
          aseCount: ases.length,
          storeCount: allStoreIds.length,
        },
        transactions,
      },
    });
  } catch (error) {
    console.error('Error fetching ZSE passbook:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
