import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateAttachRates() {
  try {
    console.log('Cleaning up duplicate attach rate records...');

    // Get all attach rate records
    const allRecords = await prisma.periodicAttachRate.findMany({
      orderBy: {
        createdAt: 'desc' // Keep the most recent ones
      }
    });

    console.log(`Found ${allRecords.length} total records`);

    // Group by storeId
    const recordsByStore = new Map();
    for (const record of allRecords) {
      if (!recordsByStore.has(record.storeId)) {
        recordsByStore.set(record.storeId, []);
      }
      recordsByStore.get(record.storeId).push(record);
    }

    console.log(`Found ${recordsByStore.size} unique stores`);

    // Delete duplicates (keep only the first/most recent one for each store)
    let deletedCount = 0;
    for (const [storeId, records] of recordsByStore) {
      if (records.length > 1) {
        console.log(`Store ${storeId} has ${records.length} records, keeping the most recent one`);
        
        // Keep the first (most recent) record, delete the rest
        const recordsToDelete = records.slice(1);
        
        for (const record of recordsToDelete) {
          await prisma.periodicAttachRate.delete({
            where: { id: record.id }
          });
          deletedCount++;
          console.log(`Deleted duplicate record ${record.id} for store ${storeId}`);
        }
      }
    }

    console.log(`✅ Cleanup complete! Deleted ${deletedCount} duplicate records.`);
    
    // Show remaining records
    const remainingRecords = await prisma.periodicAttachRate.findMany();
    console.log(`Remaining records: ${remainingRecords.length}`);
    
    for (const record of remainingRecords) {
      console.log(`- Store ${record.storeId}: ${record.start} to ${record.end}, ${record.attachPercentage}%`);
    }

  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateAttachRates();