import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

// GET /api/ase/spot-incentive
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'ASE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ASE profile with assigned stores
    const aseProfile = await prisma.aSE.findUnique({
      where: { userId: authUser.id },
      select: {
        storeIds: true
      }
    });

    if (!aseProfile || !aseProfile.storeIds || aseProfile.storeIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          reports: [],
          summary: {
            activeStores: 0,
            activeSECs: 0,
            totalReports: 0,
            totalIncentive: 0,
            paidCount: 0,
            unpaidCount: 0,
            totalPendingIncentive: 0
          }
        }
      });
    }

    const { searchParams } = new URL(req.url);
    const planFilter = searchParams.get('planFilter') || '';
    const storeFilter = searchParams.get('storeFilter') || '';
    const deviceFilter = searchParams.get('deviceFilter') || '';
    const dateFilter = searchParams.get('dateFilter') || '';

    // Build where clause - only for ASE's assigned stores
    const where: any = {
      storeId: {
        in: aseProfile.storeIds
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

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.Date_of_sale = {
        gte: filterDate,
        lt: nextDay
      };
    }

    // Fetch spot incentive reports
    const spotReports = await prisma.spotIncentiveReport.findMany({
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
    const uniqueStores = new Set(spotReports.map(r => r.storeId)).size;
    const uniqueSECs = new Set(spotReports.map(r => r.secId)).size;
    const paidCount = spotReports.filter(r => r.spotincentivepaidAt).length;
    const unpaidCount = spotReports.filter(r => !r.spotincentivepaidAt).length;
    const totalIncentive = spotReports.reduce((sum, r) => sum + r.spotincentiveEarned, 0);
    const totalPendingIncentive = spotReports
      .filter(r => !r.spotincentivepaidAt)
      .reduce((sum, r) => sum + r.spotincentiveEarned, 0);

    return NextResponse.json({
      success: true,
      data: {
        reports: spotReports.map(report => ({
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
          isPaid: !!report.spotincentivepaidAt,
          paidAt: report.spotincentivepaidAt,
          voucherCode: report.voucherCode
        })),
        summary: {
          activeStores: uniqueStores,
          activeSECs: uniqueSECs,
          totalReports: spotReports.length,
          totalIncentive,
          paidCount,
          unpaidCount,
          totalPendingIncentive
        }
      }
    });
  } catch (error) {
    console.error('Error in GET /api/ase/spot-incentive', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}