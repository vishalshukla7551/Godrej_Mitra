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

    if (!secUser.storeId || !secUser.store) {
      return NextResponse.json(
        { error: 'SEC user not assigned to a store' },
        { status: 400 }
      );
    }

    // Get Daily Incentive Reports for Monthly tab (STORE LEVEL - all SECs at this store)
    const dailyReports: any = await prisma.dailyIncentiveReport.findMany({
      where: {
        storeId: secUser.storeId,
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



    // Get Spot Incentive Reports for Spot tab
    const spotReports: any = await prisma.spotIncentiveReport.findMany({
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

    // Get Samsung Incentive Info from Store
    // This contains monthly incentive data: { month: "MM-YYYY", samsungIncentiveAmount: Int, samsungIncentivePaidAt: Date | null }
    const samsungIncentiveInfo = (secUser.store.samsungIncentiveInfo as any[]) || [];
    
    console.log(`[Passbook] Found ${samsungIncentiveInfo.length} monthly incentive records for store ${secUser.storeId}`);

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

    // Monthly Sales Summary (from DailyIncentiveReport)
    const monthlySalesByDate: Record<string, { adld1Year: number; combo2Year: number }> = {};
    
    dailyReports.forEach((report: any) => {
      const date = formatDate(report.Date_of_sale || report.createdAt);
      const planType = report.plan.planType;
      
      if (!monthlySalesByDate[date]) {
        monthlySalesByDate[date] = { adld1Year: 0, combo2Year: 0 };
      }
      
      // Count units by plan type - check for ADLD or COMBO
      if (planType.includes('ADLD')) {
        monthlySalesByDate[date].adld1Year += 1;
      } else if (planType.includes('COMBO')) {
        monthlySalesByDate[date].combo2Year += 1;
      }
    });

    const monthlySalesSummary = Object.entries(monthlySalesByDate)
      .map(([date, counts]) => ({
        date,
        adld1Year: counts.adld1Year,
        combo2Year: counts.combo2Year,
        adld: counts.adld1Year,
        combo: counts.combo2Year,
        units: counts.adld1Year + counts.combo2Year,
      }))
      .sort((a, b) => {
        const dateA = a.date.split('-').reverse().join('-');
        const dateB = b.date.split('-').reverse().join('-');
        return dateB.localeCompare(dateA);
      });

    // Spot Sales Summary (from SpotIncentiveReport)
    const spotSalesByDate: Record<string, { adld1Year: number; combo2Year: number }> = {};
    
    spotReports.forEach((report: any) => {
      const date = formatDate(report.Date_of_sale || report.createdAt);
      const planType = report.plan.planType;
      
      if (!spotSalesByDate[date]) {
        spotSalesByDate[date] = { adld1Year: 0, combo2Year: 0 };
      }
      
      // Count units by plan type - check for ADLD or COMBO
      if (planType.includes('ADLD')) {
        spotSalesByDate[date].adld1Year += 1;
      } else if (planType.includes('COMBO')) {
        spotSalesByDate[date].combo2Year += 1;
      }
    });

    const spotSalesSummary = Object.entries(spotSalesByDate)
      .map(([date, counts]) => ({
        date,
        adld1Year: counts.adld1Year,
        combo2Year: counts.combo2Year,
        adld: counts.adld1Year,
        combo: counts.combo2Year,
        units: counts.adld1Year + counts.combo2Year,
      }))
      .sort((a, b) => {
        const dateA = a.date.split('-').reverse().join('-');
        const dateB = b.date.split('-').reverse().join('-');
        return dateB.localeCompare(dateA);
      });

    // Monthly Incentive Transactions (from DailyIncentiveReport)
    // Group daily reports by month and calculate incentives
    const monthlyReportsGrouped: Record<string, any[]> = {};
    
    dailyReports.forEach((report: any) => {
      const reportDate = new Date(report.Date_of_sale);
      const month = reportDate.getMonth() + 1;
      const year = reportDate.getFullYear();
      const monthKey = `${month.toString().padStart(2, '0')}-${year}`;
      
      if (!monthlyReportsGrouped[monthKey]) {
        monthlyReportsGrouped[monthKey] = [];
      }
      monthlyReportsGrouped[monthKey].push(report);
    });

    const monthlyTransactions = Object.entries(monthlyReportsGrouped)
      .map(([monthKey, reports]) => {
        const [monthStr, yearStr] = monthKey.split('-');
        const month = parseInt(monthStr, 10);
        const year = parseInt(yearStr, 10);
        const units = reports.length;
        
        // Find the latest sale date for this month
        const latestSaleDate = reports.reduce((latest, report) => {
          const saleDate = new Date(report.Date_of_sale);
          return saleDate > latest ? saleDate : latest;
        }, new Date(0)); // Start with epoch date
        
        // Calculate estimated incentive based on units and average plan prices
        // This is a simplified calculation - you can make it more sophisticated
        const avgPlanPrice = reports.reduce((sum, report) => sum + (report.plan?.price || 0), 0) / reports.length;
        const estimatedIncentive = Math.round(units * avgPlanPrice * 0.1); // 10% of plan price as example
        
        // Determine status
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        let status = 'Accumulated';
        if (month === currentMonth && year === currentYear) {
          status = 'Accumulated';
        } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
          status = 'Due';
        }

        // Check if there's corresponding Samsung incentive info for payment status
        const samsungInfo = samsungIncentiveInfo.find((info: any) => info.month === monthKey);
        if (samsungInfo?.samsungIncentivePaidAt) {
          status = 'Paid';
        }

        console.log(`[Passbook] Monthly transaction for ${monthKey}:`, {
          units,
          estimatedIncentive,
          status,
          reportsCount: reports.length
        });

        return {
          month: formatMonthYear(month, year),
          units,
          incentive: `₹${(samsungInfo?.samsungIncentiveAmount || estimatedIncentive).toLocaleString('en-IN')}`,
          status,
          paymentDate: samsungInfo?.samsungIncentivePaidAt 
            ? formatDate(new Date(samsungInfo.samsungIncentivePaidAt))
            : '',
          latestSaleDate: formatDate(latestSaleDate), // Latest sale date for this month
        };
      })
      .filter(transaction => transaction.units > 0) // Only show months with actual sales
      .sort((a, b) => {
        // Sort by date descending (newest first)
        return b.month.localeCompare(a.month);
      });

    // Spot Incentive Transactions (from SpotIncentiveReport)
    // Only show reports that have active campaigns (isCompaignActive = true)
    const spotTransactions = spotReports
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
          incentive: report.spotincentiveEarned > 0 ? `₹${report.spotincentiveEarned.toLocaleString('en-IN')}` : '-',
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
      
      // Calculate MONTHLY incentive stats from DailyIncentiveReport (STORE LEVEL)
      const fyStart = new Date(year, 3, 1); // April 1
      const fyEnd = new Date(year + 1, 2, 31); // March 31
      
      let monthlyUnits = 0;
      let monthlyEarned = 0;
      let monthlyPaid = 0;

      // Get daily reports for this FY
      const fyDailyReports = dailyReports.filter((report: any) => {
        const reportDate = new Date(report.Date_of_sale);
        return reportDate >= fyStart && reportDate <= fyEnd;
      });

      monthlyUnits = fyDailyReports.length;

      // Group by month to calculate incentives
      const fyMonthlyGroups: Record<string, any[]> = {};
      fyDailyReports.forEach((report: any) => {
        const reportDate = new Date(report.Date_of_sale);
        const month = reportDate.getMonth() + 1;
        const year = reportDate.getFullYear();
        const monthKey = `${month.toString().padStart(2, '0')}-${year}`;
        
        if (!fyMonthlyGroups[monthKey]) {
          fyMonthlyGroups[monthKey] = [];
        }
        fyMonthlyGroups[monthKey].push(report);
      });

      // Calculate earned and paid amounts
      Object.entries(fyMonthlyGroups).forEach(([monthKey, reports]) => {
        // Check if there's Samsung incentive info for this month
        const samsungInfo = samsungIncentiveInfo.find((info: any) => info.month === monthKey);
        
        if (samsungInfo) {
          const incentiveAmount = samsungInfo.samsungIncentiveAmount || 0;
          monthlyEarned += incentiveAmount;
          
          if (samsungInfo.samsungIncentivePaidAt) {
            monthlyPaid += incentiveAmount;
          }
        } else {
          // Estimate incentive if no Samsung info available
          const avgPlanPrice = reports.reduce((sum, report) => sum + (report.plan?.price || 0), 0) / reports.length;
          const estimatedIncentive = Math.round(reports.length * avgPlanPrice * 0.1);
          monthlyEarned += estimatedIncentive;
        }
      });

      const monthlyNet = monthlyEarned - monthlyPaid;

      monthlyFyStats[fy] = {
        units: monthlyUnits.toLocaleString('en-IN'),
        totalEarned: monthlyEarned > 0 ? `₹${monthlyEarned.toLocaleString('en-IN')}` : '-',
        paid: monthlyPaid > 0 ? `₹${monthlyPaid.toLocaleString('en-IN')}` : '-',
        net: monthlyNet > 0 ? `₹${monthlyNet.toLocaleString('en-IN')}` : '-',
      };

      // Calculate SPOT incentive stats for this FY
      // Only count reports that have spot incentive (i.e., had active campaigns)
      // Reuse fyStart and fyEnd from above (already defined for monthly stats)
      const fySpotReports = spotReports.filter((report: any) => {
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
        totalEarned: spotEarned > 0 ? `₹${spotEarned.toLocaleString('en-IN')}` : '-',
        paid: spotPaid > 0 ? `₹${spotPaid.toLocaleString('en-IN')}` : '-',
        net: spotNet > 0 ? `₹${spotNet.toLocaleString('en-IN')}` : '-',
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
        // SEC information
        sec: {
          id: secUser.id,
          fullName: secUser.fullName,
          phone: secUser.phone,
        },
        
        // Store information
        store: {
          id: secUser.store.id,
          name: secUser.store.name,
          city: secUser.store.city,
          state: secUser.store.city || null,
        },
        
        // Monthly incentive tab data
        monthlyIncentive: {
          salesSummary: monthlySalesSummary,
          transactions: monthlyTransactions,
          fyStats: monthlyFyStats,
        },
        
        // Spot incentive tab data
        spotIncentive: {
          salesSummary: spotSalesSummary,
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

