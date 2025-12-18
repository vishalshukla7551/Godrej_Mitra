import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/zse/monthly-report
 * Get monthly report data for ZSE user from DailyIncentiveReport schema
 * Shows data from all stores under ZSE's ASEs
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZSE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ZSE profile
    const zseProfile = await prisma.zSE.findUnique({
      where: { userId: authUser.id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        region: true
      }
    });

    if (!zseProfile) {
      return NextResponse.json({ error: 'ZSE profile not found' }, { status: 404 });
    }

    // Get all ASEs under this ZSE
    const aseProfiles = await prisma.aSE.findMany({
      where: { zseId: zseProfile.id },
      select: { storeIds: true }
    });

    // Collect all store IDs from ASEs
    const allStoreIds = aseProfiles.flatMap(ase => ase.storeIds);

    if (allStoreIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          zse: zseProfile,
          reports: [],
          summary: {
            totalReports: 0,
            uniqueStores: 0,
            uniqueDevices: 0,
            uniquePlans: 0,
            totalPlanValue: 0
          },
          filterOptions: {
            stores: [],
            plans: [],
            devices: []
          }
        }
      });
    }

    // Get query parameters for filtering
    const url = new URL(req.url);
    const planType = url.searchParams.get('planType');
    const storeFilter = url.searchParams.get('store');
    const deviceFilter = url.searchParams.get('device');
    const dateFilter = url.searchParams.get('date');

    // Build where clause for filtering
    const whereClause: any = {
      storeId: { in: allStoreIds }
    };

    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const startOfDay = new Date(filterDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filterDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.Date_of_sale = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    // Add optional filters
    if (planType) {
      whereClause.plan = {
        planType: planType.toUpperCase(),
      };
    }

    if (storeFilter) {
      whereClause.store = {
        name: {
          contains: storeFilter,
          mode: 'insensitive'
        }
      };
    }

    if (deviceFilter) {
      whereClause.samsungSKU = {
        ModelName: {
          contains: deviceFilter,
          mode: 'insensitive',
        },
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
            id: true,
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
      take: 100
    });

    // Format the reports for frontend
    const formattedReports = dailyReports.map((report) => ({
      id: report.id,
      dateOfSale: report.Date_of_sale,
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
    }));

    // Calculate summary statistics
    const totalReports = formattedReports.length;
    const uniqueStores = new Set(formattedReports.map(r => r.storeName)).size;

    // Get filter options from ZSE's stores
    const stores = await prisma.store.findMany({
      where: { id: { in: allStoreIds } },
      select: { id: true, name: true, city: true }
    });

    const plans = await prisma.plan.findMany({
      select: { planType: true },
      distinct: ['planType']
    });

    const devices = await prisma.samsungSKU.findMany({
      select: { ModelName: true },
      distinct: ['ModelName'],
      take: 50
    });

    return NextResponse.json({
      success: true,
      data: {
        zse: zseProfile,
        reports: formattedReports,
        summary: {
          totalReports,
          uniqueStores,
        },
        filterOptions: {
          stores: stores.map(s => ({ id: s.id, name: s.name, city: s.city })),
          plans: plans.map(p => p.planType),
          devices: devices.map(d => d.ModelName)
        }
      },
    });
  } catch (error) {
    console.error('Error in GET /api/zse/monthly-report', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
