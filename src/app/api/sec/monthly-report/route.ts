import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/sec/monthly-report
 * Get monthly report data for SEC user from DailyIncentiveReport schema
 * This is separate from spot reports and focuses on daily incentive data
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'SEC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phone = authUser.username;
    if (!phone) {
      return NextResponse.json(
        { error: 'Missing SEC identifier' },
        { status: 400 }
      );
    }

    // Find SEC user with store information
    const secUser = await prisma.sEC.findUnique({
      where: { phone },
      include: {
        store: true,
      },
    });

    if (!secUser) {
      return NextResponse.json(
        { error: 'SEC user not found' },
        { status: 404 }
      );
    }

    if (!secUser.storeId || !secUser.store) {
      return NextResponse.json(
        { error: 'SEC user not assigned to a store' },
        { status: 400 }
      );
    }

    // Get query parameters for filtering
    const url = new URL(req.url);
    const planType = url.searchParams.get('planType');
    const storeFilter = url.searchParams.get('store');
    const deviceFilter = url.searchParams.get('device');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build where clause for filtering
    const whereClause: any = {
      storeId: secUser.storeId, // Always filter by SEC's store
    };

    // Add optional filters
    if (planType && planType !== 'all') {
      whereClause.plan = {
        planType: planType.toUpperCase(),
      };
    }

    if (deviceFilter && deviceFilter !== 'all') {
      whereClause.samsungSKU = {
        ModelName: {
          contains: deviceFilter,
          mode: 'insensitive',
        },
      };
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.Date_of_sale = {};
      if (startDate) {
        whereClause.Date_of_sale.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.Date_of_sale.lte = new Date(endDate);
      }
    }

    // Get Daily Incentive Reports with all related data
    const dailyReports = await prisma.dailyIncentiveReport.findMany({
      where: whereClause,
      include: {
        secUser: {
          select: {
            fullName: true,
            phone: true,
            secId: true,
          },
        },
        plan: {
          select: {
            planType: true,
            price: true,
          },
        },
        store: {
          select: {
            name: true,
            city: true,
          },
        },
        samsungSKU: {
          select: {
            ModelName: true,
            Category: true,
            ModelPrice: true,
          },
        },
      },
      orderBy: {
        Date_of_sale: 'desc',
      },
    });

    // Format date helper
    const formatDate = (date: Date) => {
      const d = new Date(date);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    // Format the reports for frontend
    const formattedReports = dailyReports.map((report) => ({
      id: report.id,
      dateOfSale: formatDate(report.Date_of_sale),
      secName: report.secUser?.fullName || 'N/A',
      secPhone: report.secUser?.phone || 'N/A',
      secId: report.secUser?.secId || 'N/A',
      storeName: report.store.name,
      storeCity: report.store.city || 'N/A',
      deviceName: report.samsungSKU.ModelName,
      deviceCategory: report.samsungSKU.Category,
      devicePrice: report.samsungSKU.ModelPrice || 0,
      planType: report.plan.planType,
      planPrice: report.plan.price,
      imei: report.imei,
      status: 'Submitted', // Daily reports are always submitted
      metadata: report.metadata,
      createdAt: formatDate(report.createdAt),
    }));

    // Calculate summary statistics
    const totalReports = formattedReports.length;
    const uniqueDevices = new Set(formattedReports.map(r => r.deviceName)).size;
    const uniquePlans = new Set(formattedReports.map(r => r.planType)).size;
    const totalPlanValue = formattedReports.reduce((sum, r) => sum + r.planPrice, 0);

    // Group by plan type for breakdown
    const planBreakdown: Record<string, number> = {};
    formattedReports.forEach((report) => {
      const planType = report.planType;
      planBreakdown[planType] = (planBreakdown[planType] || 0) + 1;
    });

    // Group by device for breakdown
    const deviceBreakdown: Record<string, number> = {};
    formattedReports.forEach((report) => {
      const deviceName = report.deviceName;
      deviceBreakdown[deviceName] = (deviceBreakdown[deviceName] || 0) + 1;
    });

    // Monthly aggregation
    const monthlyData: Record<string, {
      count: number;
      totalValue: number;
      plans: Record<string, number>;
    }> = {};

    formattedReports.forEach((report) => {
      const date = new Date(report.dateOfSale.split('/').reverse().join('-'));
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          count: 0,
          totalValue: 0,
          plans: {},
        };
      }
      
      monthlyData[monthKey].count += 1;
      monthlyData[monthKey].totalValue += report.planPrice;
      monthlyData[monthKey].plans[report.planType] = (monthlyData[monthKey].plans[report.planType] || 0) + 1;
    });

    // Convert monthly data to array and sort
    const monthlyBreakdown = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        count: data.count,
        totalValue: data.totalValue,
        plans: data.plans,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    // Get available filter options for frontend
    const availablePlans = [...new Set(formattedReports.map(r => r.planType))].sort();
    const availableDevices = [...new Set(formattedReports.map(r => r.deviceName))].sort();

    return NextResponse.json({
      success: true,
      data: {
        // SEC and Store info
        sec: {
          id: secUser.id,
          fullName: secUser.fullName,
          phone: secUser.phone,
          secId: secUser.secId,
        },
        store: {
          id: secUser.store.id,
          name: secUser.store.name,
          city: secUser.store.city,
        },
        
        // Reports data
        reports: formattedReports,
        
        // Summary statistics
        summary: {
          totalReports,
          uniqueDevices,
          uniquePlans,
          totalPlanValue,
          averagePlanValue: totalReports > 0 ? Math.round(totalPlanValue / totalReports) : 0,
        },
        
        // Breakdowns
        breakdowns: {
          byPlan: planBreakdown,
          byDevice: deviceBreakdown,
          byMonth: monthlyBreakdown,
        },
        
        // Filter options
        filters: {
          availablePlans,
          availableDevices,
        },
        
        // Applied filters (for frontend state)
        appliedFilters: {
          planType: planType || 'all',
          store: storeFilter || 'all',
          device: deviceFilter || 'all',
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/sec/monthly-report', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}