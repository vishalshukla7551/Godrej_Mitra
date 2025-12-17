import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/ase/incentive/calculate
 * Calculate ASE monthly incentive based on total units sold
 * 
 * Logic:
 * - Qualification Gate: 35 units minimum
 * - If units < 35: No incentive
 * - If units >= 35 and <= 100: All units × ₹18.75
 * - If units > 100: All units × ₹28.75
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ASE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const monthParam = url.searchParams.get('month'); // e.g., "1" for January
    const yearParam = url.searchParams.get('year'); // e.g., "2024"

    if (!monthParam || !yearParam) {
      return NextResponse.json(
        { error: 'Month and year parameters are required' },
        { status: 400 }
      );
    }

    const month = parseInt(monthParam);
    const year = parseInt(yearParam);

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month or year' },
        { status: 400 }
      );
    }

    // Get ASE profile
    const aseProfile = await prisma.aSE.findUnique({
      where: { userId: authUser.id },
    });

    if (!aseProfile) {
      return NextResponse.json(
        { error: 'ASE profile not found' },
        { status: 404 }
      );
    }

    // Fetch stores information
    const stores = await prisma.store.findMany({
      where: {
        id: { in: aseProfile.storeIds },
      },
      select: {
        id: true,
        name: true,
        city: true,
      },
    });

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    console.log('ASE INCENTIVE CALCULATION');
    console.log('ASE ID:', aseProfile.id);
    console.log('ASE Name:', aseProfile.fullName);
    console.log('Number of Stores:', stores.length);
    console.log('Period:', `${month}/${year}`);
    console.log('Date Range:', startDate, 'to', endDate);

    // Get all sales for this ASE's stores in the given month
    const sales = await prisma.dailyIncentiveReport.findMany({
      where: {
        storeId: {
          in: aseProfile.storeIds,
        },
        Date_of_sale: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        samsungSKU: {
          select: {
            ModelName: true,
          },
        },
        plan: {
          select: {
            planType: true,
          },
        },
        store: {
          select: {
            name: true,
            city: true,
          },
        },
      },
    });

    const totalUnits = sales.length;
    console.log('Total Units Sold:', totalUnits);

    // Calculate incentive based on qualification gate
    let incentiveAmount = 0;
    let incentiveRate = 0;
    let qualified = false;
    let qualificationStatus = '';

    if (totalUnits < 35) {
      qualificationStatus = 'Not Qualified (Minimum 35 units required)';
      incentiveAmount = 0;
    } else if (totalUnits >= 35 && totalUnits <= 100) {
      qualified = true;
      incentiveRate = 18.75;
      incentiveAmount = totalUnits * incentiveRate;
      qualificationStatus = 'Qualified - Tier 1 (35-100 units)';
    } else {
      // totalUnits > 100
      qualified = true;
      incentiveRate = 28.75;
      incentiveAmount = totalUnits * incentiveRate;
      qualificationStatus = 'Qualified - Tier 2 (>100 units)';
    }

    console.log('Qualification Status:', qualificationStatus);
    console.log('Incentive Rate:', `₹${incentiveRate}`);
    console.log('Total Incentive:', `₹${incentiveAmount}`);

    // Group sales by store
    const salesByStore: Record<string, any[]> = {};
    sales.forEach((sale) => {
      const storeId = sale.storeId;
      if (!salesByStore[storeId]) {
        salesByStore[storeId] = [];
      }
      salesByStore[storeId].push(sale);
    });

    const storeBreakdown = Object.entries(salesByStore).map(([storeId, storeSales]) => {
      const store = storeSales[0].store;
      return {
        storeId,
        storeName: store.name,
        storeCity: store.city || 'N/A',
        units: storeSales.length,
      };
    });

    // Group sales by date
    const salesByDate: Record<string, any[]> = {};
    sales.forEach((sale) => {
      const date = sale.Date_of_sale;
      const dateKey = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = [];
      }
      salesByDate[dateKey].push(sale);
    });

    const dailyBreakdown = Object.entries(salesByDate)
      .map(([date, dailySales]) => ({
        date,
        units: dailySales.length,
      }))
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('-').map(Number);
        const [dayB, monthB, yearB] = b.date.split('-').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateA.getTime() - dateB.getTime();
      });

    return NextResponse.json({
      success: true,
      data: {
        ase: {
          id: aseProfile.id,
          name: aseProfile.fullName,
          phone: aseProfile.phone,
          storeCount: stores.length,
        },
        period: {
          month,
          year,
          monthName: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' }),
        },
        summary: {
          totalUnits,
          qualified,
          qualificationGate: 35,
          qualificationStatus,
          incentiveRate,
          totalIncentive: incentiveAmount,
        },
        breakdown: {
          byStore: storeBreakdown,
          byDate: dailyBreakdown,
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/ase/incentive/calculate', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
