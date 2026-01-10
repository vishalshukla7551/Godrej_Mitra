import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPassbookWithDailyReports() {
  try {
    console.log('🧪 Testing SEC Passbook with DailyIncentiveReport data...\n');

    // Find a Canvasser user with daily incentive reports
    const canvasserUser = await prisma.canvasser.findFirst({
      where: {
        storeId: { not: null }
      },
      include: {
        store: true,
        dailyIncentiveReports: {
          include: {
            samsungSKU: true,
            plan: true
          },
          take: 10,
          orderBy: {
            Date_of_sale: 'desc'
          }
        }
      }
    });

    if (!secUser) {
      console.log('❌ No SEC user found with store assignment');
      return;
    }

    console.log(`✅ Found SEC user: ${secUser.phone}`);
    console.log(`   Store: ${secUser.store?.name || secUser.storeId}`);
    console.log(`   Daily Reports: ${secUser.dailyIncentiveReports.length}`);

    if (secUser.dailyIncentiveReports.length === 0) {
      console.log('⚠️  No daily incentive reports found for this SEC user');
      console.log('   You may need to import some daily reports first');
      return;
    }

    // Show sample daily reports
    console.log('\n📊 Sample Daily Incentive Reports:');
    secUser.dailyIncentiveReports.slice(0, 5).forEach((report, index) => {
      console.log(`   ${index + 1}. Date: ${report.Date_of_sale.toISOString().split('T')[0]}`);
      console.log(`      SKU: ${report.samsungSKU.ModelName} (₹${report.samsungSKU.ModelPrice})`);
      console.log(`      Plan: ${report.plan.planType} (₹${report.plan.price})`);
      console.log(`      IMEI: ${report.imei}`);
    });

    // Group reports by month to simulate what the API does
    const monthlyGroups: Record<string, any[]> = {};
    secUser.dailyIncentiveReports.forEach((report) => {
      const reportDate = new Date(report.Date_of_sale);
      const month = reportDate.getMonth() + 1;
      const year = reportDate.getFullYear();
      const monthKey = `${month.toString().padStart(2, '0')}-${year}`;
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = [];
      }
      monthlyGroups[monthKey].push(report);
    });

    console.log('\n📅 Monthly Grouping (for Previous Transactions):');
    Object.entries(monthlyGroups).forEach(([monthKey, reports]) => {
      const [monthStr, yearStr] = monthKey.split('-');
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[month - 1];
      const yearShort = year.toString().slice(-2);
      
      const avgPlanPrice = reports.reduce((sum, report) => sum + (report.plan?.price || 0), 0) / reports.length;
      const estimatedIncentive = Math.round(reports.length * avgPlanPrice * 0.1);
      
      console.log(`   ${monthName} ${yearShort}: ${reports.length} units, ~₹${estimatedIncentive.toLocaleString()} estimated incentive`);
    });

    console.log('\n✅ Test completed! The passbook API will now use this DailyIncentiveReport data');
    console.log('   for the "Previous Transactions" section instead of Store.samsungIncentiveInfo');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassbookWithDailyReports();