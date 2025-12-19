import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/zsm/monthly-report
 * Get monthly report data for ZSM user from DailyIncentiveReport schema
 * Shows data from all stores in ZSM's region
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZSM') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ZSM profile
    const zsmProfile = await prisma.zSM.findUnique({
      where: { userId: authUser.id },
    });

    if (!zsmProfile) {
      return NextResponse.json(
        { error: 'ZSM profile not found' },
        { status: 404 }
      );
    }

    // Get query parameters for filtering
    const url = new URL(req.url);
    const planType = url.searchParams.get('planType');
    const storeFilter = url.searchParams.get('store');
    const deviceFilter = url.searchParams.get('device');
    const dateFilter = url.searchParams.get('date');
    const monthFilter = url.searchParams.get('month');
    const yearFilter = url.searchParams.get('year');

    // Build where clause for filtering
    // Note: ZSM doesn't have specific store assignments in the schema,
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

    // Apply date filters
    if (dateFilter) {
      // Single date - filter for that specific day
      const filterDate = new Date(dateFilter);
      const startOfDay = new Date(filterDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filterDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.Date_of_sale = {
        gte: startOfDay,
        lte: endOfDay
      };
    } else if (monthFilter) {
      // Month filter (format: YYYY-MM)
      const [year, month] = monthFilter.split('-').map(Number);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      
      whereClause.Date_of_sale = {
        gte: startOfMonth,
        lte: endOfMonth
      };
    } else if (yearFilter) {
      // Year filter
      const year = parseInt(yearFilter);
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
      
      whereClause.Date_of_sale = {
        gte: startOfYear,
        lte: endOfYear
      };
    }

    // Get Daily Incentive Reports with all related data
    const dailyReports = await prisma.dailyIncentiveReport.findMany({
      where: whereClause,
      include: {
        secUser: {
          select: {
            fullName: true,
            phone: true,
            employeeId: true,
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
      secId: report.secUser?.employeeId || 'N/A',
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

    // Get all stores for filter dropdown
    const allStores = await prisma.store.findMany({
      select: { id: true, name: true, city: true },
      take: 100
    });
    
    // Get all plans
    const allPlans = await prisma.plan.findMany({
      select: { planType: true },
      distinct: ['planType']
    });
    
    // Get all devices
    const allDevices = await prisma.samsungSKU.findMany({
      select: { ModelName: true },
      distinct: ['ModelName'],
      take: 50
    });

    return NextResponse.json({
      success: true,
      data: {
        // ZSM info
        zsm: {
          id: zsmProfile.id,
          fullName: zsmProfile.fullName,
          phone: zsmProfile.phone,
          region: zsmProfile.region,
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
        
        // Filter options (in format frontend expects)
        filterOptions: {
          stores: allStores.map(s => ({ id: s.id, name: s.name, city: s.city })),
          plans: allPlans.map(p => p.planType),
          devices: allDevices.map(d => d.ModelName)
        },
        
        // Legacy filter options
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
          date: dateFilter || null,
          month: monthFilter || null,
          year: yearFilter || null,
        },
      },
    });
  } catch (error) {
    console.error('Error in GET /api/zsm/monthly-report', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
