import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/zopper-admin/monthly-incentive-report
// Fetches monthly incentive report data from SalesReport schema
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

    const validationFilter = searchParams.get('validationFilter') || 'all';
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
        where.Date_of_sale.lte = new Date(endDate);
      }
    }

    // Store filter
    if (storeFilter) {
      where.store = {
        name: {
          contains: storeFilter,
          mode: 'insensitive' as any
        }
      };
    }

    // Plan filter
    if (planFilter) {
      where.plan = {
        planType: planFilter
      };
    }



    // Validation status filter
    if (validationFilter !== 'all') {
      const validationStatus = validationFilter.toUpperCase();
      where.metadata = {
        path: ['validationStatus'],
        equals: validationStatus
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
    const totalCount = await (prisma as any).salesReport.count({ where });

    // Fetch sales reports with all related data
    const salesReports = await (prisma as any).salesReport.findMany({
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
            city: true,
            state: true
          }
        },
        samsungSKU: {
          select: {
            id: true,
            Category: true,
            ModelName: true
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
    const allReports = await (prisma as any).salesReport.findMany({
      where,
      select: {
        spotincentiveEarned: true,
        spotincentivepaidAt: true,
        secId: true,
        storeId: true
      }
    });

    const totalIncentiveEarned = allReports.reduce((sum: number, report: any) => sum + report.spotincentiveEarned, 0);
    const totalIncentivePaid = allReports
      .filter((report: any) => report.spotincentivepaidAt)
      .reduce((sum: number, report: any) => sum + report.spotincentiveEarned, 0);
    const uniqueSECs = new Set(allReports.map((report: any) => report.secId)).size;
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
        salesReports: salesReports.map((report: any) => ({
          id: report.id,
          createdAt: report.createdAt,
          submittedAt: report.Date_of_sale || report.createdAt,
          dateOfSale: report.Date_of_sale,
          imei: report.imei,
          spotincentiveEarned: report.spotincentiveEarned,
          voucherCode: report.voucherCode,
          isPaid: !!report.spotincentivepaidAt,
          paidAt: report.spotincentivepaidAt,
          // Add validation status - using metadata to store validation info
          validationStatus: report.metadata?.validationStatus || 'NOT_VALIDATED',
          approvedBySamsung: report.metadata?.approvedBySamsung || false,
          secUser: {
            secId: report.secUser.id,
            phone: report.secUser.phone,
            name: report.secUser.fullName || 'Not Set'
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
          isCampaignActive: report.isCompaignActive || false
        })),
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        },
        summary: {
          totalReports: allReports.length,
          totalIncentiveEarned,
          totalIncentivePaid,
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

// POST /api/zopper-admin/monthly-incentive-report
// Validate or discard a sales report
export async function POST(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ZOPPER_ADMINISTRATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { reportId, action } = body; // action: 'validate' or 'discard'

    if (!reportId || !action) {
      return NextResponse.json(
        { error: 'Report ID and action are required' },
        { status: 400 }
      );
    }

    if (!['validate', 'discard'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "validate" or "discard"' },
        { status: 400 }
      );
    }

    // Update the sales report validation status
    const validationStatus = action === 'validate' ? 'VALIDATED' : 'DISCARDED';
    
    const updatedReport = await prisma.salesReport.update({
      where: { id: reportId },
      data: {
        metadata: {
          validationStatus,
          validatedAt: new Date().toISOString(),
          validatedBy: authUser.username
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Report ${action}d successfully`,
      reportId,
      validationStatus
    });
  } catch (error) {
    console.error('Error in POST /api/zopper-admin/monthly-incentive-report', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}