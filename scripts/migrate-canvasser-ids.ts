/**
 * Migration script to convert canvasserId from string to ObjectId in SpotIncentiveReport
 * Uses Prisma to connect to MongoDB
 */

import { prisma } from '@/lib/prisma';
import { ObjectId } from 'mongodb';

async function migrateCanvasserIds() {
  try {
    console.log('Starting migration of canvasserId from string to ObjectId...');

    // Get raw MongoDB connection through Prisma
    const db = (prisma as any).$db;
    const collection = db.collection('SpotIncentiveReport');

    // Find all documents where canvasserId is a string (not ObjectId)
    const stringCanvasserIds = await collection
      .find({
        canvasserId: { $type: 'string' }
      })
      .toArray();

    console.log(`Found ${stringCanvasserIds.length} documents with string canvasserId`);

    if (stringCanvasserIds.length === 0) {
      console.log('No documents to migrate');
      await prisma.$disconnect();
      return;
    }

    // Convert each document
    let successCount = 0;
    let errorCount = 0;

    for (const doc of stringCanvasserIds) {
      try {
        const stringId = doc.canvasserId;
        let objectId;

        // Try to convert string to ObjectId
        try {
          objectId = new ObjectId(stringId);
        } catch (e) {
          console.error(`Invalid ObjectId format: "${stringId}" in document ${doc._id}`);
          errorCount++;
          continue;
        }

        // Update the document
        const result = await collection.updateOne(
          { _id: doc._id },
          { $set: { canvasserId: objectId } }
        );

        if (result.modifiedCount === 1) {
          console.log(`✓ Updated document ${doc._id}: "${stringId}" → ObjectId`);
          successCount++;
        } else {
          console.warn(`⚠ Document ${doc._id} was not updated`);
        }
      } catch (error) {
        console.error(`Error updating document ${doc._id}:`, error);
        errorCount++;
      }
    }

    console.log(`\nMigration complete:`);
    console.log(`  ✓ Successfully converted: ${successCount}`);
    console.log(`  ✗ Errors: ${errorCount}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Migration failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

migrateCanvasserIds();
