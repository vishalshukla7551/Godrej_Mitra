import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/samsung-admin/dashboard
 * Get dashboard data for Samsung Administrator from DailyIncentiveReport schema
 * 
 * DailyIncentiveReport Schema Fields:
 * - id, secId, storeId, samsungSKUId, planId
 * - imei, metadata, Date_of_sale, createdAt, updatedAt
 * 
 * Query Parameters:
 * - storeId?: string (filter by store)
 * - planType?: string (filter by plan type)
 * - deviceName?: string (filter by device)
 * - startDate?: string (YYYY-MM-DD)
 * - endDate?: string (YYYY-MM-DD)
 * - search?: string (search SEC/Store/Device/IMEI)
 * - page?: number (pagination)
 * - limit?: number (page size)
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'SAMSUNG_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const planType = searchParams.get('planType');
    const deviceName = searchParams.get('deviceName');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: any = {};

    // Store filter
    if (storeId) {
      where.storeId = storeId;
    }

    // Plan type filter
    if (planType) {
      where.plan = {
        planType: planType
      };
    }

    // Device name filter
    if (deviceName) {
      where.samsungSKU = {
        ModelName: {
          contains: deviceName,
          mode: 'insensitive'
        }
      };
    }

    // Date range filter
    if (startDate || endDate) {
      where.Date_of_sale = {};
      if (startDate) {
        where.Date_of_sale.gte = new Date(startDate);
      }
      if (endDate) {
        where.Date_of_sale.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Search filter (SEC phone/name, store name, device name, IMEI)
    if (search) {
      where.OR = [
        { secUser: { phone: { contains: search, mode: 'insensitive' } } },
        { secUser: { fullName: { contains: search, mode: 'insensitive' } } },
        { secUser: { employeeId: { contains: search, mode: 'insensitive' } } },
        { store: { name: { contains: search, mode: 'insensitive' } } },
        { samsungSKU: { ModelName: { contains: search, mode: 'insensitive' } } },
        { samsungSKU: { Category: { contains: search, mode: 'insensitive' } } },
        { imei: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.dailyIncentiveReport.count({ where });

    // Get paginated reports with all related data
    const reports = await prisma.dailyIncentiveReport.findMany({
      where,
      include: {
        secUser: {
          select: {
            id: true,
            employeeId: true,
            phone: true,
            fullName: true,
            AgencyName: true,
          }
        },
        store: {
          select: {
            id: true,
            name: true,
            city: true,
          }
        },
        samsungSKU: {
          select: {
            id: true,
            Category: true,
            ModelName: true,
            ModelPrice: true,
          }
        },
        plan: {
          select: {
            id: true,
            planType: true,
            price: true,
          }
        }
      },
      orderBy: {
        Date_of_sale: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Format date helper
    const formatDateTime = (date: Date) => {
      const d = new Date(date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    };

    const formatDate = (date: Date) => {
      const d = new Date(date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    // Transform data for frontend - matching DailyIncentiveReport schema
    const transformedReports = reports.map((report) => ({
      // Core DailyIncentiveReport fields
      id: report.id,
      imei: report.imei,
      metadata: report.metadata,
      Date_of_sale: formatDate(report.Date_of_sale),
      createdAt: formatDateTime(report.createdAt),
      updatedAt: formatDateTime(report.updatedAt),
      
      // Frontend display fields
      timestamp: formatDateTime(report.createdAt),
      dateOfSale: formatDate(report.Date_of_sale),
      secId: report.secUser?.employeeId || report.secUser?.id || 'N/A',
      storeName: report.store.name,
      storeCode: report.store.city || '', // Using city as storeCode for display
      deviceName: report.samsungSKU.ModelName,
      planType: report.plan.planType.replace(/_/g, ' '),
      incentiveEarned: report.plan.price, // Using plan price as incentive for daily reports
      status: 'Submitted', // Daily reports are always submitted
      validator: 'Samsung', // Samsung validates daily reports
      
      // Additional data
      secName: report.secUser?.fullName || 'Not Set',
      secPhone: report.secUser?.phone || 'N/A',
      agencyName: report.secUser?.AgencyName || null,
      storeCity: report.store.city || null,
      deviceCategory: report.samsungSKU.Category,
      devicePrice: report.samsungSKU.ModelPrice || 0,
      planPrice: report.plan.price,
    }));

    // Calculate summary statistics from all matching records (not just current page)
    const allReportsForStats = await prisma.dailyIncentiveReport.findMany({
      where,
      select: {
        storeId: true,
        secId: true,
        plan: {
          select: { price: true }
        }
      }
    });

    const uniqueStores = new Set(allReportsForStats.map(r => r.storeId));
    const uniqueSECs = new Set(allReportsForStats.filter(r => r.secId).map(r => r.secId));
    const totalPlanValue = allReportsForStats.reduce((sum, r) => sum + r.plan.price, 0);

    // Get available filters data
    const [stores, planTypes, devices] = await Promise.all([
      prisma.store.findMany({
        select: { id: true, name: true, city: true },
        orderBy: { name: 'asc' }
      }),
      prisma.plan.findMany({
        select: { planType: true },
        distinct: ['planType'],
        orderBy: { planType: 'asc' }
      }),
      prisma.samsungSKU.findMany({
        select: { ModelName: true },
        distinct: ['ModelName'],
        orderBy: { ModelName: 'asc' },
        take: 100
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reports: transformedReports,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        summary: {
          activeStores: uniqueStores.size,
          secsActive: uniqueSECs.size,
          reportsSubmitted: totalCount,
          incentiveEarned: totalPlanValue, // Total plan value as incentive earned
          incentivePaid: totalPlanValue, // All daily reports are considered "paid"
          incentivePaidCount: totalCount,
          incentiveUnpaidCount: 0 // Daily reports don't have unpaid status
        },
        filters: {
          stores: stores.map(s => ({ id: s.id, name: s.name, city: s.city })),
          planTypes: planTypes.map(p => p.planType),
          devices: devices.map(d => d.ModelName)
        }
      }
    });

  } catch (error) {
    console.error('Error in GET /api/samsung-admin/dashboard', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}