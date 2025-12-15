import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/zbm/leaderboard
 * Returns top stores, devices, plans for ZBM's region (via ABM's assigned stores)
 * - period query: 'week' | 'month' | 'all' (default: 'month')
 * - limit query: number (default: 10)
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZBM') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ZBM profile
    const zbmProfile = await prisma.zBM.findUnique({
      where: { userId: authUser.id },
      select: {
        id: true,
        region: true
      }
    });

    if (!zbmProfile) {
      return NextResponse.json({ error: 'ZBM profile not found' }, { status: 404 });
    }

    // Get all ABMs under this ZBM
    const abmProfiles = await prisma.aBM.findMany({
      where: { zbmId: zbmProfile.id },
      select: {
        storeIds: true
      }
    });

    // Collect all store IDs from ABMs
    const allStoreIds = abmProfiles.flatMap(abm => abm.storeIds);

    if (allStoreIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          stores: [],
          devices: [],
          plans: [],
          period: 'month',
          activeCampaignsCount: 0,
          totalSalesReports: 0
        }
      });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }

    // Get active campaigns for ZBM's stores
    const activeCampaigns = await prisma.spotIncentiveCampaign.findMany({
      where: {
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
        storeId: {
          in: allStoreIds
        }
      },
      select: {
        id: true,
        storeId: true,
        samsungSKUId: true,
        planId: true,
      },
    });

    if (activeCampaigns.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          stores: [],
          devices: [],
          plans: [],
          period,
          activeCampaignsCount: 0,
          totalSalesReports: 0
        },
      });
    }

    // Get sales reports for ZBM's stores within the period
    const salesReports = await prisma.spotIncentiveReport.findMany({
      where: {
        isCompaignActive: true,
        Date_of_sale: { gte: startDate },
        storeId: {
          in: allStoreIds
        }
      },
      include: {
        store: true,
        samsungSKU: true,
        plan: true,
      },
    });

    // Aggregate by store
    const storeMap = new Map<
      string,
      {
        storeId: string;
        storeName: string;
        city: string | null;
        totalSales: number;
        totalIncentive: number;
      }
    >();

    // Aggregate by device (Samsung SKU)
    const deviceMap = new Map<
      string,
      {
        deviceId: string;
        deviceName: string;
        category: string;
        totalSales: number;
        totalIncentive: number;
      }
    >();

    // Aggregate by plan
    const planMap = new Map<
      string,
      {
        planId: string;
        planType: string;
        planPrice: number;
        totalSales: number;
        totalIncentive: number;
      }
    >();

    salesReports.forEach((report) => {
      // Store aggregation
      const storeKey = report.storeId;
      if (storeMap.has(storeKey)) {
        const existing = storeMap.get(storeKey)!;
        existing.totalSales += 1;
        existing.totalIncentive += report.spotincentiveEarned;
      } else {
        storeMap.set(storeKey, {
          storeId: report.store.id,
          storeName: report.store.name,
          city: report.store.city,
          totalSales: 1,
          totalIncentive: report.spotincentiveEarned,
        });
      }

      // Device aggregation
      const deviceKey = report.samsungSKUId;
      if (deviceMap.has(deviceKey)) {
        const existing = deviceMap.get(deviceKey)!;
        existing.totalSales += 1;
        existing.totalIncentive += report.spotincentiveEarned;
      } else {
        deviceMap.set(deviceKey, {
          deviceId: report.samsungSKU.id,
          deviceName: report.samsungSKU.ModelName,
          category: report.samsungSKU.Category,
          totalSales: 1,
          totalIncentive: report.spotincentiveEarned,
        });
      }

      // Plan aggregation
      const planKey = report.planId;
      if (planMap.has(planKey)) {
        const existing = planMap.get(planKey)!;
        existing.totalSales += 1;
        existing.totalIncentive += report.spotincentiveEarned;
      } else {
        planMap.set(planKey, {
          planId: report.plan.id,
          planType: report.plan.planType,
          planPrice: report.plan.price,
          totalSales: 1,
          totalIncentive: report.spotincentiveEarned,
        });
      }
    });

    // Convert to arrays and sort by total sales (descending)
    const topStores = Array.from(storeMap.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit)
      .map((store, index) => ({
        rank: index + 1,
        ...store,
        totalIncentive: store.totalIncentive > 0 ? `₹${store.totalIncentive.toLocaleString('en-IN')}` : '-',
      }));

    const topDevices = Array.from(deviceMap.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit)
      .map((device, index) => ({
        rank: index + 1,
        ...device,
        totalIncentive: device.totalIncentive > 0 ? `₹${device.totalIncentive.toLocaleString('en-IN')}` : '-',
      }));

    const topPlans = Array.from(planMap.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit)
      .map((plan, index) => ({
        rank: index + 1,
        ...plan,
        planPrice: plan.planPrice > 0 ? `₹${plan.planPrice.toLocaleString('en-IN')}` : '-',
        totalIncentive: plan.totalIncentive > 0 ? `₹${plan.totalIncentive.toLocaleString('en-IN')}` : '-',
      }));

    return NextResponse.json({
      success: true,
      data: {
        stores: topStores,
        devices: topDevices,
        plans: topPlans,
        period,
        activeCampaignsCount: activeCampaigns.length,
        totalSalesReports: salesReports.length,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/zbm/leaderboard', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
