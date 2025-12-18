import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/zse/leaderboard
 * Returns ZSE vs ZSE leaderboard - all ZSEs competing against each other
 * Shows ZSE name, number of stores under them (via ASEs), and total sales/incentives
 * Data fetched from SpotIncentiveReport schema
 * - month query: number (1-12)
 * - year query: number (e.g., 2024)
 * - limit query: number (default: 20)
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZSE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current ZSE profile
    const currentZse = await prisma.zSE.findUnique({
      where: { userId: authUser.id },
      select: {
        id: true,
        fullName: true,
        region: true
      }
    });

    if (!currentZse) {
      return NextResponse.json({ error: 'ZSE profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const limit = parseInt(searchParams.get('limit') || '20');

    // Calculate date range for the selected month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Get all ZSEs
    const allZses = await prisma.zSE.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        region: true,
        userId: true
      }
    });

    // Get all ASEs with their ZSE assignments
    const allAses = await prisma.aSE.findMany({
      select: {
        id: true,
        zseId: true,
        storeIds: true
      }
    });

    // Build ZSE leaderboard data
    const zseLeaderboard = await Promise.all(
      allZses.map(async (zse) => {
        // Get all ASEs under this ZSE
        const zseAses = allAses.filter(ase => ase.zseId === zse.id);
        
        // Collect all store IDs from ASEs under this ZSE
        const allStoreIds = zseAses.flatMap(ase => ase.storeIds || []);

        if (allStoreIds.length === 0) {
          return {
            zseId: zse.id,
            zseName: zse.fullName || 'Unknown ZSE',
            phone: zse.phone,
            region: zse.region || null,
            storeCount: 0,
            aseCount: zseAses.length,
            activeStoreCount: 0,
            totalSales: 0,
            totalIncentive: 0,
            adldUnits: 0,
            comboUnits: 0,
            adldRevenue: 0,
            comboRevenue: 0,
            isCurrentUser: zse.id === currentZse.id
          };
        }

        // Get sales reports for this ZSE's stores within the month
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
          zseId: zse.id,
          zseName: zse.fullName || 'Unknown ZSE',
          phone: zse.phone,
          region: zse.region || null,
          storeCount: allStoreIds.length,
          aseCount: zseAses.length,
          activeStoreCount: activeStoreIds.size,
          totalSales: salesReports.length,
          totalIncentive,
          adldUnits,
          comboUnits,
          adldRevenue,
          comboRevenue,
          isCurrentUser: zse.id === currentZse.id
        };
      })
    );

    // Sort by total sales (descending) and assign ranks
    const sortedLeaderboard = zseLeaderboard
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit)
      .map((zse, index) => ({
        rank: index + 1,
        ...zse,
        totalIncentive: zse.totalIncentive > 0 ? `₹${zse.totalIncentive.toLocaleString('en-IN')}` : '₹0',
        totalIncentiveRaw: zse.totalIncentive,
        adldRevenue: zse.adldRevenue > 0 ? `₹${zse.adldRevenue.toLocaleString('en-IN')}` : '₹0',
        comboRevenue: zse.comboRevenue > 0 ? `₹${zse.comboRevenue.toLocaleString('en-IN')}` : '₹0'
      }));

    // Find current user's rank
    const currentUserRank = sortedLeaderboard.find(zse => zse.isCurrentUser)?.rank || 0;

    return NextResponse.json({
      success: true,
      data: {
        zses: sortedLeaderboard,
        period: `${month}/${year}`,
        totalZSEs: allZses.length,
        totalSalesReports: sortedLeaderboard.reduce((sum, zse) => sum + zse.totalSales, 0),
        currentUserRank,
        currentZseId: currentZse.id
      }
    });
  } catch (error) {
    console.error('Error in GET /api/zse/leaderboard', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
