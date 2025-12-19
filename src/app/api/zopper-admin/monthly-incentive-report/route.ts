import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/zopper-admin/monthly-incentive-report
// Fetches monthly incentive report data from DailyIncentiveReport schema
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const query = searchParams.get('query') || '';
    const storeFilter = searchParams.get('storeFilter') || '';
    const planFilter = searchParams.get('planFilter') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause for filtering
    const where: any = {};

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

    // Store filter - use exact match since we're selecting from dropdown
    if (storeFilter) {
      where.store = {
        name: storeFilter
      };
    }

    // Plan filter
    if (planFilter) {
      where.plan = {
        planType: planFilter
      };
    }

    // Search query filter (SEC phone, store name, device model, IMEI)
    if (query) {
      where.OR = [
        {
          secUser: {
            phone: {
              contains: query,
              mode: 'insensitive'
            }
          }
        },
        {
          secUser: {
            fullName: {
              contains: query,
              mode: 'insensitive'
            }
          }
        },
        {
          store: {
            name: {
              contains: query,
              mode: 'insensitive' as any
            }
          }
        },
        {
          samsungSKU: {
            ModelName: {
              contains: query,
              mode: 'insensitive'
            }
          }
        },
        {
          imei: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.dailyIncentiveReport.count({ where });

    // Fetch daily incentive reports with all related data
    const dailyReports = await prisma.dailyIncentiveReport.findMany({
      where,
      include: {
        secUser: {
          select: {
            id: true,
            phone: true,
            fullName: true,
            employeeId: true
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
            ModelPrice: true
          }
        },
        plan: {
          select: {
            id: true,
            planType: true,
            price: true
          }
        }
      },
      orderBy: {
        Date_of_sale: 'desc'
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    // Calculate summary statistics
    const allReports = await prisma.dailyIncentiveReport.findMany({
      where,
      select: {
        id: true,
        secId: true,
        storeId: true,
        plan: {
          select: {
            price: true
          }
        }
      }
    });

    const uniqueSECs = new Set(allReports.filter(r => r.secId).map((report: any) => report.secId)).size;
    const uniqueStores = new Set(allReports.map((report: any) => report.storeId)).size;

    // Get unique stores and plans for filter options
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        city: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const plans = await prisma.plan.findMany({
      select: {
        planType: true
      },
      distinct: ['planType'],
      orderBy: {
        planType: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        salesReports: dailyReports.map((report: any) => ({
          id: report.id,
          createdAt: report.createdAt,
          submittedAt: report.Date_of_sale || report.createdAt,
          dateOfSale: report.Date_of_sale,
          imei: report.imei,
          planPrice: report.plan.price,
          devicePrice: report.samsungSKU.ModelPrice || 0,
          secUser: {
            secId: report.secUser?.employeeId || report.secUser?.id || 'Not Set',
            phone: report.secUser?.phone || 'Not Set',
            name: report.secUser?.fullName || 'Not Set'
          },
          store: {
            id: report.store.id,
            storeName: report.store.name,
            city: report.store.city || 'Not Set'
          },
          samsungSKU: {
            id: report.samsungSKU.id,
            Category: report.samsungSKU.Category,
            ModelName: report.samsungSKU.ModelName
          },
          plan: {
            id: report.plan.id,
            planType: report.plan.planType,
            price: report.plan.price
          },
          metadata: report.metadata
        })),
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        },
        summary: {
          totalReports: totalCount,
          uniqueSECs,
          uniqueStores
        },
        filterOptions: {
          stores: stores.map(store => ({
            id: store.id,
            name: store.name,
            city: store.city
          })),
          plans: plans.map(plan => plan.planType)
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/zopper-admin/monthly-incentive-report', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
