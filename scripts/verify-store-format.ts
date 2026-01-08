import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyStoreFormat() {
  try {
    console.log('🔍 Verifying Store Data Format...\n');

    // Get total count
    const totalCount = await prisma.store.count();
    console.log(`📊 Total Stores: ${totalCount}`);

    // Get sample stores
    const sampleStores = await prisma.store.findMany({
      take: 15,
      orderBy: { id: 'asc' },
      select: { id: true, name: true, city: true, numberOfSec: true }
    });

    console.log('\n📋 Sample Store Records:');
    console.log('┌─────────────┬─────────────────────────────────┬─────────────────────┬──────┐');
    console.log('│ Store ID    │ Store Name                      │ City                │ SECs │');
    console.log('├─────────────┼─────────────────────────────────┼─────────────────────┼──────┤');
    
    sampleStores.forEach(store => {
      const id = store.id.padEnd(11);
      const name = (store.name || '').substring(0, 31).padEnd(31);
      const city = (store.city || 'N/A').substring(0, 19).padEnd(19);
      const secs = String(store.numberOfSec || 1).padStart(4);
      console.log(`│ ${id} │ ${name} │ ${city} │ ${secs} │`);
    });
    
    console.log('└─────────────┴─────────────────────────────────┴─────────────────────┴──────┘');

    // Verify ID format
    const allStores = await prisma.store.findMany({
      select: { id: true },
      orderBy: { id: 'asc' }
    });

    const validIdFormat = allStores.every(store => 
      /^store_\d{3}$/.test(store.id)
    );

    console.log(`\n✅ ID Format Check: ${validIdFormat ? 'PASSED' : 'FAILED'}`);
    console.log(`   Expected: store_001, store_002, etc.`);
    console.log(`   First ID: ${allStores[0]?.id}`);
    console.log(`   Last ID: ${allStores[allStores.length - 1]?.id}`);

    // Check for stores with codes in names (simplified)
    const allStoreNames = await prisma.store.findMany({
      select: { name: true }
    });
    
    const storesWithCodes = allStoreNames.filter(store => 
      store.name.includes('- (') || store.name.includes(' (')
    ).length;

    console.log(`\n📝 Stores with Codes: ${storesWithCodes}/${totalCount}`);
    console.log(`   Format: "STORE NAME - (CODE)"`);

    // Get unique cities count
    const uniqueCities = await prisma.store.findMany({
      select: { city: true },
      distinct: ['city'],
      where: {
        city: { not: null }
      }
    });

    console.log(`\n🏙️  Unique Cities: ${uniqueCities.length}`);

    console.log('\n🎉 Store format verification completed!');

  } catch (error) {
    console.error('❌ Error verifying store format:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
if (require.main === module) {
  verifyStoreFormat()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Verification failed:', error);
      process.exit(1);
    });
}

export { verifyStoreFormat };