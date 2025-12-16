import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/zbm/monthly-report
 * Get monthly report data for ZBM user from DailyIncentiveReport schema
 * Shows data from all stores in ZBM's region
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
    });

    if (!zbmProfile) {
      return NextResponse.json(
        { error: 'ZBM profile not found' },
        { status: 404 }
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
    // Note: ZBM doesn't have specific store assignments in the schema,
    // so we'll show all stores for now. You can modify this based on your business logic.
    const whereClause: any = {};

    // Add optional filters
    if (planType && planType !== 'all') {
      whereClause.plan = {
        planType: planType.toUpperCase(),
      };
    }

    if (storeFilter && storeFilter !== 'all') {
      whereClause.storeId = storeFilter;
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
      status: 'Submitted',
      metadata: report.metadata,
      createdAt: formatDate(report.createdAt),
    }));

    // Calculate summary statistics
    const totalReports = formattedReports.length;
    const uniqueStores = new Set(formattedReports.map(r => r.storeName)).size;
    const uniqueDevices = new Set(formattedReports.map(r => r.deviceName)).size;
    const uniquePlans = new Set(formattedReports.map(r => r.planType)).size;
    const totalPlanValue = formattedReports.reduce((sum, r) => sum + r.planPrice, 0);

    // Group by store for breakdown
    const storeBreakdown: Record<string, {
      count: number;
      totalValue: number;
      city: string;
    }> = {};
    
    formattedReports.forEach((report) => {
      const storeName = report.storeName;
      if (!storeBreakdown[storeName]) {
        storeBreakdown[storeName] = {
          count: 0,
          totalValue: 0,
          city: report.storeCity,
        };
      }
      storeBreakdown[storeName].count += 1;
      storeBreakdown[storeName].totalValue += report.planPrice;
    });

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
      stores: Record<string, number>;
    }> = {};

    formattedReports.forEach((report) => {
      const date = new Date(report.dateOfSale.split('/').reverse().join('-'));
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          count: 0,
          totalValue: 0,
          stores: {},
        };
      }
      
      monthlyData[monthKey].count += 1;
      monthlyData[monthKey].totalValue += report.planPrice;
      monthlyData[monthKey].stores[report.storeName] = (monthlyData[monthKey].stores[report.storeName] || 0) + 1;
    });

    // Convert monthly data to array and sort
    const monthlyBreakdown = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        count: data.count,
        totalValue: data.totalValue,
        stores: data.stores,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    // Get available filter options for frontend
    const availablePlans = [...new Set(formattedReports.map(r => r.planType))].sort();
    const availableDevices = [...new Set(formattedReports.map(r => r.deviceName))].sort();
    const availableStores = [...new Set(formattedReports.map(r => r.storeName))].sort();

    return NextResponse.json({
      success: true,
      data: {
        // ZBM info
        zbm: {
          id: zbmProfile.id,
          fullName: zbmProfile.fullName,
          phone: zbmProfile.phone,
          region: zbmProfile.region,
        },
        
        // Reports data
        reports: formattedReports,
        
        // Summary statistics
        summary: {
          totalReports,
          uniqueStores,
          uniqueDevices,
          uniquePlans,
          totalPlanValue,
          averagePlanValue: totalReports > 0 ? Math.round(totalPlanValue / totalReports) : 0,
        },
        
        // Breakdowns
        breakdowns: {
          byStore: storeBreakdown,
          byPlan: planBreakdown,
          byDevice: deviceBreakdown,
          byMonth: monthlyBreakdown,
        },
        
        // Filter options
        filters: {
          availablePlans,
          availableDevices,
          availableStores,
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
    console.error('Error in GET /api/zbm/monthly-report', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}