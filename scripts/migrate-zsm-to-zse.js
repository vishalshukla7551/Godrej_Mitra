const { MongoClient } = require('mongodb');

async function migrateZsmToZse() {
  const client = new MongoClient(process.env.DATABASE_URL);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db();
    
    // Update users with ZSM role to ZSE role
    console.log('🔍 Updating users with ZSM role to ZSE...');
    const userUpdateResult = await db.collection('User').updateMany(
      { role: 'ZSM' },
      { $set: { role: 'ZSE' } }
    );
    console.log(`✅ Updated ${userUpdateResult.modifiedCount} users from ZSM to ZSE role`);
    
    // Check if ZSM collection exists and migrate to ZSE
    console.log('🔍 Checking for ZSM collection...');
    const collections = await db.listCollections().toArray();
    const zsmCollection = collections.find(col => col.name === 'ZSM');
    
    if (zsmCollection) {
      console.log('📦 Found ZSM collection, migrating to ZSE...');
      
      // Get all ZSM documents
      const zsmDocs = await db.collection('ZSM').find({}).toArray();
      console.log(`Found ${zsmDocs.length} ZSM profiles to migrate`);
      
      if (zsmDocs.length > 0) {
        // Insert into ZSE collection
        await db.collection('ZSE').insertMany(zsmDocs);
        console.log(`✅ Inserted ${zsmDocs.length} documents into ZSE collection`);
        
        // Drop ZSM collection
        await db.collection('ZSM').drop();
        console.log('✅ Dropped ZSM collection');
      }
    } else {
      console.log('ℹ️  No ZSM collection found');
    }
    
    // Update ASE profiles to use zseId instead of zsmId
    console.log('🔍 Updating ASE profiles to use zseId...');
    const aseUpdateResult = await db.collection('ASE').updateMany(
      { zsmId: { $exists: true } },
      { $rename: { zsmId: 'zseId' } }
    );
    console.log(`✅ Updated ${aseUpdateResult.modifiedCount} ASE profiles to use zseId`);
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

migrateZsmToZse();