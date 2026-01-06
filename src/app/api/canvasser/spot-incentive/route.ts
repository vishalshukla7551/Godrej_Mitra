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

    // Find SEC user with store information
    const secUser = await prisma.sEC.findUnique({
      where: { phone },
      include: {
        store: true,
      },
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
            PlanPrice: true, // Fixed: price -> PlanPrice
          },
        },
        store: {
          select: {
            name: true,
            city: true,
          },
        },
        godrejSKU: { // Fixed: samsungSKU -> godrejSKU
          select: {
            Category: true,
            // ModelName does not exist on GodrejSKU
          },
        },
      },
      orderBy: {
        Date_of_sale: 'desc',
      },
    });

    // Format date helper
    const formatDate = (date: Date) => {
      try {
        const d = new Date(date);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
      } catch (e) {
        return '';
      }
    };

    // Transform data for frontend
    const transactions = spotReports.map((report: any) => {
      const planType = report.plan?.planType || ''; // Handle potential null plan

      // Clean up plan name for display
      let planName = planType.replace(/_/g, ' ');

      // GodrejSKU only has Category
      const deviceName = report.godrejSKU?.Category || 'Unknown Device';

      return {
        id: report.id,
        date: formatDate(report.Date_of_sale),
        deviceName: deviceName,
        planName: planName,
        incentive: report.spotincentiveEarned > 0 ? `₹${report.spotincentiveEarned.toLocaleString('en-IN')}` : '-',
        incentiveAmount: report.spotincentiveEarned,
        voucherCode: report.voucherCode || 'N/A',
        isPaid: !!report.spotincentivepaidAt,
        paidAt: report.spotincentivepaidAt
          ? formatDate(report.spotincentivepaidAt)
          : null,
        isCompaignActive: report.isCompaignActive,
        storeName: report.store?.name || 'Unknown Store',
        storeCity: report.store?.city || '',
        imei: report.imei,
      };
    });

    // Calculate summary statistics
    const totalEarned = spotReports.reduce((sum: number, report: any) => sum + (report.spotincentiveEarned || 0), 0);
    const totalPaid = spotReports
      .filter((report: any) => report.spotincentivepaidAt)
      .reduce((sum: number, report: any) => sum + (report.spotincentiveEarned || 0), 0);
    const totalPending = totalEarned - totalPaid;
    const totalUnits = spotReports.length;
    const activeCampaignUnits = spotReports.filter((report: any) => report.isCompaignActive).length;

    // Generate sales summary data grouped by date with EW tracking
    const salesSummaryMap = new Map<string, {
      date: string;
      ew1: number;
      ew2: number;
      ew3: number;
      ew4: number;
      units: number;
    }>();

    spotReports.forEach((report: any) => {
      const dateKey = formatDate(report.Date_of_sale);
      const planType = report.plan?.planType || '';

      const isEW1 = planType.includes('1_YR');
      const isEW2 = planType.includes('2_YR');
      const isEW3 = planType.includes('3_YR');
      const isEW4 = planType.includes('4_YR');

      if (salesSummaryMap.has(dateKey)) {
        const existing = salesSummaryMap.get(dateKey)!;
        existing.units += 1;
        if (isEW1) existing.ew1 += 1;
        if (isEW2) existing.ew2 += 1;
        if (isEW3) existing.ew3 += 1;
        if (isEW4) existing.ew4 += 1;
      } else {
        salesSummaryMap.set(dateKey, {
          date: dateKey,
          ew1: isEW1 ? 1 : 0,
          ew2: isEW2 ? 1 : 0,
          ew3: isEW3 ? 1 : 0,
          ew4: isEW4 ? 1 : 0,
          units: 1,
        });
      }
    });

    const salesSummary = Array.from(salesSummaryMap.values())
      .sort((a, b) => {
        try {
          const dateA = new Date(a.date.split('-').reverse().join('-'));
          const dateB = new Date(b.date.split('-').reverse().join('-'));
          return dateB.getTime() - dateA.getTime(); // Most recent first
        } catch (e) {
          return 0;
        }
      });

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

      const fyReports = spotReports.filter((report: any) => {
        const reportDate = new Date(report.Date_of_sale);
        return reportDate >= fyStart && reportDate <= fyEnd;
      });

      let fyUnits = 0;
      let fyEarned = 0;
      let fyPaid = 0;

      fyReports.forEach((report: any) => {
        fyUnits += 1;
        const earned = report.spotincentiveEarned || 0;
        fyEarned += earned;
        if (report.spotincentivepaidAt) {
          fyPaid += earned;
        }
      });

      const fyNet = fyEarned - fyPaid;

      fyStats[fy] = {
        units: fyUnits.toLocaleString('en-IN'),
        totalEarned: fyEarned > 0 ? `₹${fyEarned.toLocaleString('en-IN')}` : '-',
        paid: fyPaid > 0 ? `₹${fyPaid.toLocaleString('en-IN')}` : '-',
        net: fyNet > 0 ? `₹${fyNet.toLocaleString('en-IN')}` : '-',
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
        // Add SEC and Store metadata
        sec: {
          id: secUser.id,
          fullName: secUser.fullName,
          phone: secUser.phone,
        },
        store: {
          id: secUser.store?.id,
          name: secUser.store?.name,
          city: secUser.store?.city,
          numberOfSec: secUser.store?.numberOfSec || 1,
        },
        // Spot incentive data
        transactions,
        salesSummary,
        summary: {
          totalUnits,
          activeCampaignUnits,
          totalEarned: totalEarned > 0 ? `₹${totalEarned.toLocaleString('en-IN')}` : '-',
          totalPaid: totalPaid > 0 ? `₹${totalPaid.toLocaleString('en-IN')}` : '-',
          totalPending: totalPending > 0 ? `₹${totalPending.toLocaleString('en-IN')}` : '-',
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