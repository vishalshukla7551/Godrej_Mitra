import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/zsm/leaderboard
 * Returns ZSM vs ZSM leaderboard - all ZSMs competing against each other
 * Shows ZSM name, number of stores under them (via ABMs), and total sales/incentives
 * Data fetched from SpotIncentiveReport schema
 * - month query: number (1-12)
 * - year query: number (e.g., 2024)
 * - limit query: number (default: 20)
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZSM') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current ZSM profile
    const currentZsm = await prisma.zSM.findUnique({
      where: { userId: authUser.id },
      select: {
        id: true,
        fullName: true,
        region: true
      }
    });

    if (!currentZsm) {
      return NextResponse.json({ error: 'ZSM profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const limit = parseInt(searchParams.get('limit') || '20');

    // Calculate date range for the selected month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all ZSMs
    const allZsms = await prisma.zSM.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        region: true,
        userId: true
      }
    });

    // Get all ABMs with their ZSM assignments
    const allAbms = await prisma.aBM.findMany({
      select: {
        id: true,
        zsmId: true,
        storeIds: true
      }
    });

    // Build ZSM leaderboard data
    const zsmLeaderboard = await Promise.all(
      allZsms.map(async (zsm) => {
        // Get all ABMs under this ZSM
        const zsmAbms = allAbms.filter(abm => abm.zsmId === zsm.id);
        
        // Collect all store IDs from ABMs under this ZSM
        const allStoreIds = zsmAbms.flatMap(abm => abm.storeIds || []);

        if (allStoreIds.length === 0) {
          return {
            zsmId: zsm.id,
            zsmName: zsm.fullName || 'Unknown ZSM',
            phone: zsm.phone,
            region: zsm.region || null,
            storeCount: 0,
            abmCount: zsmAbms.length,
            activeStoreCount: 0,
            totalSales: 0,
            totalIncentive: 0,
            adldUnits: 0,
            comboUnits: 0,
            adldRevenue: 0,
            comboRevenue: 0,
            isCurrentUser: zsm.id === currentZsm.id
          };
        }

        // Get sales reports for this ZSM's stores within the month
        const salesReports = await prisma.spotIncentiveReport.findMany({
          where: {
            storeId: { in: allStoreIds },
            Date_of_sale: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            plan: {
              select: { planType: true }
            }
          }
        });

        // Get active stores (stores with at least one sale)
        const activeStoreIds = new Set(salesReports.map(r => r.storeId));

        // Calculate totals
        let totalIncentive = 0;
        let adldUnits = 0;
        let comboUnits = 0;
        let adldRevenue = 0;
        let comboRevenue = 0;

        salesReports.forEach((report) => {
          totalIncentive += report.spotincentiveEarned;
          const planType = report.plan.planType.toUpperCase();
          if (planType.includes('ADLD')) {
            adldUnits++;
            adldRevenue += report.spotincentiveEarned;
          } else if (planType.includes('COMBO')) {
            comboUnits++;
            comboRevenue += report.spotincentiveEarned;
          }
        });

        return {
          zsmId: zsm.id,
          zsmName: zsm.fullName || 'Unknown ZSM',
          phone: zsm.phone,
          region: zsm.region || null,
          storeCount: allStoreIds.length,
          abmCount: zsmAbms.length,
          activeStoreCount: activeStoreIds.size,
          totalSales: salesReports.length,
          totalIncentive,
          adldUnits,
          comboUnits,
          adldRevenue,
          comboRevenue,
          isCurrentUser: zsm.id === currentZsm.id
        };
      })
    );

    // Sort by total sales (descending) and assign ranks
    const sortedLeaderboard = zsmLeaderboard
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit)
      .map((zsm, index) => ({
        rank: index + 1,
        ...zsm,
        totalIncentive: zsm.totalIncentive > 0 ? `₹${zsm.totalIncentive.toLocaleString('en-IN')}` : '₹0',
        totalIncentiveRaw: zsm.totalIncentive,
        adldRevenue: zsm.adldRevenue > 0 ? `₹${zsm.adldRevenue.toLocaleString('en-IN')}` : '₹0',
        comboRevenue: zsm.comboRevenue > 0 ? `₹${zsm.comboRevenue.toLocaleString('en-IN')}` : '₹0'
      }));

    // Find current user's rank
    const currentUserRank = sortedLeaderboard.find(zsm => zsm.isCurrentUser)?.rank || 0;

    return NextResponse.json({
      success: true,
      data: {
        zsms: sortedLeaderboard,
        period: `${month}/${year}`,
        totalZSMs: allZsms.length,
        totalSalesReports: sortedLeaderboard.reduce((sum, zsm) => sum + zsm.totalSales, 0),
        currentUserRank,
        currentZsmId: currentZsm.id
      }
    });
  } catch (error) {
    console.error('Error in GET /api/zsm/leaderboard', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
