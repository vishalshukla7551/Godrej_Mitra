import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/abm/leaderboard
 * Returns ABM vs ABM leaderboard - all ABMs competing against each other
 * Shows ABM name, number of stores under them, and total sales/incentives
 * Data fetched from SpotIncentiveReport schema
 * - month query: number (1-12)
 * - year query: number (e.g., 2024)
 * - limit query: number (default: 20)
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ABM') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current ABM profile
    const currentAbm = await prisma.aBM.findUnique({
      where: { userId: authUser.id },
      select: {
        id: true,
        fullName: true,
        storeIds: true
      }
    });

    if (!currentAbm) {
      return NextResponse.json({ error: 'ABM profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const limit = parseInt(searchParams.get('limit') || '20');

    // Calculate date range for the selected month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all ABMs with their store assignments
    const allAbms = await prisma.aBM.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        storeIds: true,
        userId: true,
        zsmId: true
      }
    });

    // Get all ZSMs for region info
    const allZsms = await prisma.zSM.findMany({
      select: {
        id: true,
        fullName: true,
        region: true
      }
    });
    const zsmMap = new Map(allZsms.map(z => [z.id, z]));

    // Build ABM leaderboard data
    const abmLeaderboard = await Promise.all(
      allAbms.map(async (abm) => {
        const zsm = abm.zsmId ? zsmMap.get(abm.zsmId) : null;
        
        if (!abm.storeIds || abm.storeIds.length === 0) {
          return {
            abmId: abm.id,
            abmName: abm.fullName || 'Unknown ABM',
            phone: abm.phone,
            zsmName: zsm?.fullName || null,
            region: zsm?.region || null,
            storeCount: 0,
            activeStoreCount: 0,
            totalSales: 0,
            totalIncentive: 0,
            adldUnits: 0,
            comboUnits: 0,
            adldRevenue: 0,
            comboRevenue: 0,
            isCurrentUser: abm.id === currentAbm.id
          };
        }

        // Get sales reports for this ABM's stores within the month
        const salesReports = await prisma.spotIncentiveReport.findMany({
          where: {
            storeId: { in: abm.storeIds },
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
          abmId: abm.id,
          abmName: abm.fullName || 'Unknown ABM',
          phone: abm.phone,
          zsmName: zsm?.fullName || null,
          region: zsm?.region || null,
          storeCount: abm.storeIds.length,
          activeStoreCount: activeStoreIds.size,
          totalSales: salesReports.length,
          totalIncentive,
          adldUnits,
          comboUnits,
          adldRevenue,
          comboRevenue,
          isCurrentUser: abm.id === currentAbm.id
        };
      })
    );

    // Sort by total sales (descending) and assign ranks
    const sortedLeaderboard = abmLeaderboard
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit)
      .map((abm, index) => ({
        rank: index + 1,
        ...abm,
        totalIncentive: abm.totalIncentive > 0 ? `₹${abm.totalIncentive.toLocaleString('en-IN')}` : '₹0',
        totalIncentiveRaw: abm.totalIncentive,
        adldRevenue: abm.adldRevenue > 0 ? `₹${abm.adldRevenue.toLocaleString('en-IN')}` : '₹0',
        comboRevenue: abm.comboRevenue > 0 ? `₹${abm.comboRevenue.toLocaleString('en-IN')}` : '₹0'
      }));

    // Find current user's rank
    const currentUserRank = sortedLeaderboard.find(abm => abm.isCurrentUser)?.rank || 0;

    return NextResponse.json({
      success: true,
      data: {
        abms: sortedLeaderboard,
        period: `${month}/${year}`,
        totalABMs: allAbms.length,
        totalSalesReports: sortedLeaderboard.reduce((sum, abm) => sum + abm.totalSales, 0),
        currentUserRank,
        currentAbmId: currentAbm.id
      }
    });
  } catch (error) {
    console.error('Error in GET /api/abm/leaderboard', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
