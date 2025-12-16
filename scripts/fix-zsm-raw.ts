import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixZsmWithRawQuery() {
  try {
    console.log('🔍 Fixing ZSM role using raw queries...');
    
    // Update users with ZSM role to ZSE role using raw query
    const userUpdateResult = await prisma.$runCommandRaw({
      update: 'User',
      updates: [
        {
          q: { role: 'ZSM' },
          u: { $set: { role: 'ZSE' } },
          multi: true
        }
      ]
    });
    console.log('✅ Updated users with ZSM role to ZSE:', userUpdateResult);
    
    // Update ASE profiles to use zseId instead of zsmId
    const aseUpdateResult = await prisma.$runCommandRaw({
      update: 'ASE',
      updates: [
        {
          q: { zsmId: { $exists: true } },
          u: { $rename: { zsmId: 'zseId' } },
          multi: true
        }
      ]
    });
    console.log('✅ Updated ASE profiles to use zseId:', aseUpdateResult);
    
    // Check if ZSM collection exists
    const collections = await prisma.$runCommandRaw({
      listCollections: 1,
      filter: { name: 'ZSM' }
    });
    
    if ((collections as any).cursor.firstBatch.length > 0) {
      console.log('📦 Found ZSM collection, migrating to ZSE...');
      
      // Get all ZSM documents
      const zsmDocs = await prisma.$runCommandRaw({
        find: 'ZSM',
        filter: {}
      });
      
      const docs = (zsmDocs as any).cursor.firstBatch;
      console.log(`Found ${docs.length} ZSM profiles to migrate`);
      
      if (docs.length > 0) {
        // Insert into ZSE collection
        await prisma.$runCommandRaw({
          insert: 'ZSE',
          documents: docs
        });
        console.log(`✅ Inserted ${docs.length} documents into ZSE collection`);
        
        // Drop ZSM collection
        await prisma.$runCommandRaw({
          drop: 'ZSM'
        });
        console.log('✅ Dropped ZSM collection');
      }
    } else {
      console.log('ℹ️  No ZSM collection found');
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixZsmWithRawQuery();