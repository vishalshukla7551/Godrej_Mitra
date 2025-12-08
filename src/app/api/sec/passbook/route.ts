import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';

/**
 * GET /api/sec/passbook
 * Get passbook data for SEC user including:
 * - Sales Summary (common for both tabs)
 * - Monthly Incentive Transactions (from SalesSummary)
 * - Spot Incentive Transactions (from SalesReport)
 * - Financial Year Stats
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

    // Get all sales reports for this SEC user
    // Note: Using SalesReport model from schema (spotIncentiveSalesReport in old code)
    const salesReports: any = await (prisma.salesReport as any).findMany({
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

    // Get all sales summaries for this SEC user
    const salesSummaries = await prisma.salesSummary.findMany({
      where: {
        secId: secUser.id,
      },
      include: {
        salesReport: {
          select: {
            id: true,
            Date_of_sale: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });

    // Format date helper
    const formatDate = (date: Date) => {
      const d = new Date(date);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    };

    const formatMonthYear = (month: number, year: number) => {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
      ];
      return `${monthNames[month - 1]} ${year.toString().slice(-2)}`;
    };

    // Sales Summary (common for both tabs)
    // Group by date and aggregate units
    // Include all sales reports (both with and without campaigns)
    const salesSummaryMap = new Map<string, {
      date: string;
      adld: string;
      combo: string;
      units: number;
    }>();

    salesReports.forEach((report: any) => {
      const date = formatDate(report.Date_of_sale);
      const planType = report.plan.planType;
      
      // Determine ADLD and Combo from planType
      let adld = '';
      let combo = '';
      
      if (planType.includes('ADLD')) {
        adld = planType;
      }
      if (planType.includes('COMBO')) {
        combo = planType;
      }

      const key = `${date}_${adld}_${combo}`;
      if (salesSummaryMap.has(key)) {
        const existing = salesSummaryMap.get(key)!;
        existing.units += 1;
      } else {
        salesSummaryMap.set(key, {
          date,
          adld: adld || '-',
          combo: combo || '-',
          units: 1,
        });
      }
    });

    const salesSummary = Array.from(salesSummaryMap.values()).sort((a, b) => {
      const dateA = a.date.split('-').reverse().join('-');
      const dateB = b.date.split('-').reverse().join('-');
      return dateB.localeCompare(dateA);
    });

    // Monthly Incentive Transactions (from SalesSummary)
    // These show accumulated data for each month
    const monthlyTransactions = salesSummaries.map((summary: any) => {
      // Count units from related sales reports (all sales in that month)
      const units = summary.salesReport.length;
      
      // Determine status based on payment date
      let status = 'Accumulated';
      if (summary.samsungincentivepaidAt) {
        status = 'Paid';
      } else if (units > 0) {
        // Check if it's the current month
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        if (summary.month === currentMonth && summary.year === currentYear) {
          status = 'Accumulated';
        } else {
          status = 'Due';
        }
      }

      return {
        month: formatMonthYear(summary.month, summary.year),
        units,
        incentive: summary.totalSamsungIncentiveEarned 
          ? `₹${summary.totalSamsungIncentiveEarned.toLocaleString('en-IN')}`
          : 'Not calculated',
        status,
        paymentDate: summary.samsungincentivepaidAt 
          ? formatDate(summary.samsungincentivepaidAt)
          : '',
      };
    });

    // Spot Incentive Transactions (from SalesReport)
    // Only show reports that have active campaigns (isCompaignActive = true)
    const spotTransactions = salesReports
      .filter((report: any) => report.isCompaignActive === true && report.spotincentiveEarned > 0)
      .map((report: any) => {
        const planType = report.plan.planType;
        // Extract plan name from planType
        let planName = planType;
        if (planType.includes('COMBO')) {
          planName = planType.replace('_', ' ');
        }

        return {
          date: formatDate(report.Date_of_sale || report.submittedAt),
          deviceName: report.samsungSKU.ModelName || report.samsungSKU.Category,
          planName: planName,
          incentive: `₹${report.spotincentiveEarned.toLocaleString('en-IN')}`,
          voucherCode: report.voucherCode || '',
          isPaid: !!report.spotincentivepaidAt,
          paidAt: report.spotincentivepaidAt 
            ? formatDate(report.spotincentivepaidAt)
            : null,
        };
      })
      .sort((a: any, b: any) => {
        const dateA = a.date.split('-').reverse().join('-');
        const dateB = b.date.split('-').reverse().join('-');
        return dateB.localeCompare(dateA);
      });

    // Calculate Financial Year Stats
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // Determine current FY (assuming April to March)
    const currentFY = currentMonth >= 4 
      ? `FY-${String(currentYear).slice(-2)}`
      : `FY-${String(currentYear - 1).slice(-2)}`;

    const fyStats: Record<string, {
      units: string;
      totalEarned: string;
      paid: string;
      net: string;
    }> = {};

    // Calculate stats for each FY
    for (let year = currentYear - 4; year <= currentYear; year++) {
      const fy = year >= 2024 ? `FY-${String(year).slice(-2)}` : `FY-${String(year).slice(-2)}`;
      
      // Get summaries for this FY (April to March)
      const fySummaries = salesSummaries.filter((s: any) => {
        const summaryYear = s.year;
        const summaryMonth = s.month;
        
        // FY starts in April (month 4)
        if (summaryMonth >= 4) {
          return summaryYear === year;
        } else {
          return summaryYear === year + 1;
        }
      });

      // Calculate monthly incentive stats
      let totalUnits = 0;
      let totalEarned = 0;
      let totalPaid = 0;

      fySummaries.forEach((summary: any) => {
        totalUnits += summary.salesReport.length;
        // Add totalSamsungIncentiveEarned if set
        if (summary.totalSamsungIncentiveEarned != null) {
          totalEarned += summary.totalSamsungIncentiveEarned;
          if (summary.samsungincentivepaidAt) {
            totalPaid += summary.totalSamsungIncentiveEarned;
          }
        }
      });

      // Calculate spot incentive stats for this FY
      // Only count reports that have spot incentive (i.e., had active campaigns)
      const fyStart = new Date(year, 3, 1); // April 1
      const fyEnd = new Date(year + 1, 2, 31); // March 31
      
      const fySpotReports = salesReports.filter((report: any) => {
        const reportDate = new Date(report.Date_of_sale || report.createdAt);
        return reportDate >= fyStart && reportDate <= fyEnd && report.spotincentiveEarned > 0;
      });

      fySpotReports.forEach((report: any) => {
        totalEarned += report.spotincentiveEarned;
        if (report.spotincentivepaidAt) {
          totalPaid += report.spotincentiveEarned;
        }
      });

      const net = totalEarned - totalPaid;

      fyStats[fy] = {
        units: totalUnits.toLocaleString('en-IN'),
        totalEarned: `₹${totalEarned.toLocaleString('en-IN')}`,
        paid: `₹${totalPaid.toLocaleString('en-IN')}`,
        net: `₹${net.toLocaleString('en-IN')}`,
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
        // Common sales summary for both tabs
        salesSummary,
        
        // Monthly incentive tab data
        monthlyIncentive: {
          transactions: monthlyTransactions,
        },
        
        // Spot incentive tab data
        spotIncentive: {
          transactions: spotTransactions,
        },
        
        // Financial year stats (common for both tabs)
        fyStats,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/sec/passbook', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

