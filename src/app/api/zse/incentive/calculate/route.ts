import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/zse/incentive/calculate
 * Calculate ZSE monthly incentive based on total units sold across all mapped stores
 * 
 * Logic:
 * - Qualification Gate: 300 units minimum
 * - If units < 300: No incentive (₹0)
 * - If units >= 300 and <= 800: All units × ₹8.75
 * - If units > 800: All units × ₹12.5
 * 
 * ZSE has mapped ASEs, and ASEs have mapped stores, so ZSE indirectly has mapped stores
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserFromCookies();

    if (!authUser || authUser.role !== 'ZSE') {
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

    // Get ZSE profile
    const zseProfile = await prisma.zSE.findUnique({
      where: { userId: authUser.id },
      include: {
        user: true,
      },
    });

    if (!zseProfile) {
      return NextResponse.json(
        { error: 'ZSE profile not found' },
        { status: 404 }
      );
    }

    // Get all ASEs under this ZSE
    const ases = await prisma.aSE.findMany({
      where: { zseId: zseProfile.id },
      select: {
        id: true,
        fullName: true,
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
          period: {
            month,
            year,
            monthName: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' }),
          },
          summary: {
            totalUnits: 0,
            qualified: false,
            qualificationGate: 300,
            qualificationStatus: 'No stores mapped',
            incentiveRate: 0,
            totalIncentive: 0,
          },
          breakdown: {
            byASE: [],
            byStore: [],
            byDate: [],
          },
        },
      });
    }

    // Fetch stores information
    const stores = await prisma.store.findMany({
      where: {
        id: { in: allStoreIds },
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

    console.log('ZSE INCENTIVE CALCULATION');
    console.log('ZSE ID:', zseProfile.id);
    console.log('ZSE Name:', zseProfile.fullName);
    console.log('Number of ASEs:', ases.length);
    console.log('Number of Stores:', stores.length);
    console.log('Period:', `${month}/${year}`);
    console.log('Date Range:', startDate, 'to', endDate);

    // Get all sales for stores under this ZSE in the given month
    const sales = await prisma.dailyIncentiveReport.findMany({
      where: {
        storeId: {
          in: allStoreIds,
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

    if (totalUnits < 300) {
      qualificationStatus = 'Not Qualified (Minimum 300 units required)';
      incentiveAmount = 0;
    } else if (totalUnits >= 300 && totalUnits <= 800) {
      qualified = true;
      incentiveRate = 8.75;
      incentiveAmount = totalUnits * incentiveRate;
      qualificationStatus = 'Qualified - Tier 1 (300-800 units)';
    } else {
      // totalUnits > 800
      qualified = true;
      incentiveRate = 12.5;
      incentiveAmount = totalUnits * incentiveRate;
      qualificationStatus = 'Qualified - Tier 2 (>800 units)';
    }

    console.log('Qualification Status:', qualificationStatus);
    console.log('Incentive Rate:', `₹${incentiveRate}`);
    console.log('Total Incentive:', `₹${incentiveAmount}`);

    // Group sales by ASE
    const salesByASE: Record<string, any[]> = {};
    sales.forEach((sale) => {
      // Find which ASE this store belongs to
      const ase = ases.find(a => a.storeIds.includes(sale.storeId));
      if (ase) {
        if (!salesByASE[ase.id]) {
          salesByASE[ase.id] = [];
        }
        salesByASE[ase.id].push(sale);
      }
    });

    const aseBreakdown = Object.entries(salesByASE).map(([aseId, aseSales]) => {
      const ase = ases.find(a => a.id === aseId);
      return {
        aseId,
        aseName: ase?.fullName || 'Unknown',
        units: aseSales.length,
        storeCount: [...new Set(aseSales.map(s => s.storeId))].length,
      };
    });

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
        zse: {
          id: zseProfile.id,
          name: zseProfile.fullName,
          phone: zseProfile.phone,
          aseCount: ases.length,
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
          qualificationGate: 300,
          qualificationStatus,
          incentiveRate,
          totalIncentive: incentiveAmount,
        },
        breakdown: {
          byASE: aseBreakdown,
          byStore: storeBreakdown,
          byDate: dailyBreakdown,
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/zse/incentive/calculate', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
