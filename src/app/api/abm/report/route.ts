import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/abm/report
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ABM') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ABM profile with assigned stores
    const abmProfile = await prisma.aBM.findUnique({
      where: { userId: authUser.id },
      select: {
        storeIds: true
      }
    });

    if (!abmProfile || !abmProfile.storeIds || abmProfile.storeIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          reports: [],
          summary: {
            activeStores: 0,
            activeSECs: 0,
            totalReports: 0,
            paidCount: 0,
            unpaidCount: 0
          }
        }
      });
    }

    const { searchParams } = new URL(req.url);
    const planFilter = searchParams.get('planFilter') || '';
    const storeFilter = searchParams.get('storeFilter') || '';
    const deviceFilter = searchParams.get('deviceFilter') || '';
    const dateFilter = searchParams.get('date') || '';
    const monthFilter = searchParams.get('month') || '';
    const yearFilter = searchParams.get('year') || '';

    // Build where clause - only for ABM's assigned stores
    const where: any = {
      storeId: {
        in: abmProfile.storeIds
      }
    };

    // Apply date filters
    if (dateFilter) {
      // Single date - filter for that specific day
      const filterDate = new Date(dateFilter);
      const startOfDay = new Date(filterDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filterDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.Date_of_sale = {
        gte: startOfDay,
        lte: endOfDay
      };
    } else if (monthFilter) {
      // Month filter (format: YYYY-MM)
      const [year, month] = monthFilter.split('-').map(Number);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
      
      where.Date_of_sale = {
        gte: startOfMonth,
        lte: endOfMonth
      };
    } else if (yearFilter) {
      // Year filter
      const year = parseInt(yearFilter);
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
      
      where.Date_of_sale = {
        gte: startOfYear,
        lte: endOfYear
      };
    }

    // Apply filters
    if (planFilter) {
      where.plan = {
        planType: planFilter
      };
    }

    if (storeFilter) {
      where.store = {
        name: {
          contains: storeFilter,
          mode: 'insensitive'
        }
      };
    }

    if (deviceFilter) {
      where.samsungSKU = {
        ModelName: {
          contains: deviceFilter,
          mode: 'insensitive'
        }
      };
    }

    // Fetch sales reports
    const salesReports = await prisma.spotIncentiveReport.findMany({
      where,
      include: {
        secUser: {
          select: {
            id: true,
            phone: true,
            fullName: true
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            city: true
          }
        },
        samsungSKU: {
          select: {
            Category: true,
            ModelName: true
          }
        },
        plan: {
          select: {
            planType: true,
            price: true
          }
        }
      },
      orderBy: {
        Date_of_sale: 'desc'
      },
      take: 100
    });

    // Calculate summary
    const uniqueStores = new Set(salesReports.map(r => r.storeId)).size;
    const uniqueSECs = new Set(salesReports.map(r => r.secId)).size;
    const paidCount = salesReports.filter(r => r.spotincentivepaidAt).length;
    const unpaidCount = salesReports.filter(r => !r.spotincentivepaidAt).length;

    // Get filter options from ABM's assigned stores
    const stores = await prisma.store.findMany({
      where: { id: { in: abmProfile.storeIds } },
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
        reports: salesReports.map(report => ({
          id: report.id,
          dateOfSale: report.Date_of_sale,
          secId: report.secUser.id,
          secName: report.secUser.fullName || 'Not Set',
          secPhone: report.secUser.phone,
          storeName: report.store.name,
          storeCity: report.store.city || '',
          deviceName: report.samsungSKU.ModelName,
          deviceCategory: report.samsungSKU.Category,
          planType: report.plan.planType,
          imei: report.imei,
          incentive: report.spotincentiveEarned,
          isPaid: !!report.spotincentivepaidAt
        })),
        summary: {
          activeStores: uniqueStores,
          activeSECs: uniqueSECs,
          totalReports: salesReports.length,
          paidCount,
          unpaidCount
        },
        filterOptions: {
          stores: stores.map(s => ({ id: s.id, name: s.name, city: s.city })),
          plans: plans.map(p => p.planType),
          devices: devices.map(d => d.ModelName)
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/abm/report', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
