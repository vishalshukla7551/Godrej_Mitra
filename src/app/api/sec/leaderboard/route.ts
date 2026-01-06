import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/leaderboard
 * Get leaderboard data for active campaigns showing:
 * - Top performing stores
 * - Top performing devices (Samsung SKUs)
 * - Top performing plans
 * - Based on sales reports linked to active campaigns only
 * 
 * Query params:
 * - period: 'week' | 'month' | 'all' (default: 'month')
 * - limit: number (default: 10)
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
        godrejSKUId: true, // Fixed
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
    // Filter by isCompaignActive = true
    const salesReports: any = await prisma.spotIncentiveReport.findMany({
      where: {
        isCompaignActive: true,
        Date_of_sale: { gte: startDate },
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        godrejSKU: { // Fixed
          select: {
            id: true,
            Category: true,
            // ModelName removed
          },
        },
        plan: {
          select: {
            id: true,
            planType: true,
            PlanPrice: true, // Fixed from price
          },
        },
      },
    });

    // Aggregate by store
    const storeMap = new Map<string, {
      storeId: string;
      storeName: string;
      city: string | null;
      totalSales: number;
      totalIncentive: number;
      ew1: number;
      ew2: number;
      ew3: number;
      ew4: number;
    }>();

    // Aggregate by device (Godrej SKU)
    const deviceMap = new Map<string, {
      deviceId: string;
      deviceName: string;
      category: string;
      totalSales: number;
      totalIncentive: number;
    }>();

    // Aggregate by plan
    const planMap = new Map<string, {
      planId: string;
      planType: string;
      planPrice: number;
      totalSales: number;
      totalIncentive: number;
    }>();

    salesReports.forEach((report: any) => {
      // Determine EW bucket
      const planType = report.plan.planType || '';
      const isEW1 = planType.includes('1_YR');
      const isEW2 = planType.includes('2_YR');
      const isEW3 = planType.includes('3_YR');
      const isEW4 = planType.includes('4_YR');

      // Store aggregation
      const storeKey = report.storeId;
      if (storeMap.has(storeKey)) {
        const existing = storeMap.get(storeKey)!;
        existing.totalSales += 1;
        existing.totalIncentive += report.spotincentiveEarned;

        if (isEW1) existing.ew1 += 1;
        if (isEW2) existing.ew2 += 1;
        if (isEW3) existing.ew3 += 1;
        if (isEW4) existing.ew4 += 1;
      } else {
        storeMap.set(storeKey, {
          storeId: report.store.id,
          storeName: report.store.name,
          city: report.store.city,
          totalSales: 1,
          totalIncentive: report.spotincentiveEarned,
          ew1: isEW1 ? 1 : 0,
          ew2: isEW2 ? 1 : 0,
          ew3: isEW3 ? 1 : 0,
          ew4: isEW4 ? 1 : 0,
        });
      }

      // Device aggregation
      const deviceKey = report.godrejSKUId;
      if (deviceMap.has(deviceKey)) {
        const existing = deviceMap.get(deviceKey)!;
        existing.totalSales += 1;
        existing.totalIncentive += report.spotincentiveEarned;
      } else {
        deviceMap.set(deviceKey, {
          deviceId: report.godrejSKU.id,
          deviceName: report.godrejSKU.Category, // Use Category as primary name
          category: report.godrejSKU.Category,
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
          planPrice: report.plan.PlanPrice || 0,
          totalSales: 1,
          totalIncentive: report.spotincentiveEarned,
        });
      }
    });

    // Convert to arrays and sort by total incentive earned (descending)
    const topStores = Array.from(storeMap.values())
      .sort((a, b) => b.totalIncentive - a.totalIncentive)
      .slice(0, limit)
      .map((store, index) => ({
        rank: index + 1,
        ...store,
        totalIncentive: store.totalIncentive > 0 ? `₹${store.totalIncentive.toLocaleString('en-IN')}` : '-',
      }));

    const topDevices = Array.from(deviceMap.values())
      .sort((a, b) => b.totalIncentive - a.totalIncentive)
      .slice(0, limit)
      .map((device, index) => ({
        rank: index + 1,
        ...device,
        totalIncentive: device.totalIncentive > 0 ? `₹${device.totalIncentive.toLocaleString('en-IN')}` : '-',
      }));

    const topPlans = Array.from(planMap.values())
      .sort((a, b) => b.totalIncentive - a.totalIncentive)
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
    console.error('Error in GET /api/leaderboard', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
