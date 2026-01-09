import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/canvasser/leaderboard
 * Get leaderboard data showing:
 * - Top performing stores (by total incentive earned)
 * - Top performing canvassers (by total incentive earned)
 * - Top performing devices (Godrej SKUs)
 * - Top performing plans
 * 
 * Based on ALL sales reports with calculated MR incentives + campaign bonuses
 * The spotincentiveEarned field contains incentives calculated from:
 * - MR Price List (newer/yellow incentive plan)
 * - Active campaign bonuses (if applicable)
 * 
 * Query params:
 * - period: 'week' | 'month' | 'all' (default: 'month')
 * - month: number (1-12, optional - for specific month filtering)
 * - year: number (optional - for specific year filtering)
 * - limit: number (default: 10)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';
    const limit = parseInt(searchParams.get('limit') || '10');
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    // Calculate date range based on period and specific month/year if provided
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (monthParam && yearParam) {
      // Specific month and year filtering
      const month = parseInt(monthParam) - 1; // 0-indexed
      const year = parseInt(yearParam);
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last day of month
    } else {
      // Default period-based filtering
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
          break;
        case 'all':
        default:
          startDate = new Date(0); // Beginning of time
          endDate = now;
          break;
      }
    }

    // Get count of currently active campaigns for metadata only
    const activeCampaignsCount = await prisma.spotIncentiveCampaign.count({
      where: {
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    // Get ALL sales reports within the date range
    // This includes both MR incentive-based sales AND campaign sales
    // The spotincentiveEarned field contains the calculated incentive amount
    const salesReports: any = await prisma.spotIncentiveReport.findMany({
      where: {
        Date_of_sale: { 
          gte: startDate,
          lte: endDate
        },
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        secUser: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            employeeId: true,
          },
        },
        godrejSKU: {
          select: {
            id: true,
            Category: true,
          },
        },
        plan: {
          select: {
            id: true,
            planType: true,
            PlanPrice: true,
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

    // Aggregate by canvasser (SEC)
    const canvasserMap = new Map<string, {
      secId: string;
      canvasserName: string;
      identifier: string; // phone or employee ID
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

      // Canvasser aggregation
      if (report.secId && report.secUser) {
        const secKey = report.secId;
        if (canvasserMap.has(secKey)) {
          const existing = canvasserMap.get(secKey)!;
          existing.totalSales += 1;
          existing.totalIncentive += report.spotincentiveEarned;

          if (isEW1) existing.ew1 += 1;
          if (isEW2) existing.ew2 += 1;
          if (isEW3) existing.ew3 += 1;
          if (isEW4) existing.ew4 += 1;
        } else {
          canvasserMap.set(secKey, {
            secId: report.secUser.id,
            canvasserName: report.secUser.fullName || 'Unknown',
            identifier: report.secUser.employeeId || report.secUser.phone,
            totalSales: 1,
            totalIncentive: report.spotincentiveEarned,
            ew1: isEW1 ? 1 : 0,
            ew2: isEW2 ? 1 : 0,
            ew3: isEW3 ? 1 : 0,
            ew4: isEW4 ? 1 : 0,
          });
        }
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

    const topCanvassers = Array.from(canvasserMap.values())
      .sort((a, b) => b.totalIncentive - a.totalIncentive)
      .slice(0, limit)
      .map((canvasser, index) => ({
        rank: index + 1,
        ...canvasser,
        totalIncentive: canvasser.totalIncentive > 0 ? `₹${canvasser.totalIncentive.toLocaleString('en-IN')}` : '-',
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
        canvassers: topCanvassers,
        devices: topDevices,
        plans: topPlans,
        period,
        activeCampaignsCount,
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
