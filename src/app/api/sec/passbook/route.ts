import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserFromCookies } from '@/lib/auth';
import { IncentiveService } from '@/lib/services/IncentiveService';

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

    // Calculate incentives for months that don't have estimatedIncenetiveEarned
    // Wait for calculations to complete before returning data
    console.log(`[Passbook] Found ${salesSummaries.length} sales summaries for SEC ${secUser.id}`);
    
    const calculationPromises = [];
    
    for (const summary of salesSummaries) {
      const summaryAny = summary as any;
      console.log(`[Passbook] Summary ${summary.month}/${summary.year}:`, {
        estimatedIncenetiveEarned: summaryAny.estimatedIncenetiveEarned,
        totalSamsungIncentiveEarned: summary.totalSamsungIncentiveEarned,
        salesReportCount: summary.salesReport.length
      });
      
      // Always recalculate if not paid by Samsung (totalSamsungIncentiveEarned is null)
      // This ensures we always use the latest calculation logic
      const needsCalculation = summary.totalSamsungIncentiveEarned == null && summary.salesReport.length > 0;
      
      if (needsCalculation) {
        console.log(`[Passbook] Triggering (re)calculation for ${summary.month}/${summary.year} (current estimated: ${summaryAny.estimatedIncenetiveEarned})`);
        try {
          // Calculate incentive and wait for it
          const promise = IncentiveService.calculateMonthlyIncentive(
            secUser.id,
            summary.month,
            summary.year
          ).catch((err) => {
            console.error(`Failed to calculate incentive for ${summary.month}/${summary.year}:`, err);
            return null;
          });
          calculationPromises.push(promise);
        } catch (error) {
          console.error(`Error triggering incentive calculation for ${summary.month}/${summary.year}:`, error);
        }
      } else {
        console.log(`[Passbook] Skipping calculation for ${summary.month}/${summary.year} - already paid by Samsung`);
      }
    }

    // Wait for all calculations to complete
    if (calculationPromises.length > 0) {
      console.log(`[Passbook] Waiting for ${calculationPromises.length} calculations to complete...`);
      await Promise.all(calculationPromises);
      console.log(`[Passbook] All calculations completed`);
      
      // Re-fetch sales summaries to get updated values
      const updatedSalesSummaries = await prisma.salesSummary.findMany({
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
      
      // Use updated summaries for the rest of the response
      salesSummaries.length = 0;
      salesSummaries.push(...updatedSalesSummaries);
    }

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
    // Group sales by date and count units by product type
    const salesByDate: Record<string, { adld1Year: number; combo2Year: number }> = {};
    
    salesReports.forEach((report: any) => {
      const date = formatDate(report.Date_of_sale || report.createdAt);
      const planType = report.plan.planType;
      
      if (!salesByDate[date]) {
        salesByDate[date] = { adld1Year: 0, combo2Year: 0 };
      }
      
      // Count units by plan type - check for ADLD or COMBO
      // ADLD plans are typically 1 year, COMBO plans are typically 2 years
      if (planType.includes('ADLD')) {
        salesByDate[date].adld1Year += 1;
      } else if (planType.includes('COMBO')) {
        salesByDate[date].combo2Year += 1;
      }
    });

    // Convert to array and sort by date (newest first)
    const salesSummary = Object.entries(salesByDate)
      .map(([date, counts]) => ({
        date,
        adld1Year: counts.adld1Year,
        combo2Year: counts.combo2Year,
        units: counts.adld1Year + counts.combo2Year,
      }))
      .sort((a, b) => {
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

      // Use totalSamsungIncentiveEarned if not null, otherwise use estimatedIncenetiveEarned
      const incentiveAmount = summary.totalSamsungIncentiveEarned != null
        ? summary.totalSamsungIncentiveEarned
        : summary.estimatedIncenetiveEarned;

      console.log(`[Passbook] Monthly transaction for ${summary.month}/${summary.year}:`, {
        units,
        totalSamsungIncentiveEarned: summary.totalSamsungIncentiveEarned,
        estimatedIncenetiveEarned: summary.estimatedIncenetiveEarned,
        incentiveAmount,
        status
      });

      return {
        month: formatMonthYear(summary.month, summary.year),
        units,
        incentive: incentiveAmount != null
          ? `₹${incentiveAmount.toLocaleString('en-IN')}`
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

    // Calculate Financial Year Stats - Separate for Monthly and Spot
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // Determine current FY (assuming April to March)
    const currentFY = currentMonth >= 4 
      ? `FY-${String(currentYear).slice(-2)}`
      : `FY-${String(currentYear - 1).slice(-2)}`;

    const monthlyFyStats: Record<string, {
      units: string;
      totalEarned: string;
      paid: string;
      net: string;
    }> = {};

    const spotFyStats: Record<string, {
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

      // Calculate MONTHLY incentive stats
      let monthlyUnits = 0;
      let monthlyEarned = 0;
      let monthlyPaid = 0;

      fySummaries.forEach((summary: any) => {
        monthlyUnits += summary.salesReport.length;
        
        // Use totalSamsungIncentiveEarned if set, otherwise use estimatedIncenetiveEarned
        const incentiveAmount = summary.totalSamsungIncentiveEarned != null
          ? summary.totalSamsungIncentiveEarned
          : summary.estimatedIncenetiveEarned;
        
        if (incentiveAmount != null) {
          monthlyEarned += incentiveAmount;
          if (summary.samsungincentivepaidAt) {
            monthlyPaid += incentiveAmount;
          }
        }
      });

      const monthlyNet = monthlyEarned - monthlyPaid;

      monthlyFyStats[fy] = {
        units: monthlyUnits.toLocaleString('en-IN'),
        totalEarned: `₹${monthlyEarned.toLocaleString('en-IN')}`,
        paid: `₹${monthlyPaid.toLocaleString('en-IN')}`,
        net: `₹${monthlyNet.toLocaleString('en-IN')}`,
      };

      // Calculate SPOT incentive stats for this FY
      // Only count reports that have spot incentive (i.e., had active campaigns)
      const fyStart = new Date(year, 3, 1); // April 1
      const fyEnd = new Date(year + 1, 2, 31); // March 31
      
      const fySpotReports = salesReports.filter((report: any) => {
        const reportDate = new Date(report.Date_of_sale || report.createdAt);
        return reportDate >= fyStart && reportDate <= fyEnd && report.spotincentiveEarned > 0;
      });

      let spotUnits = 0;
      let spotEarned = 0;
      let spotPaid = 0;

      fySpotReports.forEach((report: any) => {
        spotUnits += 1;
        spotEarned += report.spotincentiveEarned;
        if (report.spotincentivepaidAt) {
          spotPaid += report.spotincentiveEarned;
        }
      });

      const spotNet = spotEarned - spotPaid;

      spotFyStats[fy] = {
        units: spotUnits.toLocaleString('en-IN'),
        totalEarned: `₹${spotEarned.toLocaleString('en-IN')}`,
        paid: `₹${spotPaid.toLocaleString('en-IN')}`,
        net: `₹${spotNet.toLocaleString('en-IN')}`,
      };
    }

    // Fill in missing FYs with zeros
    const allFYs = ['FY-25', 'FY-24', 'FY-23', 'FY-22', 'FY-21'];
    allFYs.forEach((fy) => {
      if (!monthlyFyStats[fy]) {
        monthlyFyStats[fy] = {
          units: '0',
          totalEarned: '₹0',
          paid: '₹0',
          net: '₹0',
        };
      }
      if (!spotFyStats[fy]) {
        spotFyStats[fy] = {
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
          fyStats: monthlyFyStats,
        },
        
        // Spot incentive tab data
        spotIncentive: {
          transactions: spotTransactions,
          fyStats: spotFyStats,
        },
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

