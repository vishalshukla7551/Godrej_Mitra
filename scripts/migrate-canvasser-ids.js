/**
 * Migration script to convert canvasserId from string to ObjectId in SpotIncentiveReport
 * Uses Prisma's raw MongoDB commands
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateCanvasserIds() {
  try {
    console.log('Starting migration of canvasserId from string to ObjectId...');

    // Use Prisma's raw query to find documents with string canvasserId
    const result = await prisma.$runCommandRaw({
      find: 'SpotIncentiveReport',
      filter: {
        canvasserId: { $type: 'string' }
      }
    });

    const docs = result.cursor.firstBatch || [];
    console.log(`Found ${docs.length} documents with string canvasserId`);

    if (docs.length === 0) {
      console.log('No documents to migrate');
      await prisma.$disconnect();
      return;
    }

    // Convert each document using updateMany
    let successCount = 0;

    for (const doc of docs) {
      try {
        const stringId = doc.canvasserId;
        
        // Use MongoDB aggregation pipeline to convert string to ObjectId
        const updateResult = await prisma.$runCommandRaw({
          update: 'SpotIncentiveReport',
          updates: [
            {
              q: { _id: doc._id },
              u: [
                {
                  $set: {
                    canvasserId: { $toObjectId: '$canvasserId' }
                  }
                }
              ]
            }
          ]
        });

        console.log(`✓ Updated document ${doc._id}: "${stringId}" → ObjectId`);
        successCount++;
      } catch (error) {
        console.error(`Error updating document ${doc._id}:`, error.message);
      }
    }

    console.log(`\nMigration complete:`);
    console.log(`  ✓ Successfully converted: ${successCount}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Migration failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

migrateCanvasserIds();
