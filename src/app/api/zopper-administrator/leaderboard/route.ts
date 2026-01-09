import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/zopper-administrator/leaderboard
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
 * - month: number (1-12, optional - defaults to current month)
 * - year: number (optional - defaults to current year)
 * - limit: number (default: 10)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get month and year from query params
    const now = new Date();
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    const month = monthParam ? parseInt(monthParam) - 1 : now.getMonth(); // 0-indexed
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();

    // Calculate date range for the selected month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last day of month

    // Get count of currently active campaigns for metadata only
    const activeCampaignsCount = await prisma.spotIncentiveCampaign.count({
      where: {
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    // Get ALL sales reports within the selected month
    // This includes both MR incentive-based sales AND campaign sales
    const salesReports = await prisma.spotIncentiveReport.findMany({
      where: {
        Date_of_sale: {
          gte: startDate,
          lte: endDate,
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

    // Helper to calculate EW counts
    const calculateEWCounts = (planType: string, current: any) => {
      switch (planType) {
        case 'EXTENDED_WARRANTY_1_YR': current.ew1 += 1; break;
        case 'EXTENDED_WARRANTY_2_YR': current.ew2 += 1; break;
        case 'EXTENDED_WARRANTY_3_YR': current.ew3 += 1; break;
        case 'EXTENDED_WARRANTY_4_YR': current.ew4 += 1; break;
      }
    };

    // Aggregate by store
    const storeMap = new Map<
      string,
      {
        storeId: string;
        storeName: string;
        city: string | null;
        totalSales: number;
        totalIncentive: number;
        ew1: number;
        ew2: number;
        ew3: number;
        ew4: number;
      }
    >();

    // Aggregate by Canvasser (SEC)
    const secMap = new Map<
      string,
      {
        secId: string;
        canvasserName: string;
        identifier: string; // Employee ID or Phone
        totalSales: number;
        totalIncentive: number;
        ew1: number;
        ew2: number;
        ew3: number;
        ew4: number;
      }
    >();

    // Aggregate by device (Godrej SKU)
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
        calculateEWCounts(report.plan.planType, existing);
      } else {
        const newStore = {
          storeId: report.store.id,
          storeName: report.store.name,
          city: report.store.city,
          totalSales: 1,
          totalIncentive: report.spotincentiveEarned,
          ew1: 0, ew2: 0, ew3: 0, ew4: 0
        };
        calculateEWCounts(report.plan.planType, newStore);
        storeMap.set(storeKey, newStore);
      }

      // SEC aggregation
      const secKey = report.secId;
      if (secMap.has(secKey)) {
        const existing = secMap.get(secKey)!;
        existing.totalSales += 1;
        existing.totalIncentive += report.spotincentiveEarned;
        calculateEWCounts(report.plan.planType, existing);
      } else {
        const newSec = {
          secId: report.secUser.id,
          canvasserName: report.secUser.fullName || 'Unknown',
          identifier: report.secUser.employeeId || report.secUser.phone,
          totalSales: 1,
          totalIncentive: report.spotincentiveEarned,
          ew1: 0, ew2: 0, ew3: 0, ew4: 0
        };
        calculateEWCounts(report.plan.planType, newSec);
        secMap.set(secKey, newSec);
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
          deviceName: report.godrejSKU.Category, // Fallback
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
          planPrice: report.plan.PlanPrice,
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

    const topCanvassers = Array.from(secMap.values())
      .sort((a, b) => b.totalIncentive - a.totalIncentive)
      .slice(0, limit)
      .map((sec, index) => ({
        rank: index + 1,
        ...sec,
        totalIncentive: sec.totalIncentive > 0 ? `₹${sec.totalIncentive.toLocaleString('en-IN')}` : '-',
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
        month: month + 1,
        year,
        activeCampaignsCount: activeCampaignsCount,
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
