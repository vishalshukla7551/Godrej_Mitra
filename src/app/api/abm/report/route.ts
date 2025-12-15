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

    // Build where clause - only for ABM's assigned stores
    const where: any = {
      storeId: {
        in: abmProfile.storeIds
      }
    };

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
