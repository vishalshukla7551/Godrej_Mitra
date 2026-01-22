import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/zopper-admin/spot-incentive-report
 * Get all spot incentive reports for Zopper Administrator
 * 
 * Query Parameters:
 * - storeId?: string (filter by store)
 * - planType?: string (filter by plan type)
 * - paymentStatus?: 'paid' | 'unpaid' | 'all'
 * - startDate?: string (YYYY-MM-DD)
 * - endDate?: string (YYYY-MM-DD)
 * - search?: string (search Canvasser/Store/Device/Serial Number)
 * - page?: number (pagination)
 * - limit?: number (page size)
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const planType = searchParams.get('planType');
    const paymentStatus = searchParams.get('paymentStatus') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

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

    // Payment status filter
    if (paymentStatus === 'paid') {
      where.spotincentivepaidAt = { not: null };
    } else if (paymentStatus === 'unpaid') {
      if (!where.AND) {
        where.AND = [];
      }
      where.AND.push({
        OR: [
          { spotincentivepaidAt: null },
          { spotincentivepaidAt: { isSet: false } }
        ]
      });
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

    // Search filter (Canvasser phone, store name, device name, Serial Number)
    if (search) {
      where.OR = [
        {
          canvasserId: { contains: search, mode: 'insensitive' }
        },
        {
          store: {
            name: { contains: search, mode: 'insensitive' }
          }
        },
        {
          godrejSKU: {
            Category: { contains: search, mode: 'insensitive' }
          }
        },
        {
          imei: { contains: search, mode: 'insensitive' }
        }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.spotIncentiveReport.count({ where });

    // Get paginated reports
    const reports = await prisma.spotIncentiveReport.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            city: true,
          }
        },
        godrejSKU: {
          select: {
            id: true,
            Category: true,
          }
        },
        plan: {
          select: {
            id: true,
            planType: true,
            PlanPrice: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Format date helper
    const formatDate = (date: Date) => {
      const d = new Date(date);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    };

    // Get unique canvasser IDs from reports
    const canvasserIds = [...new Set(reports.map(r => r.canvasserId).filter(Boolean))];

    // Fetch canvasser details
    const canvassers = await prisma.canvasser.findMany({
      where: {
        id: { in: canvasserIds }
      },
      select: {
        id: true,
        employeeId: true,
        phone: true,
        fullName: true,
      }
    });

    // Create canvasser lookup map
    const canvasserMap = new Map(canvassers.map(c => [c.id, c]));

    // Transform data for frontend
    const transformedReports = reports.map((report: any) => {
      const canvasser = canvasserMap.get(report.canvasserId);

      return {
        id: report.id,
        createdAt: formatDate(report.createdAt),
        submittedAt: formatDate(report.Date_of_sale || report.createdAt),
        serialNumber: report.imei,
        planPrice: report.plan.PlanPrice,
        incentiveEarned: report.spotincentiveEarned,
        isPaid: !!report.spotincentivepaidAt,
        paidAt: report.spotincentivepaidAt ? formatDate(report.spotincentivepaidAt) : null,
        voucherCode: report.voucherCode || '',
        isCampaignActive: report.isCampaignActive,
        customerName: report.customerName || '',
        customerPhoneNumber: report.customerPhoneNumber || '',
        canvasserUser: {
          canvasserId: canvasser?.employeeId || canvasser?.id || 'Unknown',
          phone: canvasser?.phone || 'Unknown',
          name: canvasser?.fullName || 'Not Set'
        },
        store: {
          id: report.store.id,
          storeName: report.store.name,
          city: report.store.city || 'Not Set'
        },
        samsungSKU: {
          id: report.godrejSKU.id,
          Category: report.godrejSKU.Category,
          ModelName: report.godrejSKU.Category // Fallback
        },
        plan: {
          id: report.plan.id,
          planType: report.plan.planType,
          price: report.plan.PlanPrice
        }
      };
    });

    // Calculate summary statistics
    const totalIncentiveEarned = reports.reduce((sum: number, report: any) => sum + report.spotincentiveEarned, 0);
    const totalIncentivePaid = reports
      .filter((report: any) => report.spotincentivepaidAt)
      .reduce((sum: number, report: any) => sum + report.spotincentiveEarned, 0);

    const uniqueStores = new Set(reports.map((report: any) => report.storeId));
    const uniqueCanvassers = new Set(reports.map((report: any) => report.canvasserId));

    // Get available filters data
    const [stores, planTypes] = await Promise.all([
      prisma.store.findMany({
        select: {
          id: true,
          name: true,
          city: true
        },
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.plan.findMany({
        select: {
          planType: true
        },
        distinct: ['planType'],
        orderBy: {
          planType: 'asc'
        }
      })
    ]);

    // Reconstruct Incentive Rules from Plans
    // Fetch all plans with their categories
    const allPlans = await prisma.plan.findMany({
      include: {
        GodrejSKU: {
          select: { Category: true }
        }
      }
    });

    // Group by Category + Price Range
    const rulesMap = new Map<string, any>();

    allPlans.forEach(plan => {
      const category = plan.GodrejSKU?.Category;
      const priceRange = plan.priceRange;

      if (category && priceRange) {
        const key = `${category}-${priceRange}`;

        if (!rulesMap.has(key)) {
          rulesMap.set(key, {
            id: key,
            category,
            priceRange,
            minPrice: 0, // Not strictly needed for display
            maxPrice: 0,
            incentive1Year: 0,
            incentive2Year: 0,
            incentive3Year: 0,
            incentive4Year: 0
          });
        }

        const rule = rulesMap.get(key);
        const incentive = (plan as any).incentiveAmount || 0;
        const type = plan.planType.toString();

        if (type.includes('1_YR')) rule.incentive1Year = incentive;
        else if (type.includes('2_YR')) rule.incentive2Year = incentive;
        else if (type.includes('3_YR')) rule.incentive3Year = incentive;
        else if (type.includes('4_YR')) rule.incentive4Year = incentive;
      }
    });

    // Convert map to array and sort
    const mrIncentives = Array.from(rulesMap.values()).sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      // Try to sort by price range numerically if possible
      const priceA = parseInt(a.priceRange.split('-')[0]) || 0;
      const priceB = parseInt(b.priceRange.split('-')[0]) || 0;
      return priceA - priceB;
    });

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
          totalReports: totalCount,
          activeStores: uniqueStores.size,
          activeCanvassers: uniqueCanvassers.size,
          totalIncentiveEarned,
          totalIncentivePaid,
          totalIncentivePending: totalIncentiveEarned - totalIncentivePaid
        },
        filters: {
          stores: stores.map(store => ({
            id: store.id,
            name: store.name,
            city: store.city
          })),
          planTypes: planTypes.map(plan => plan.planType)
        },
        mrIncentives
      }
    });

  } catch (error) {
    console.error('Error in GET /api/zopper-admin/spot-incentive-report', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}