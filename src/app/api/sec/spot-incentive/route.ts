import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/sec/spot-incentive
 * Get spot incentive data for SEC user
 */
export async function GET(req: NextRequest) {
  try {
    const cookies = await (await import('next/headers')).cookies();
    const authUser = await getAuthenticatedUserFromCookies(cookies as any);

    if (!authUser || authUser.role !== 'SEC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const phone = authUser.username;
    if (!phone) {
      return NextResponse.json(
        { error: 'Missing SEC identifier' },
        { status: 400 }
      );
    }

    // Find SEC user
    const secUser = await prisma.sEC.findUnique({
      where: { phone },
    });

    if (!secUser) {
      return NextResponse.json(
        { error: 'SEC user not found' },
        { status: 404 }
      );
    }

    // Get all spot incentive reports for this SEC user
    const spotReports = await prisma.spotIncentiveReport.findMany({
      where: {
        secId: secUser.id,
      },
      include: {
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
      return `${dd}-${mm}-${yyyy}`;
    };

    // Transform data for frontend
    const transactions = spotReports.map((report) => {
      const planType = report.plan.planType;
      let planName = planType.replace(/_/g, ' ');

      return {
        id: report.id,
        date: formatDate(report.Date_of_sale),
        deviceName: report.samsungSKU.ModelName || report.samsungSKU.Category,
        planName: planName,
        incentive: `₹${report.spotincentiveEarned.toLocaleString('en-IN')}`,
        incentiveAmount: report.spotincentiveEarned,
        voucherCode: report.voucherCode || 'N/A',
        isPaid: !!report.spotincentivepaidAt,
        paidAt: report.spotincentivepaidAt 
          ? formatDate(report.spotincentivepaidAt)
          : null,
        isCompaignActive: report.isCompaignActive,
        storeName: report.store.name,
        storeCity: report.store.city,
        imei: report.imei,
      };
    });

    // Calculate summary statistics
    const totalEarned = spotReports.reduce((sum, report) => sum + report.spotincentiveEarned, 0);
    const totalPaid = spotReports
      .filter(report => report.spotincentivepaidAt)
      .reduce((sum, report) => sum + report.spotincentiveEarned, 0);
    const totalPending = totalEarned - totalPaid;
    const totalUnits = spotReports.length;
    const activeCampaignUnits = spotReports.filter(report => report.isCompaignActive).length;

    // Calculate Financial Year Stats
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const fyStats: Record<string, {
      units: string;
      totalEarned: string;
      paid: string;
      net: string;
    }> = {};

    // Calculate stats for each FY (April to March)
    for (let year = currentYear - 4; year <= currentYear; year++) {
      const fy = `FY-${String(year).slice(-2)}`;
      
      const fyStart = new Date(year, 3, 1); // April 1
      const fyEnd = new Date(year + 1, 2, 31); // March 31
      
      const fyReports = spotReports.filter((report) => {
        const reportDate = new Date(report.Date_of_sale);
        return reportDate >= fyStart && reportDate <= fyEnd;
      });

      let fyUnits = 0;
      let fyEarned = 0;
      let fyPaid = 0;

      fyReports.forEach((report) => {
        fyUnits += 1;
        fyEarned += report.spotincentiveEarned;
        if (report.spotincentivepaidAt) {
          fyPaid += report.spotincentiveEarned;
        }
      });

      const fyNet = fyEarned - fyPaid;

      fyStats[fy] = {
        units: fyUnits.toLocaleString('en-IN'),
        totalEarned: `₹${fyEarned.toLocaleString('en-IN')}`,
        paid: `₹${fyPaid.toLocaleString('en-IN')}`,
        net: `₹${fyNet.toLocaleString('en-IN')}`,
      };
    }

    // Fill in missing FYs with zeros
    const allFYs = ['FY-25', 'FY-24', 'FY-23', 'FY-22', 'FY-21'];
    allFYs.forEach((fy) => {
      if (!fyStats[fy]) {
        fyStats[fy] = {
          units: '0',
          totalEarned: '₹0',
          paid: '₹0',
          net: '₹0',
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        summary: {
          totalUnits,
          activeCampaignUnits,
          totalEarned: `₹${totalEarned.toLocaleString('en-IN')}`,
          totalPaid: `₹${totalPaid.toLocaleString('en-IN')}`,
          totalPending: `₹${totalPending.toLocaleString('en-IN')}`,
        },
        fyStats,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/sec/spot-incentive', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}