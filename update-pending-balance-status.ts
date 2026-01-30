import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePendingBalanceStatus() {
  const imeis = ['7894561230741858', '7894561230741852'];

  console.log(`🔍 Checking ${imeis.length} IMEI(s) for PENDING_BALANCE status...`);

  for (const imei of imeis) {
    try {
      const report = await prisma.spotIncentiveReport.findUnique({
        where: { imei },
      });

      if (!report) {
        console.log(`❌ Report not found for IMEI: ${imei}`);
        continue;
      }

      console.log(`\n📋 Report found for IMEI: ${imei}`);
      console.log(`   ID: ${report.id}`);
      console.log(`   Transaction ID: ${report.transactionId}`);
      console.log(`   Current Metadata:`, JSON.stringify(report.transactionMetadata, null, 2));

      // Check if transactionMetadata has benepikResponse with code 1012
      const metadata = report.transactionMetadata as any;
      const benepikResponse = metadata?.benepikResponse;

      if (!benepikResponse) {
        console.log(`   ⚠️  No benepikResponse found in metadata`);
        continue;
      }

      // Handle nested structure: benepikResponse.data.batchResponse
      const responseData = benepikResponse?.data || benepikResponse;
      const batchResponses = responseData?.batchResponse || [];
      const topLevelCode = responseData?.code;

      console.log(`   Top-level code: ${topLevelCode}`);
      console.log(`   Batch responses found: ${batchResponses.length}`);

      const hasPendingBalance = 
        topLevelCode === 1000 && 
        batchResponses.some((batch: any) => batch.code === 1012 && batch.success === 0);

      if (hasPendingBalance) {
        console.log(`   ✅ Found PENDING_BALANCE (code 1012) in benepikResponse`);
        
        // Update metadata with status field
        const updatedMetadata = {
          ...metadata,
          status: 'PENDING_BALANCE',
        };

        await prisma.spotIncentiveReport.update({
          where: { imei },
          data: {
            transactionMetadata: updatedMetadata,
          },
        });

        console.log(`   ✅ Updated transactionMetadata with status: PENDING_BALANCE`);
      } else {
        console.log(`   ℹ️  No PENDING_BALANCE (code 1012) found in benepikResponse`);
        console.log(`   Batch responses:`, batchResponses.map((b: any) => ({ code: b.code, success: b.success })));
      }
    } catch (error) {
      console.error(`❌ Error processing IMEI ${imei}:`, error);
    }
  }

  console.log(`\n✅ Update complete`);
  await prisma.$disconnect();
}

updatePendingBalanceStatus()
  .catch(console.error)
  .finally(() => process.exit(0));
