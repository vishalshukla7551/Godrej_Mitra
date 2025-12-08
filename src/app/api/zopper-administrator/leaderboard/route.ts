import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/zopper-administrator/leaderboard
 * Same behavior as SEC leaderboard:
 * - Returns top stores, devices, plans for active spot incentive campaigns
 * - period query: 'week' | 'month' | 'all' (default: 'month')
 * - limit query: number (default: 10)
 */
export async function GET(req: NextRequest) {
  try {
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
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Get all active campaigns
    const activeCampaigns = await prisma.spotIncentiveCampaign.findMany({
      where: {
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
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
        },
      });
    }

    const campaignIds = activeCampaigns.map((c) => c.id);

    // Get sales reports for active campaigns within the period
    const salesReports = await prisma.salesReport.findMany({
      where: {
        spotIncentiveCampaignId: { in: campaignIds },
        submittedAt: { gte: startDate },
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        samsungSKU: {
          select: {
            id: true,
            ModelName: true,
            Category: true,
          },
        },
        plan: {
          select: {
            id: true,
            planType: true,
            price: true,
          },
        },
      },
    });

    // Aggregate by store
    const storeMap = new Map<
      string,
      {
        storeId: string;
        storeName: string;
        city: string | null;
        state: string | null;
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
          state: report.store.state,
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
        totalIncentive: `₹${store.totalIncentive.toLocaleString('en-IN')}`,
      }));

    const topDevices = Array.from(deviceMap.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit)
      .map((device, index) => ({
        rank: index + 1,
        ...device,
        totalIncentive: `₹${device.totalIncentive.toLocaleString('en-IN')}`,
      }));

    const topPlans = Array.from(planMap.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit)
      .map((plan, index) => ({
        rank: index + 1,
        ...plan,
        planPrice: `₹${plan.planPrice.toLocaleString('en-IN')}`,
        totalIncentive: `₹${plan.totalIncentive.toLocaleString('en-IN')}`,
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
    console.error('Error in GET /api/zopper-administrator/leaderboard', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

